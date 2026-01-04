import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const colleges = pgTable("colleges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  superAdminUsername: text("super_admin_username").notNull(),
  superAdminPassword: text("super_admin_password").notNull(), 
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  collegeId: integer("college_id").references(() => colleges.id).notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  role: text("role", { enum: ["superadmin", "admin", "guard"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const seminars = pgTable("seminars", {
  id: serial("id").primaryKey(),
  collegeId: integer("college_id").references(() => colleges.id).notNull(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  venue: text("venue").notNull(),
  thumbnail: text("thumbnail"),
  rows: integer("rows").notNull(),
  cols: integer("cols").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  seminarId: integer("seminar_id").references(() => seminars.id).notNull(),
  studentName: text("student_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  collegeName: text("college_name"),
  course: text("course"),
  semester: text("semester"),
  seatRow: integer("seat_row").notNull(),
  seatCol: integer("seat_col").notNull(),
  attended: boolean("attended").default(false),
  uniqueId: text("unique_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const collegesRelations = relations(colleges, ({ many }) => ({
  users: many(users),
  seminars: many(seminars),
}));

export const usersRelations = relations(users, ({ one }) => ({
  college: one(colleges, {
    fields: [users.collegeId],
    references: [colleges.id],
  }),
}));

export const seminarsRelations = relations(seminars, ({ one, many }) => ({
  college: one(colleges, {
    fields: [seminars.collegeId],
    references: [colleges.id],
  }),
  registrations: many(registrations),
}));

export const registrationsRelations = relations(registrations, ({ one }) => ({
  seminar: one(seminars, {
    fields: [registrations.seminarId],
    references: [seminars.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertCollegeSchema = createInsertSchema(colleges).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertSeminarSchema = createInsertSchema(seminars).omit({ id: true, createdAt: true });
export const insertRegistrationSchema = createInsertSchema(registrations).omit({ id: true, createdAt: true, attended: true, uniqueId: true });

// === EXPLICIT API CONTRACT TYPES ===

export type College = typeof colleges.$inferSelect;
export type InsertCollege = z.infer<typeof insertCollegeSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Seminar = typeof seminars.$inferSelect;
export type InsertSeminar = z.infer<typeof insertSeminarSchema>;
export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;

export type CreateCollegeRequest = InsertCollege;
export type CreateUserRequest = InsertUser;
export type CreateSeminarRequest = InsertSeminar;
export type CreateRegistrationRequest = InsertRegistration;

export type LoginRequest = {
  collegeId: number;
  username: string;
  password: string;
};

export type LoginResponse = {
  user: User;
  college: College;
  redirectUrl: string;
};

export type SeminarWithRegistrations = Seminar & { registrations: Registration[] };

export type VerifyTicketRequest = {
  uniqueId: string;
};

export type VerifyTicketResponse = {
  valid: boolean;
  registration?: Registration;
  message: string;
};
