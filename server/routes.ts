import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session setup
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'secret123',
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 86400000 },
      store: new MemoryStore({
        checkPeriod: 86400000,
      }),
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || user.password !== password) {
          return done(null, false, { message: 'Invalid credentials' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth check middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user?.role === 'admin') {
      return next();
    }
    return res.status(401).json({ message: 'Unauthorized' });
  };

  // Auth Routes
  app.post(api.auth.login.path, passport.authenticate('local'), (req, res) => {
    res.json({ message: 'Logged in successfully', user: req.user });
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });

  // Utility to handle zod errors
  const handleZodError = (res: any, err: any) => {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        message: err.errors[0].message,
        field: err.errors[0].path.join('.'),
      });
    }
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  };

  // Announcements
  app.get(api.announcements.list.path, async (req, res) => {
    const status = req.query.status as string | undefined;
    const items = await storage.getAnnouncements(status);
    res.json(items);
  });
  app.post(api.announcements.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.announcements.create.input.parse(req.body);
      const item = await storage.createAnnouncement(input);
      res.status(201).json(item);
    } catch (err) { handleZodError(res, err); }
  });
  app.put(api.announcements.update.path, requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.announcements.update.input.parse(req.body);
      const item = await storage.updateAnnouncement(id, input);
      res.json(item);
    } catch (err) { handleZodError(res, err); }
  });
  app.delete(api.announcements.delete.path, requireAuth, async (req, res) => {
    await storage.deleteAnnouncement(Number(req.params.id));
    res.status(204).end();
  });

  // Faculty
  app.get(api.faculty.list.path, async (req, res) => {
    const status = req.query.status as string | undefined;
    const items = await storage.getFaculty(status);
    res.json(items);
  });
  app.post(api.faculty.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.faculty.create.input.parse(req.body);
      const item = await storage.createFaculty(input);
      res.status(201).json(item);
    } catch (err) { handleZodError(res, err); }
  });
  app.put(api.faculty.update.path, requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.faculty.update.input.parse(req.body);
      const item = await storage.updateFaculty(id, input);
      res.json(item);
    } catch (err) { handleZodError(res, err); }
  });
  app.delete(api.faculty.delete.path, requireAuth, async (req, res) => {
    await storage.deleteFaculty(Number(req.params.id));
    res.status(204).end();
  });

  // Events
  app.get(api.events.list.path, async (req, res) => {
    const status = req.query.status as string | undefined;
    const items = await storage.getEvents(status);
    res.json(items);
  });
  app.post(api.events.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.events.create.input.parse(req.body);
      const item = await storage.createEvent(input);
      res.status(201).json(item);
    } catch (err) { handleZodError(res, err); }
  });
  app.put(api.events.update.path, requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.events.update.input.parse(req.body);
      const item = await storage.updateEvent(id, input);
      res.json(item);
    } catch (err) { handleZodError(res, err); }
  });
  app.delete(api.events.delete.path, requireAuth, async (req, res) => {
    await storage.deleteEvent(Number(req.params.id));
    res.status(204).end();
  });

  // Gallery
  app.get(api.gallery.list.path, async (req, res) => {
    const status = req.query.status as string | undefined;
    const items = await storage.getGalleryImages(status);
    res.json(items);
  });
  app.post(api.gallery.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.gallery.create.input.parse(req.body);
      const item = await storage.createGalleryImage(input);
      res.status(201).json(item);
    } catch (err) { handleZodError(res, err); }
  });
  app.put(api.gallery.update.path, requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.gallery.update.input.parse(req.body);
      const item = await storage.updateGalleryImage(id, input);
      res.json(item);
    } catch (err) { handleZodError(res, err); }
  });
  app.delete(api.gallery.delete.path, requireAuth, async (req, res) => {
    await storage.deleteGalleryImage(Number(req.params.id));
    res.status(204).end();
  });

  // Rankers
  app.get(api.rankers.list.path, async (req, res) => {
    const status = req.query.status as string | undefined;
    const items = await storage.getRankers(status);
    res.json(items);
  });
  app.post(api.rankers.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.rankers.create.input.parse(req.body);
      const item = await storage.createRanker(input);
      res.status(201).json(item);
    } catch (err) { handleZodError(res, err); }
  });
  app.put(api.rankers.update.path, requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.rankers.update.input.parse(req.body);
      const item = await storage.updateRanker(id, input);
      res.json(item);
    } catch (err) { handleZodError(res, err); }
  });
  app.delete(api.rankers.delete.path, requireAuth, async (req, res) => {
    await storage.deleteRanker(Number(req.params.id));
    res.status(204).end();
  });

  // Seed Admin User
  const existingAdmin = await storage.getUserByEmail('karteekdunga@gmail.com');
  if (!existingAdmin) {
    await storage.createUser({
      email: 'karteekdunga@gmail.com',
      password: 'test123',
      role: 'admin',
    });
  }

  // Seed sample data
  seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingAnnouncements = await storage.getAnnouncements();
  if (existingAnnouncements.length === 0) {
    await storage.createAnnouncement({
      title: "Welcome back to school!",
      content: "Montessori High School welcomes all students for the new academic year.",
      status: "published",
    });
    await storage.createAnnouncement({
      title: "Examinations Schedule Released",
      content: "The half-yearly examinations will begin from 15th October. Check syllabus online.",
      status: "published",
    });
  }

  const existingEvents = await storage.getEvents();
  if (existingEvents.length === 0) {
    await storage.createEvent({
      title: "Annual Sports Meet",
      description: "Join us for the annual sports meet on the main ground.",
      date: new Date(new Date().getTime() + 86400000 * 7),
      status: "published",
    });
  }
}
