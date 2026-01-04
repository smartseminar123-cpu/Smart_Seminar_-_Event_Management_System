import { db } from "./db";
import {
  colleges, users, seminars, registrations,
  type InsertCollege, type InsertUser, type InsertSeminar, type InsertRegistration,
  type College, type User, type Seminar, type Registration
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
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

export class DatabaseStorage implements IStorage {
  // Colleges
  async getColleges(): Promise<College[]> {
    return await db.select().from(colleges);
  }
  
  async createCollege(college: InsertCollege): Promise<College> {
    const [newCollege] = await db.insert(colleges).values(college).returning();
    return newCollege;
  }

  async getCollege(id: number): Promise<College | undefined> {
    const [college] = await db.select().from(colleges).where(eq(colleges.id, id));
    return college;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(collegeId: number, username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(
        eq(users.collegeId, collegeId),
        eq(users.username, username)
      )
    );
    return user;
  }

  async getUsersByCollege(collegeId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.collegeId, collegeId));
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Seminars
  async getSeminars(collegeId: number): Promise<Seminar[]> {
    return await db.select().from(seminars).where(eq(seminars.collegeId, collegeId));
  }

  async getSeminarBySlug(slug: string): Promise<Seminar | undefined> {
    const [seminar] = await db.select().from(seminars).where(eq(seminars.slug, slug));
    return seminar;
  }

  async getSeminar(id: number): Promise<Seminar | undefined> {
    const [seminar] = await db.select().from(seminars).where(eq(seminars.id, id));
    return seminar;
  }

  async getSeminarBySlug(slug: string): Promise<Seminar | undefined> {
    const [seminar] = await db.select().from(seminars).where(eq(seminars.slug, slug));
    return seminar;
  }

  async createSeminar(seminar: InsertSeminar): Promise<Seminar> {
    const [newSeminar] = await db.insert(seminars).values(seminar).returning();
    return newSeminar;
  }

  // Registrations
  async createRegistration(registration: InsertRegistration): Promise<Registration> {
    // Generate unique ID if not provided (though schema default handles randomUUID, our schema uses text for uniqueId)
    const uniqueId = randomUUID().split('-')[0].toUpperCase(); 
    const [newReg] = await db.insert(registrations).values({
      ...registration,
      uniqueId
    }).returning();
    return newReg;
  }

  async getRegistrations(seminarId: number): Promise<Registration[]> {
    return await db.select().from(registrations).where(eq(registrations.seminarId, seminarId));
  }

  async getRegistrationBySeat(seminarId: number, row: number, col: number): Promise<Registration | undefined> {
    const [reg] = await db.select().from(registrations).where(
      and(
        eq(registrations.seminarId, seminarId),
        eq(registrations.seatRow, row),
        eq(registrations.seatCol, col)
      )
    );
    return reg;
  }

  async getRegistrationByUniqueId(uniqueId: string): Promise<Registration | undefined> {
    const [reg] = await db.select().from(registrations).where(eq(registrations.uniqueId, uniqueId));
    return reg;
  }

  async markAttendance(id: number): Promise<void> {
    await db.update(registrations).set({ attended: true }).where(eq(registrations.id, id));
  }

  // Stats
  async getCollegeStats(collegeId: number): Promise<{
    totalSeminars: number;
    totalRegistrations: number;
    avgAttendance: number;
  }> {
    // Get seminars for college
    const collegeSeminars = await this.getSeminars(collegeId);
    const totalSeminars = collegeSeminars.length;
    
    if (totalSeminars === 0) {
      return { totalSeminars: 0, totalRegistrations: 0, avgAttendance: 0 };
    }

    const seminarIds = collegeSeminars.map(s => s.id);
    // Simple mock stat calculation since Drizzle aggregation can be verbose
    // In production use SQL aggregation
    let totalRegistrations = 0;
    let attendedRegistrations = 0;

    for (const semId of seminarIds) {
      const regs = await this.getRegistrations(semId);
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

export const storage = new DatabaseStorage();
