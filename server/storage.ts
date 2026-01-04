import {
  colleges, users, seminars, registrations,
  type InsertCollege, type InsertUser, type InsertSeminar, type InsertRegistration,
  type College, type User, type Seminar, type Registration
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Colleges
  getColleges(): Promise<College[]>;
  createCollege(college: InsertCollege): Promise<College>;
  getCollege(id: number): Promise<College | undefined>;
  
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(collegeId: number, username: string): Promise<User | undefined>;
  getUsersByCollege(collegeId: number): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  
  // Seminars
  getSeminars(collegeId: number): Promise<Seminar[]>;
  getSeminar(id: number): Promise<Seminar | undefined>;
  getSeminarBySlug(slug: string): Promise<Seminar | undefined>;
  createSeminar(seminar: InsertSeminar): Promise<Seminar>;
  
  // Registrations
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  getRegistrations(seminarId: number): Promise<Registration[]>;
  getRegistrationBySeat(seminarId: number, row: number, col: number): Promise<Registration | undefined>;
  getRegistrationByUniqueId(uniqueId: string): Promise<Registration | undefined>;
  markAttendance(id: number): Promise<void>;
  
  // Stats
  getCollegeStats(collegeId: number): Promise<{
    totalSeminars: number;
    totalRegistrations: number;
    avgAttendance: number;
  }>;
}

export class MemStorage implements IStorage {
  private colleges: Map<number, College>;
  private users: Map<number, User>;
  private seminars: Map<number, Seminar>;
  private registrations: Map<number, Registration>;
  private currentId: { [key: string]: number };

  constructor() {
    this.colleges = new Map();
    this.users = new Map();
    this.seminars = new Map();
    this.registrations = new Map();
    this.currentId = { colleges: 1, users: 1, seminars: 1, registrations: 1 };
    
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Create Demo College
    const collegeId = this.currentId.colleges++;
    const college: College = {
        id: collegeId,
        name: "Demo College",
        superAdminUsername: "superadmin",
        superAdminPassword: "password", 
        createdAt: new Date()
    };
    this.colleges.set(college.id, college);

    // Create Users
    const superUser: User = {
        id: this.currentId.users++,
        collegeId: college.id,
        username: "superadmin",
        password: "password",
        role: "superadmin",
        createdAt: new Date()
    };
    this.users.set(superUser.id, superUser);

    const adminUser: User = {
        id: this.currentId.users++,
        collegeId: college.id,
        username: "admin",
        password: "password",
        role: "admin",
        createdAt: new Date()
    };
    this.users.set(adminUser.id, adminUser);

    const guardUser: User = {
        id: this.currentId.users++,
        collegeId: college.id,
        username: "guard",
        password: "password",
        role: "guard",
        createdAt: new Date()
    };
    this.users.set(guardUser.id, guardUser);

    // Create Seminar
    const seminarId = this.currentId.seminars++;
    const seminar: Seminar = {
        id: seminarId,
        collegeId: college.id,
        slug: "ai-in-education",
        title: "AI in Education",
        description: "Exploring the future of AI in classrooms.",
        date: "2024-05-20",
        time: "10:00 AM",
        venue: "Main Auditorium",
        thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
        rows: 10,
        cols: 10,
        createdAt: new Date()
    };
    this.seminars.set(seminar.id, seminar);
    
    // Create Registrations
    const regId = this.currentId.registrations++;
    const reg1: Registration = {
        id: regId,
        seminarId: seminar.id,
        studentName: "John Doe",
        email: "john@example.com",
        phone: "1234567890",
        collegeName: "Demo College",
        course: "CS",
        semester: "6",
        seatRow: 1,
        seatCol: 1,
        attended: false,
        uniqueId: "ABC12345",
        createdAt: new Date()
    };
    this.registrations.set(reg1.id, reg1);
  }

  async getColleges(): Promise<College[]> {
    return Array.from(this.colleges.values());
  }

  async createCollege(insertCollege: InsertCollege): Promise<College> {
    const id = this.currentId.colleges++;
    const college: College = { ...insertCollege, id, createdAt: new Date() };
    this.colleges.set(id, college);
    return college;
  }

  async getCollege(id: number): Promise<College | undefined> {
    return this.colleges.get(id);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(collegeId: number, username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.collegeId === collegeId && user.username === username
    );
  }

  async getUsersByCollege(collegeId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.collegeId === collegeId
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async getSeminars(collegeId: number): Promise<Seminar[]> {
    return Array.from(this.seminars.values()).filter(
      (seminar) => seminar.collegeId === collegeId
    );
  }

  async getSeminar(id: number): Promise<Seminar | undefined> {
    return this.seminars.get(id);
  }

  async getSeminarBySlug(slug: string): Promise<Seminar | undefined> {
    return Array.from(this.seminars.values()).find(
      (seminar) => seminar.slug === slug
    );
  }

  async createSeminar(insertSeminar: InsertSeminar): Promise<Seminar> {
    const id = this.currentId.seminars++;
    const seminar: Seminar = { ...insertSeminar, id, createdAt: new Date() };
    this.seminars.set(id, seminar);
    return seminar;
  }

  async createRegistration(insertRegistration: InsertRegistration): Promise<Registration> {
    const id = this.currentId.registrations++;
    const uniqueId = randomUUID().split('-')[0].toUpperCase();
    const registration: Registration = { 
        ...insertRegistration, 
        id, 
        uniqueId, 
        attended: false,
        createdAt: new Date() 
    };
    this.registrations.set(id, registration);
    return registration;
  }

  async getRegistrations(seminarId: number): Promise<Registration[]> {
    return Array.from(this.registrations.values()).filter(
      (reg) => reg.seminarId === seminarId
    );
  }

  async getRegistrationBySeat(seminarId: number, row: number, col: number): Promise<Registration | undefined> {
    return Array.from(this.registrations.values()).find(
      (reg) => reg.seminarId === seminarId && reg.seatRow === row && reg.seatCol === col
    );
  }

  async getRegistrationByUniqueId(uniqueId: string): Promise<Registration | undefined> {
    return Array.from(this.registrations.values()).find(
      (reg) => reg.uniqueId === uniqueId
    );
  }

  async markAttendance(id: number): Promise<void> {
    const registration = this.registrations.get(id);
    if (registration) {
      registration.attended = true;
      this.registrations.set(id, registration);
    }
  }

  async getCollegeStats(collegeId: number): Promise<{
    totalSeminars: number;
    totalRegistrations: number;
    avgAttendance: number;
  }> {
    const collegeSeminars = await this.getSeminars(collegeId);
    const totalSeminars = collegeSeminars.length;

    if (totalSeminars === 0) {
      return { totalSeminars: 0, totalRegistrations: 0, avgAttendance: 0 };
    }

    let totalRegistrations = 0;
    let attendedRegistrations = 0;

    for (const seminar of collegeSeminars) {
      const regs = await this.getRegistrations(seminar.id);
      totalRegistrations += regs.length;
      attendedRegistrations += regs.filter(r => r.attended).length;
    }

    const avgAttendance = totalRegistrations > 0 
      ? Math.round((attendedRegistrations / totalRegistrations) * 100) 
      : 0;

    return {
      totalSeminars,
      totalRegistrations,
      avgAttendance
    };
  }
}

export const storage = new MemStorage();
