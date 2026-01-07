import { db } from "./firebase";
import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, 
  query, where, orderBy, limit, setDoc, Timestamp 
} from "firebase/firestore";

// Helper to get row letter (1->A, 2->B, etc.)
const getRowLabel = (index) => String.fromCharCode(65 + index - 1);
// Helper to get row index (A->1, B->2, etc.)
const getRowIndex = (label) => label.charCodeAt(0) - 64;

class LocalDB {
    // === SEEDING ===
    async seed() {
        try {
            const collegesRef = collection(db, "colleges");
            const snapshot = await getDocs(collegesRef);
            
            if (snapshot.empty) {
                console.log("Seeding database...");
                // Create College
                const collegeRef = await this.createCollege({
                    name: "Tech Institute of Science",
                    superAdminUsername: "superadmin",
                    superAdminPassword: "password123"
                });
                
                // createCollege returns the new college object with id
                const collegeId = collegeRef.id;

                // Create Admin
                await this.createUser({
                    collegeId: collegeId,
                    username: "admin",
                    password: "password123",
                    role: "admin"
                });

                // Create Guard
                await this.createUser({
                    collegeId: collegeId,
                    username: "guard",
                    password: "password123",
                    role: "guard"
                });

                // Create Hall (for testing "Use Existing Hall")
                const hall = await this.createHall({
                    collegeId: collegeId,
                    hallName: "Main Auditorium",
                    rows: { "A": 10, "B": 10, "C": 12 } // App format
                });

                // Create Seminar (Custom Grid)
                await this.createSeminar({
                    collegeId: collegeId,
                    title: "AI & Future of Tech",
                    description: "A deep dive into Artificial Intelligence trends.",
                    date: "2025-05-15",
                    time: "10:00",
                    venue: "Conference Room 1",
                    rows: 10,
                    cols: 10,
                    slug: "ai-future-tech",
                    thumbnail: "",
                    seatingSource: "GRID",
                    rowConfig: { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10 } // App format
                });
                
                console.log("Seeding complete.");
            }
        } catch (error) {
            console.error("Error seeding database:", error);
        }
    }

    // === COLLEGES ===
    async getColleges() {
        const colRef = collection(db, "colleges");
        const snapshot = await getDocs(colRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getCollege(id) {
        if (!id) return null;
        const docRef = doc(db, "colleges", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    }

    async createCollege(insertCollege) {
        // insertCollege: { name, superAdminUsername, superAdminPassword }
        const colRef = collection(db, "colleges");
        const newCollege = {
            name: insertCollege.name,
            createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(colRef, newCollege);
        
        // Auto-create super admin
        await this.createUser({
            collegeId: docRef.id,
            username: insertCollege.superAdminUsername,
            password: insertCollege.superAdminPassword,
            role: "superadmin"
        });

        return { id: docRef.id, ...newCollege };
    }

    // === USERS ===
    async createUser(insertUser) {
        // insertUser: { collegeId, username, password, role }
        const usersRef = collection(db, "users");
        // Check if username exists? (Optional but good)
        // For now, blindly add as per local-db logic
        const newUser = {
            collegeId: insertUser.collegeId,
            username: insertUser.username,
            role: insertUser.role,
            // Storing plaintext password as requested by prompt "keep plaintext only if already used"
            passwordHash: insertUser.password, 
            createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(usersRef, newUser);
        return { id: docRef.id, ...newUser };
    }

    async getUsersByCollege(collegeId) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("collegeId", "==", collegeId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // === AUTH ===
    async login(creds) {
        // creds: { collegeId, username, password }
        const usersRef = collection(db, "users");
        const q = query(
            usersRef, 
            where("collegeId", "==", creds.collegeId),
            where("username", "==", creds.username)
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            throw new Error("Invalid credentials");
        }

        // Check password (finding the first match)
        const userDoc = snapshot.docs.find(d => d.data().passwordHash === creds.password);
        
        if (!userDoc) {
            throw new Error("Invalid credentials");
        }

        const user = { id: userDoc.id, ...userDoc.data() };
        const college = await this.getCollege(creds.collegeId);

        if (!college) {
             throw new Error("College not found");
        }

        let redirectUrl = "/";
        if (user.role === "superadmin") redirectUrl = "/superadmin/dashboard";
        if (user.role === "admin") redirectUrl = "/admin/dashboard";
        if (user.role === "guard") redirectUrl = "/guard/dashboard";

        return { user, college, redirectUrl };
    }

    // === SEMINARS ===
    async getSeminars(collegeId) {
        const seminarsRef = collection(db, "seminars");
        const q = query(seminarsRef, where("collegeId", "==", collegeId));
        const snapshot = await getDocs(q);
        
        // We don't need to resolve layouts for the list view, but it doesn't hurt to be consistent.
        // However, for performance, we might skip fetching halls here unless strictly needed.
        // The AdminDashboard only displays title, date, etc.
        return snapshot.docs.map(doc => {
             const data = doc.data();
             // Ensure defaults
             return { id: doc.id, ...data };
        });
    }

    async getSeminar(id) {
        if (!id) return null;
        const docRef = doc(db, "seminars", id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;

        return this._resolveSeminarLayout({ id: docSnap.id, ...docSnap.data() });
    }

    async getSeminarBySlug(slug) {
        const seminarsRef = collection(db, "seminars");
        const q = query(seminarsRef, where("slug", "==", slug), limit(1));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) return null;
        const docSnap = snapshot.docs[0];
        
        return this._resolveSeminarLayout({ id: docSnap.id, ...docSnap.data() });
    }

    // Helper to resolve hall layout if needed
    async _resolveSeminarLayout(seminar) {
        if (seminar.hallId) {
            // Fetch Hall
            try {
                const hallRef = doc(db, "halls", seminar.hallId);
                const hallSnap = await getDoc(hallRef);
                
                if (hallSnap.exists()) {
                    const hallData = hallSnap.data();
                    // Convert Firestore Hall Rows [{rowLabel: 'A', seats: 10}] to App rowConfig {1: 10}
                    const rowConfig = {};
                    let maxCol = 0;
                    let maxRow = 0;

                    if (hallData.rows && Array.isArray(hallData.rows)) {
                        hallData.rows.forEach(r => {
                            const rowIdx = getRowIndex(r.rowLabel);
                            rowConfig[rowIdx] = r.seats;
                            if (r.seats > maxCol) maxCol = r.seats;
                            if (rowIdx > maxRow) maxRow = rowIdx;
                        });
                    }

                    return {
                        ...seminar,
                        rowConfig,
                        rows: maxRow,
                        cols: maxCol,
                        totalSeats: hallData.totalSeats
                    };
                }
            } catch (e) {
                console.error("Failed to resolve hall for seminar", e);
            }
        }
        
        // Fallback or Custom Grid (seatingLayout stored in seminar)
        // Map seatingLayout (if exists) to rowConfig for App
        // The app uses rowConfig in SeatingGrid
        const rowConfig = seminar.seatingLayout || seminar.rowConfig || {};
        
        return {
            ...seminar,
            rowConfig
        };
    }

    async createSeminar(insertSeminar) {
        // insertSeminar: { collegeId, title, ..., rowConfig, hallId, ... }
        const seminarsRef = collection(db, "seminars");
        
        const newSeminar = {
            collegeId: insertSeminar.collegeId,
            title: insertSeminar.title,
            description: insertSeminar.description,
            date: insertSeminar.date,
            time: insertSeminar.time,
            venue: insertSeminar.venue,
            slug: insertSeminar.slug,
            thumbnail: insertSeminar.thumbnail || "",
            createdAt: new Date().toISOString(),
            // Basic seats info (might be overwritten by hall logic on read)
            totalSeats: insertSeminar.totalSeats || 0,
            rows: insertSeminar.rows || 0,
            cols: insertSeminar.cols || 0
        };

        if (insertSeminar.hallId) {
            newSeminar.hallId = insertSeminar.hallId;
            // seatingLayout auto-derived, so we don't store it
            newSeminar.seatingLayout = null; 
        } else {
            // Custom Grid
            // Store rowConfig as seatingLayout
            newSeminar.seatingLayout = insertSeminar.rowConfig;
        }

        const docRef = await addDoc(seminarsRef, newSeminar);
        return { id: docRef.id, ...newSeminar };
    }

    async getCollegeStats(collegeId) {
        // Simple stats
        const seminars = await this.getSeminars(collegeId);
        return {
            totalSeminars: seminars.length,
            averageAttendance: 85,
            popularType: "Tech Workshop",
            suggestion: "Schedule seminars on Saturday mornings for higher turnout."
        };
    }

    // === HALLS ===
    async getHalls(collegeId) {
        const hallsRef = collection(db, "halls");
        const q = query(hallsRef, where("collegeId", "==", collegeId));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => {
            const data = doc.data();
            // Convert Firestore Rows [{rowLabel: 'A', seats: 10}] to App Rows { "A": 10 }
            const rowsMap = {};
            if (data.rows && Array.isArray(data.rows)) {
                data.rows.forEach(r => {
                    rowsMap[r.rowLabel] = r.seats;
                });
            }
            return { id: doc.id, ...data, rows: rowsMap };
        });
    }

    async createHall(insertHall) {
        // insertHall: { collegeId, hallName, rows: { "A": 10, ... }, totalSeats }
        const hallsRef = collection(db, "halls");
        
        // Convert App Rows { "A": 10 } to Firestore Rows [{rowLabel: 'A', seats: 10}]
        const firestoreRows = Object.entries(insertHall.rows || {}).map(([label, seats]) => ({
            rowLabel: label,
            seats: Number(seats)
        }));

        const newHall = {
            collegeId: insertHall.collegeId,
            hallName: insertHall.hallName, // Prompt says 'name', App uses 'hallName'. I'll use 'hallName' to match app usage, or map it.
            // Wait, Prompt Data Model says: "name".
            // App uses "hallName".
            // I should stick to Prompt Data Model "name" for Firestore, but map it for App.
            name: insertHall.hallName, 
            rows: firestoreRows,
            totalSeats: insertHall.totalSeats,
            createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(hallsRef, newHall);
        
        // Return in App format
        return { 
            id: docRef.id, 
            ...insertHall 
        };
    }

    // === REGISTRATIONS ===
    async createRegistration(input) {
        // input: { seminarId, seatRow, seatCol, studentName, ... }
        const regsRef = collection(db, "registrations");
        
        // Generate seatId "A-5"
        const rowLabel = getRowLabel(input.seatRow);
        const seatId = `${rowLabel}-${input.seatCol}`;

        // Check for existing seat
        // Query registrations where seminarId == X AND seatId == Y
        const q = query(
            regsRef, 
            where("seminarId", "==", input.seminarId),
            where("seatId", "==", seatId)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            throw new Error("Seat already taken");
        }

        const uniqueId = Math.random().toString(36).substring(2, 10).toUpperCase();
        
        const newReg = {
            seminarId: input.seminarId,
            seatId: seatId,
            studentName: input.studentName,
            email: input.email,
            phone: input.phone,
            collegeName: input.collegeName || "",
            course: input.course || "",
            semester: input.semester || "",
            attended: false,
            qrCodeData: uniqueId, // Using uniqueId as QR data
            createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(regsRef, newReg);
        
        // Return in App format (including seatRow/Col)
        return { 
            id: docRef.id, 
            uniqueId, 
            ...newReg,
            seatRow: input.seatRow,
            seatCol: input.seatCol
        };
    }

    async getRegistrations(seminarId) {
        const regsRef = collection(db, "registrations");
        const q = query(regsRef, where("seminarId", "==", seminarId));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => {
            const data = doc.data();
            // Parse seatId "A-5" back to seatRow, seatCol
            let seatRow = 0;
            let seatCol = 0;
            if (data.seatId) {
                const parts = data.seatId.split('-');
                if (parts.length === 2) {
                    seatRow = getRowIndex(parts[0]);
                    seatCol = parseInt(parts[1]);
                }
            }

            return { 
                id: doc.id, 
                uniqueId: data.qrCodeData, // Map back
                ...data,
                seatRow,
                seatCol
            };
        });
    }

    async verifyAttendance(req) {
        // req: { uniqueId }
        const regsRef = collection(db, "registrations");
        const q = query(regsRef, where("qrCodeData", "==", req.uniqueId), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
             return { valid: false, message: "Invalid Ticket ID" };
        }

        const docSnap = snapshot.docs[0];
        const data = docSnap.data();

        if (data.attended) {
            return { valid: false, message: "Ticket Already Used", registration: data };
        }

        // Mark as attended
        await updateDoc(doc(db, "registrations", docSnap.id), {
            attended: true
        });

        return { valid: true, message: "Attendance Verified", registration: { ...data, attended: true } };
    }
}

export const localDB = new LocalDB();
// Trigger seed (it checks if empty internally)
localDB.seed();
