import { z } from "zod";
// === COLLEGES ===
export const collegeSchema = z.object({
    id: z.number(),
    name: z.string().min(1, "College name is required"),
    superAdminUsername: z.string().min(1, "Username is required"),
    superAdminPassword: z.string().min(1, "Password is required"),
    createdAt: z.date().or(z.string()).optional(),
});
export const insertCollegeSchema = collegeSchema.omit({ id: true, createdAt: true });
// === USERS ===
export const userSchema = z.object({
    id: z.number(),
    collegeId: z.number(),
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    role: z.enum(["superadmin", "admin", "guard"]),
    createdAt: z.date().or(z.string()).optional(),
});
export const insertUserSchema = userSchema.omit({ id: true, createdAt: true });
// === SEMINARS ===
export const seminarSchema = z.object({
    id: z.number(),
    collegeId: z.number(),
    slug: z.string().min(1, "Slug is required"),
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    date: z.string().min(1, "Date is required"),
    time: z.string().min(1, "Time is required"),
    venue: z.string().min(1, "Venue is required"),
    thumbnail: z.string().optional().nullable(),
    rows: z.number().int().positive(),
    cols: z.number().int().positive(),
    createdAt: z.date().or(z.string()).optional(),
});
export const insertSeminarSchema = seminarSchema.omit({ id: true, createdAt: true });
// === REGISTRATIONS ===
export const registrationSchema = z.object({
    id: z.number(),
    seminarId: z.number(),
    studentName: z.string().min(1, "Student name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(1, "Phone number is required"),
    collegeName: z.string().optional().nullable(),
    course: z.string().optional().nullable(),
    semester: z.string().optional().nullable(),
    seatRow: z.number().int(),
    seatCol: z.number().int(),
    attended: z.boolean().default(false),
    uniqueId: z.string(),
    createdAt: z.date().or(z.string()).optional(),
});
export const insertRegistrationSchema = registrationSchema.omit({ id: true, createdAt: true, attended: true, uniqueId: true });
