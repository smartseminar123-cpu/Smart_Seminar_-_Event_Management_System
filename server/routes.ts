import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === PUBLIC: COLLEGES ===
  app.get(api.colleges.list.path, async (req, res) => {
    const colleges = await storage.getColleges();
    res.json(colleges);
  });

  app.post(api.colleges.create.path, async (req, res) => {
    try {
      const input = api.colleges.create.input.parse(req.body);
      
      // Create college
      const college = await storage.createCollege(input);
      
      // Auto-create Super Admin for this college
      await storage.createUser({
        collegeId: college.id,
        username: college.superAdminUsername,
        password: college.superAdminPassword,
        role: "superadmin"
      });

      res.status(201).json(college);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === AUTH ===
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const { collegeId, username, password } = api.auth.login.input.parse(req.body);
      
      const user = await storage.getUserByUsername(collegeId, username);
      const college = await storage.getCollege(collegeId);

      if (!user || user.password !== password || !college) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      let redirectUrl = "/";
      if (user.role === "superadmin") redirectUrl = "/superadmin/dashboard";
      if (user.role === "admin") redirectUrl = "/admin/dashboard";
      if (user.role === "guard") redirectUrl = "/guard/dashboard";

      res.json({ user, college, redirectUrl });
    } catch (err) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // === SUPER ADMIN ===
  app.get(api.superadmin.stats.path, async (req, res) => {
    const collegeId = Number(req.params.collegeId);
    const stats = await storage.getCollegeStats(collegeId);
    
    res.json({
      totalSeminars: stats.totalSeminars,
      averageAttendance: stats.avgAttendance,
      popularType: "Tech Workshop", // Mock for prototype
      suggestion: "Schedule seminars on Saturday mornings for higher turnout.",
    });
  });

  app.get(api.superadmin.users.list.path, async (req, res) => {
    const collegeId = Number(req.params.collegeId);
    const users = await storage.getUsersByCollege(collegeId);
    res.json(users);
  });

  app.post(api.superadmin.users.create.path, async (req, res) => {
    try {
      const input = api.superadmin.users.create.input.parse(req.body);
      const user = await storage.createUser(input);
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // === ADMIN ===
  app.get(api.seminars.list.path, async (req, res) => {
    const collegeId = Number(req.params.collegeId);
    const seminars = await storage.getSeminars(collegeId);
    res.json(seminars);
  });

  app.post(api.seminars.create.path, async (req, res) => {
    try {
      const input = api.seminars.create.input.parse(req.body);
      const seminar = await storage.createSeminar(input);
      res.status(201).json(seminar);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create seminar" });
    }
  });

  app.get(api.seminars.get.path, async (req, res) => {
    const id = Number(req.params.id);
    const seminar = await storage.getSeminar(id);
    if (!seminar) return res.status(404).json({ message: "Seminar not found" });
    
    const registrations = await storage.getRegistrations(id);
    res.json({ ...seminar, registrations });
  });

  // === PUBLIC REGISTRATION ===
  app.post(api.registrations.create.path, async (req, res) => {
    try {
      const input = api.registrations.create.input.parse(req.body);
      
      // Check if seat is taken
      const existing = await storage.getRegistrationBySeat(input.seminarId, input.seatRow, input.seatCol);
      if (existing) {
        return res.status(409).json({ message: "Seat already taken" });
      }

      const reg = await storage.createRegistration(input);
      res.status(201).json(reg);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to register" });
    }
  });

  app.get(api.registrations.list.path, async (req, res) => {
    const seminarId = Number(req.params.seminarId);
    const regs = await storage.getRegistrations(seminarId);
    res.json(regs);
  });

  // === GUARD ===
  app.post(api.attendance.verify.path, async (req, res) => {
    try {
      const { uniqueId } = api.attendance.verify.input.parse(req.body);
      const reg = await storage.getRegistrationByUniqueId(uniqueId);

      if (!reg) {
        return res.json({ valid: false, message: "Invalid Ticket ID" });
      }

      if (reg.attended) {
        return res.json({ valid: false, message: "Ticket Already Used", registration: reg });
      }

      await storage.markAttendance(reg.id);
      res.json({ valid: true, message: "Attendance Verified", registration: reg });
    } catch (err) {
      res.status(400).json({ valid: false, message: "Invalid Request" });
    }
  });

  // === SEED DATA ===
  const existingColleges = await storage.getColleges();
  if (existingColleges.length === 0) {
    const college = await storage.createCollege({
      name: "Tech Institute of Science",
      superAdminUsername: "superadmin",
      superAdminPassword: "password123"
    });

    // Super Admin is auto-created by createCollege logic above

    // Create Admin
    await storage.createUser({
      collegeId: college.id,
      username: "admin",
      password: "password123",
      role: "admin"
    });

    // Create Guard
    await storage.createUser({
      collegeId: college.id,
      username: "guard",
      password: "password123",
      role: "guard"
    });

    // Create Demo Seminar
    await storage.createSeminar({
      collegeId: college.id,
      title: "AI & Future of Tech",
      description: "A deep dive into Artificial Intelligence trends.",
      date: "2025-05-15",
      time: "10:00",
      venue: "Main Auditorium",
      rows: 10,
      cols: 10,
      thumbnail: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80"
    });
  }

  return httpServer;
}
