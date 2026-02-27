import express, { type Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import createMemoryStore from "memorystore";
import multer from "multer";
import path from "path";
import fs from "fs";
import * as pdfParseModule from "pdf-parse";
import type {
  AcademicDocument,
  AdmissionStatus,
  InsertAdmission,
  InsertStudentLife,
  InsertFaculty,
  InsertEvent,
} from "@shared/schema";
import { admissionStatusValues, eventStatusValues } from "@shared/schema";

const MemoryStore = createMemoryStore(session);

function normalizeFiles(
  files?: Express.Multer.File[] | Express.Multer.File | { [fieldname: string]: Express.Multer.File[] },
): Express.Multer.File[] {
  if (!files) return [];
  if (Array.isArray(files)) return files;
  if (isMulterFile(files)) return [files];
  return Object.values(files).flat();
}

function isMulterFile(value: unknown): value is Express.Multer.File {
  return Boolean(
    value &&
      typeof value === "object" &&
      "fieldname" in value &&
      "originalname" in value &&
      "path" in value,
  );
}

function cleanupUploadedFiles(
  files?: Express.Multer.File[] | Express.Multer.File | { [fieldname: string]: Express.Multer.File[] },
) {
  const list = normalizeFiles(files);
  list.forEach((file) => {
    deleteFileSafe(file.path);
  });
}

function deleteFileSafe(filePath?: string | null) {
  if (!filePath) return;
  fs.promises.unlink(filePath).catch(() => {});
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const uploadsRootDir = path.join(process.cwd(), "uploads");
  const academicUploadsDir = path.join(uploadsRootDir, "academics");
  const studentLifeUploadsDir = path.join(uploadsRootDir, "student-life");
  const facultyUploadsDir = path.join(uploadsRootDir, "faculty");
  const eventUploadsDir = path.join(uploadsRootDir, "events");
  const rankerUploadsDir = path.join(uploadsRootDir, "rankers");
  [uploadsRootDir, academicUploadsDir, studentLifeUploadsDir, facultyUploadsDir, eventUploadsDir, rankerUploadsDir].forEach((dir) =>
    fs.mkdirSync(dir, { recursive: true }),
  );

  const academicUpload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, academicUploadsDir),
      filename: (_req, file, cb) => {
        const safeName = file.originalname.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.\-_]/g, "");
        const uniqueName = `${Date.now()}-${safeName}`;
        cb(null, uniqueName);
      },
    }),
    fileFilter: (_req, file, cb) => {
      if (file.mimetype !== "application/pdf") {
        return cb(new Error("Only PDF files are allowed."));
      }
      cb(null, true);
    },
  });

  const imageFileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }
    return cb(new Error("Only image files are allowed."));
  };

  const studentLifeUpload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, studentLifeUploadsDir),
      filename: (_req, file, cb) => {
        const safeName = file.originalname.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.\-_]/g, "");
        cb(null, `${Date.now()}-${safeName}`);
      },
    }),
    fileFilter: imageFileFilter,
    limits: { files: 10, fileSize: 7 * 1024 * 1024 },
  });

  const facultyImageUpload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, facultyUploadsDir),
      filename: (_req, file, cb) => {
        const safeName = file.originalname.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.\-_]/g, "");
        cb(null, `${Date.now()}-${safeName}`);
      },
    }),
    fileFilter: imageFileFilter,
    limits: { files: 1, fileSize: 5 * 1024 * 1024 },
  });

  const eventImageUpload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, eventUploadsDir),
      filename: (_req, file, cb) => {
        const safeName = file.originalname.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.\-_]/g, "");
        cb(null, `${Date.now()}-${safeName}`);
      },
    }),
    fileFilter: imageFileFilter,
    limits: { files: 8, fileSize: 8 * 1024 * 1024 },
  });

  const rankerImageUpload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, rankerUploadsDir),
      filename: (_req, file, cb) => {
        const safeName = file.originalname.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.\-_]/g, "");
        cb(null, `${Date.now()}-${safeName}`);
      },
    }),
    fileFilter: imageFileFilter,
    limits: { files: 1, fileSize: 5 * 1024 * 1024 },
  });

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
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

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
  app.post(
    api.faculty.create.path,
    requireAuth,
    facultyImageUpload.single("image"),
    async (req, res) => {
      try {
        const payload = parseJsonPayload(req.body);
        const input = api.faculty.create.input.parse(payload);
        const sourceType = input.imageSourceType ?? "url";
        if (sourceType === "upload" && !req.file) {
          return res.status(400).json({ message: "Upload an image for this faculty profile." });
        }
        if (sourceType === "url" && !input.imageUrl) {
          return res.status(400).json({ message: "Image URL is required when using URL source." });
        }
        const data: InsertFaculty = {
          name: input.name.trim(),
          role: input.role.trim(),
          department: input.department.trim(),
          qualification: input.qualification?.trim() || null,
          experience: input.experience?.trim() || null,
          description: input.description?.trim() || null,
          email: input.email?.trim() || null,
          phone: input.phone?.trim() || null,
          status: input.status ?? "draft",
          imageSourceType: sourceType,
          imageUrl:
            sourceType === "upload"
              ? path.posix.join("/uploads/faculty", (req.file as Express.Multer.File).filename)
              : input.imageUrl?.trim() || null,
          imagePath: sourceType === "upload" ? (req.file as Express.Multer.File).path : null,
        };
        const item = await storage.createFaculty(data);
        res.status(201).json(item);
      } catch (err) {
        cleanupUploadedFiles(req.file);
        handleZodError(res, err);
      }
    },
  );
  app.put(
    api.faculty.update.path,
    requireAuth,
    facultyImageUpload.single("image"),
    async (req, res) => {
      const id = Number(req.params.id);
      try {
        const existing = await storage.getFacultyById(id);
        if (!existing) {
          cleanupUploadedFiles(req.file);
          return res.status(404).json({ message: "Faculty profile not found" });
        }
        const payload = parseJsonPayload(req.body);
        const input = api.faculty.update.input.parse(payload);
        const updates: Partial<InsertFaculty> = {};
        if (typeof input.name === "string") updates.name = input.name.trim();
        if (typeof input.role === "string") updates.role = input.role.trim();
        if (typeof input.department === "string") updates.department = input.department.trim();
        if (typeof input.qualification !== "undefined") updates.qualification = input.qualification?.trim() || null;
        if (typeof input.experience !== "undefined") updates.experience = input.experience?.trim() || null;
        if (typeof input.description !== "undefined") updates.description = input.description?.trim() || null;
        if (typeof input.email !== "undefined") updates.email = input.email?.trim() || null;
        if (typeof input.phone !== "undefined") updates.phone = input.phone?.trim() || null;
        if (typeof input.status === "string") updates.status = input.status;

        const nextSourceType = input.imageSourceType ?? existing.imageSourceType ?? "url";
        let nextImageUrl = existing.imageUrl ?? null;
        let nextImagePath = existing.imagePath ?? null;

        if (nextSourceType === "upload") {
          if (req.file) {
            if (existing.imageSourceType === "upload") {
              deleteFileSafe(existing.imagePath);
            }
            nextImageUrl = path.posix.join("/uploads/faculty", req.file.filename);
            nextImagePath = req.file.path;
          } else if (existing.imageSourceType !== "upload") {
            return res.status(400).json({ message: "Upload an image when switching to uploaded source." });
          }
        } else {
          const newUrl = input.imageUrl?.trim();
          if (!newUrl) {
            return res
              .status(400)
              .json({ message: "Provide an image URL when using the URL source type for faculty photos." });
          }
          if (existing.imageSourceType === "upload") {
            deleteFileSafe(existing.imagePath);
          }
          nextImageUrl = newUrl;
          nextImagePath = null;
        }

        updates.imageSourceType = nextSourceType;
        updates.imageUrl = nextImageUrl;
        updates.imagePath = nextImagePath;

        const item = await storage.updateFaculty(id, updates);
        res.json(item);
      } catch (err) {
        cleanupUploadedFiles(req.file);
        handleZodError(res, err);
      }
    },
  );
  app.delete(api.faculty.delete.path, requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    const existing = await storage.getFacultyById(id);
    if (!existing) {
      return res.status(404).json({ message: "Faculty profile not found" });
    }
    await storage.deleteFaculty(id);
    deleteFileSafe(existing.imagePath);
    res.status(204).end();
  });

  // Events
  app.get(api.events.list.path, async (req, res) => {
    const status = req.query.status as string | undefined;
    const scope = typeof req.query.scope === "string" ? req.query.scope : undefined;
    let items = await storage.getEvents(status);
    if (scope === "upcoming") {
      const now = Date.now();
      items = items.filter((event) => {
        if (!event.startDateTime) return false;
        const startTime = new Date(event.startDateTime).getTime();
        const endTime = new Date(event.endDateTime ?? event.startDateTime).getTime();
        const isFuture = startTime >= now || endTime >= now;
        const allowedStatus = event.status === "published" || event.status === "scheduled";
        return allowedStatus && isFuture;
      });
    }
    res.json(items);
  });
  app.post(
    api.events.create.path,
    requireAuth,
    eventImageUpload.array("images", 8),
    async (req, res) => {
      const files = normalizeFiles(req.files);
      try {
        const payload = parseJsonPayload(req.body);
        const input = api.events.create.input.parse(payload);
        const eventData = buildEventInsertPayload(input);
        const created = await storage.createEvent(eventData);
        const uploadImages = files.map((file) => ({
          imageUrl: path.posix.join("/uploads/events", file.filename),
          filePath: file.path,
          sourceType: "upload" as const,
        }));
        const remoteImages =
          input.remoteImages?.map((img) => ({
            imageUrl: img.url.trim(),
            caption: img.caption?.trim() || null,
            sourceType: "url" as const,
          })) ?? [];
        if (uploadImages.length || remoteImages.length) {
          await storage.addEventImages(created.id, [...uploadImages, ...remoteImages]);
        }
        const hydrated = await storage.getEvent(created.id);
        res.status(201).json(hydrated);
      } catch (err) {
        cleanupUploadedFiles(files);
        handleZodError(res, err);
      }
    },
  );
  app.put(
    api.events.update.path,
    requireAuth,
    eventImageUpload.array("images", 8),
    async (req, res) => {
      const files = normalizeFiles(req.files);
      try {
        const id = Number(req.params.id);
        const existing = await storage.getEvent(id);
        if (!existing) {
          cleanupUploadedFiles(files);
          return res.status(404).json({ message: "Event not found" });
        }
        const payload = parseJsonPayload(req.body);
        const input = api.events.update.input.parse(payload);
        const updates = buildEventUpdatePayload(input, existing.startDateTime);
        if (Object.keys(updates).length > 0) {
          await storage.updateEvent(id, updates);
        }
        const retainIds = input.retainImageIds
          ? new Set(input.retainImageIds)
          : new Set(existing.images.map((img) => img.id));
        const toRemove = existing.images.filter((img) => !retainIds.has(img.id));
        if (toRemove.length) {
          const removed = await storage.removeEventImages(toRemove.map((img) => img.id));
          removed.forEach((img) => deleteFileSafe(img.filePath));
        }
        const uploadImages = files.map((file) => ({
          imageUrl: path.posix.join("/uploads/events", file.filename),
          filePath: file.path,
          sourceType: "upload" as const,
        }));
        const remoteImages =
          input.remoteImages?.map((img) => ({
            imageUrl: img.url.trim(),
            caption: img.caption?.trim() || null,
            sourceType: "url" as const,
          })) ?? [];
        if (uploadImages.length || remoteImages.length) {
          await storage.addEventImages(id, [...uploadImages, ...remoteImages]);
        }
        const updated = await storage.getEvent(id);
        res.json(updated);
      } catch (err) {
        cleanupUploadedFiles(files);
        handleZodError(res, err);
      }
    },
  );
  app.delete(api.events.delete.path, requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    const existing = await storage.getEvent(id);
    if (!existing) {
      return res.status(404).json({ message: "Event not found" });
    }
    await storage.deleteEvent(id);
    existing.images.forEach((img) => deleteFileSafe(img.filePath));
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
      const existing = await storage.getRanker(id);
      if (!existing) {
        return res.status(404).json({ message: "Ranker not found" });
      }
      let manualFields = existing.manualFields ?? [];
      if (existing.source === "auto") {
        const manualSet = new Set(manualFields);
        (["studentName", "className", "hallTicket", "examName", "imageUrl"] as const).forEach((field) => {
          if (Object.prototype.hasOwnProperty.call(input, field)) {
            const value = (input as Record<string, unknown>)[field];
            if (value === null || (typeof value === "string" && value.trim().length === 0)) {
              manualSet.delete(field);
            } else if (value !== undefined) {
              manualSet.add(field);
            }
          }
        });
        manualFields = Array.from(manualSet);
      }
      const item = await storage.updateRanker(id, { ...input, manualFields });
      if (existing.source === "auto") {
        await storage.syncRankersFromResults().catch((err) => console.error("Failed to refresh rankers", err));
      }
      res.json(item);
    } catch (err) { handleZodError(res, err); }
  });
  app.post("/api/rankers/:id/photo", requireAuth, rankerImageUpload.single("photo"), async (req, res) => {
    const id = Number(req.params.id);
    let fileToCleanup: Express.Multer.File | undefined;
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Upload a valid image file." });
      }
      fileToCleanup = req.file;
      const ranker = await storage.getRanker(id);
      if (!ranker) {
        cleanupUploadedFiles(req.file);
        return res.status(404).json({ message: "Ranker not found" });
      }
      const publicUrl = `/uploads/rankers/${req.file.filename}`.replace(/\\/g, "/");
      const manualSet = new Set(ranker.manualFields ?? []);
      manualSet.add("imageUrl");
      manualSet.add("imagePath");
      const updated = await storage.updateRanker(id, {
        imageUrl: publicUrl,
        imagePath: req.file.path,
        manualFields: Array.from(manualSet),
      });
      if (ranker.imagePath && ranker.imagePath !== req.file.path) {
        deleteFileSafe(ranker.imagePath);
      }
      res.json(updated);
    } catch (err) {
      cleanupUploadedFiles(fileToCleanup);
      handleZodError(res, err);
    }
  });
  app.delete(api.rankers.delete.path, requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    const existing = await storage.getRanker(id);
    await storage.deleteRanker(id);
    if (existing?.imagePath) {
      deleteFileSafe(existing.imagePath);
    }
    res.status(204).end();
  });

  // Academics
  app.get(api.academics.list.path, async (req, res) => {
    const status = req.query.status as string | undefined;
    const category = req.query.category as string | undefined;
    const items = await storage.getAcademics(status, category);
    res.json(items);
  });
  app.post(api.academics.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.academics.create.input.parse(req.body);
      const item = await storage.createAcademic(input);
      res.status(201).json(item);
    } catch (err) { handleZodError(res, err); }
  });
  app.put(api.academics.update.path, requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.academics.update.input.parse(req.body);
      const item = await storage.updateAcademic(id, input);
      res.json(item);
    } catch (err) { handleZodError(res, err); }
  });
  app.delete(api.academics.delete.path, requireAuth, async (req, res) => {
    await storage.deleteAcademic(Number(req.params.id));
    res.status(204).end();
  });

  // Academic Documents
  app.get(api.academicDocs.list.path, async (req, res) => {
    const docs = await storage.getAcademicDocuments({
      status: req.query.status as string | undefined,
      docType: req.query.docType as string | undefined,
      academicYear: req.query.academicYear as string | undefined,
      classLevel: req.query.classLevel as string | undefined,
      subject: req.query.subject as string | undefined,
    });
    res.json(docs.map(sanitizeAcademicDocument));
  });

  app.post(
    api.academicDocs.create.path,
    requireAuth,
    academicUpload.single("file"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "PDF file is required" });
        }
        const { title, docType, academicYear } = req.body;
        if (!title || !docType || !academicYear) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ message: "Title, document type, and academic year are required" });
        }

        const extractedText = await extractPdfText(req.file.path);

        const doc = await storage.createAcademicDocument({
          title: title.trim(),
          docType: docType.trim(),
          academicYear: academicYear.trim(),
          subject: (req.body.subject as string | undefined)?.trim() || null,
          classLevel: (req.body.classLevel as string | undefined)?.trim() || null,
          status: req.body.status === "published" ? "published" : "draft",
          fileUrl: path.posix.join("/uploads/academics", req.file.filename),
          filePath: req.file.path,
          fileSize: req.file.size,
          extractedText,
        });

        res.status(201).json(sanitizeAcademicDocument(doc));
      } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        handleZodError(res, err);
      }
    },
  );

  app.post(api.academicDocs.updateStatus.path, requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.academicDocs.updateStatus.input.parse(req.body);
      const doc = await storage.updateAcademicDocumentStatus(id, input.status);
      res.json(sanitizeAcademicDocument(doc));
    } catch (err) {
      handleZodError(res, err);
    }
  });

  app.delete(api.academicDocs.delete.path, requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    const doc = await storage.getAcademicDocumentById(id);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }
    await storage.deleteAcademicDocument(id);
    if (doc.filePath && fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }
    res.status(204).end();
  });

  app.get(api.academicDocs.file.path, async (req, res) => {
    const id = Number(req.params.id);
    const doc = await storage.getAcademicDocumentById(id);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }
    const isAdmin =
      typeof req.isAuthenticated === "function" &&
      req.isAuthenticated() &&
      (req.user as { role?: string } | undefined)?.role === "admin";
    if (doc.status !== "published" && !isAdmin) {
      return res.status(404).json({ message: "Document not available" });
    }
    if (!fs.existsSync(doc.filePath)) {
      return res.status(404).json({ message: "Document file missing" });
    }
    res.setHeader("Content-Type", "application/pdf");
    res.sendFile(path.resolve(doc.filePath));
  });

  // Student Life
  app.get(api.studentLife.list.path, async (req, res) => {
    const status = req.query.status as string | undefined;
    const items = await storage.getStudentLife(status);
    res.json(items);
  });
  app.post(
    api.studentLife.create.path,
    requireAuth,
    studentLifeUpload.array("images", 10),
    async (req, res) => {
      const files = normalizeFiles(req.files);
      try {
        const payload = parseJsonPayload(req.body);
        const input = api.studentLife.create.input.parse(payload);
        if (!files.length) {
          cleanupUploadedFiles(files);
          return res.status(400).json({ message: "Upload at least one image." });
        }
        const entry = await storage.createStudentLife({
          title: input.title.trim(),
          description: input.description.trim(),
          highlightTag: input.highlightTag?.trim() || null,
          status: input.status ?? "draft",
        });
        await storage.addStudentLifeImages(
          entry.id,
          files.map((file, index) => ({
            imageUrl: path.posix.join("/uploads/student-life", file.filename),
            filePath: file.path,
            orderIndex: index,
          })),
        );
        const hydrated = await storage.getStudentLifeById(entry.id);
        res.status(201).json(hydrated);
      } catch (err) {
        cleanupUploadedFiles(req.files);
        handleZodError(res, err);
      }
    },
  );
  app.put(
    api.studentLife.update.path,
    requireAuth,
    studentLifeUpload.array("images", 10),
    async (req, res) => {
      const id = Number(req.params.id);
      try {
        const existing = await storage.getStudentLifeById(id);
        if (!existing) {
          cleanupUploadedFiles(req.files);
          return res.status(404).json({ message: "Student Life entry not found" });
        }
        const payload = parseJsonPayload(req.body);
        const input = api.studentLife.update.input.parse(payload);
        const updates: Partial<InsertStudentLife> = {};
        if (typeof input.title === "string") updates.title = input.title.trim();
        if (typeof input.description === "string") updates.description = input.description.trim();
        if (typeof input.highlightTag !== "undefined") {
          updates.highlightTag = input.highlightTag ? input.highlightTag.trim() : null;
        }
        if (typeof input.status === "string") updates.status = input.status;
        if (Object.keys(updates).length > 0) {
          await storage.updateStudentLife(id, updates);
        }

        const existingImages = await storage.getStudentLifeImages(id);
        const retainIds = Array.isArray(input.retainImageIds)
          ? new Set(input.retainImageIds)
          : new Set(existingImages.map((img) => img.id));
        const retainedImages = existingImages.filter((img) => retainIds.has(img.id));
        const toRemove = existingImages.filter((img) => !retainIds.has(img.id));
        if (toRemove.length) {
          const removed = await storage.removeStudentLifeImages(toRemove.map((img) => img.id));
          removed.forEach((img) => deleteFileSafe(img.filePath));
        }

        const files = normalizeFiles(req.files);
        if (files.length) {
          const currentMaxOrder =
            retainedImages.reduce(
              (max, img) => Math.max(max, typeof img.orderIndex === "number" ? img.orderIndex : max),
              -1,
            ) + 1;
          await storage.addStudentLifeImages(
            id,
            files.map((file, index) => ({
              imageUrl: path.posix.join("/uploads/student-life", file.filename),
              filePath: file.path,
              orderIndex: currentMaxOrder + index,
            })),
          );
        }

        const hydrated = await storage.getStudentLifeById(id);
        res.json(hydrated);
      } catch (err) {
        cleanupUploadedFiles(req.files);
        handleZodError(res, err);
      }
    },
  );
  app.delete(api.studentLife.delete.path, requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    const entry = await storage.getStudentLifeById(id);
    if (!entry) {
      return res.status(404).json({ message: "Student Life entry not found" });
    }
    await storage.deleteStudentLife(id);
    entry.images.forEach((img) => deleteFileSafe(img.filePath));
    res.status(204).end();
  });

  // Results
  app.get(api.results.list.path, async (req, res) => {
    const rollNo = req.query.rollNo as string | undefined;
    const className = req.query.className as string | undefined;
    const items = await storage.getResults(rollNo, className);
    res.json(items);
  });
  app.post(api.results.bulkCreate.path, requireAuth, async (req, res) => {
    try {
      const input = api.results.bulkCreate.input.parse(req.body);
      await storage.createResults(input);
      res.status(201).json({ count: input.length });
    } catch (err) { handleZodError(res, err); }
  });
  app.delete(api.results.delete.path, requireAuth, async (req, res) => {
    await storage.deleteResult(Number(req.params.id));
    res.status(204).end();
  });

  // Admissions
  app.get(api.admissions.list.path, async (req, res) => {
    const status = typeof req.query.status === "string" ? toAdmissionStatus(req.query.status) : undefined;
    const filters = {
      status,
      classLevel: typeof req.query.classLevel === "string" ? req.query.classLevel : undefined,
      academicYear: typeof req.query.academicYear === "string" ? req.query.academicYear : undefined,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
    };
    const items = await storage.getAdmissions(filters);
    res.json(items);
  });
  app.post(api.admissions.publicCreate.path, async (req, res) => {
    try {
      const input = api.admissions.publicCreate.input.parse(req.body);
      const payload = buildAdmissionPayload(input, { status: "new", source: "public", createdBy: "public" });
      const item = await storage.createAdmission(payload);
      res.status(201).json(item);
    } catch (err) {
      handleZodError(res, err);
    }
  });
  app.post(api.admissions.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.admissions.create.input.parse(req.body);
      const payload = buildAdmissionPayload(input, {
        status: input.status ? toAdmissionStatus(input.status) ?? "new" : "new",
        source: "admin",
        createdBy: getRequestUserEmail(req) ?? "admin",
      });
      if (payload.status === "willing_to_join" && !payload.expectedJoinDate) {
        return res.status(400).json({ message: "Expected joining date is required when marking as willing to join." });
      }
      const item = await storage.createAdmission(payload);
      res.status(201).json(item);
    } catch (err) {
      handleZodError(res, err);
    }
  });
  app.put(api.admissions.update.path, requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.admissions.update.input.parse(req.body);
      const payload = buildAdmissionPayload(input, {
        status: input.status ? toAdmissionStatus(input.status) ?? "new" : undefined,
      });
      if (payload.status === "willing_to_join" && !payload.expectedJoinDate) {
        return res.status(400).json({ message: "Expected joining date is required when marking as willing to join." });
      }
      const item = await storage.updateAdmission(id, payload);
      res.json(item);
    } catch (err) {
      handleZodError(res, err);
    }
  });
  app.post(api.admissions.updateStatus.path, requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.admissions.updateStatus.input.parse(req.body);
      const status = toAdmissionStatus(input.status) ?? "new";
      const expectedJoinDate = parseOptionalDate(input.expectedJoinDate);
      if (status === "willing_to_join" && !expectedJoinDate) {
        return res.status(400).json({ message: "Expected joining date is required for Willing to Join status." });
      }
      const item = await storage.updateAdmissionStatus(id, status, expectedJoinDate ?? null);
      res.json(item);
    } catch (err) {
      handleZodError(res, err);
    }
  });
  app.delete(api.admissions.delete.path, requireAuth, async (req, res) => {
    await storage.deleteAdmission(Number(req.params.id));
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

  // Seed sample data and ensure rankers mirror latest results
  await seedDatabase();
  await storage.syncRankersFromResults().catch((err) =>
    console.error("Failed to sync rankers from existing results", err),
  );

  const scheduler = setInterval(() => {
    storage.syncEventStatuses().catch((err) => console.error("Event scheduler error:", err));
  }, 60_000);
  httpServer.on("close", () => clearInterval(scheduler));

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
      location: "Main Ground",
      category: "Sports",
      status: "published",
      startDateTime: new Date(Date.now() + 86400000 * 7),
      endDateTime: new Date(Date.now() + 86400000 * 7 + 3 * 60 * 60 * 1000),
      publishAt: new Date(),
    });
  }
}

function sanitizeAcademicDocument(doc: AcademicDocument) {
  const { filePath, ...rest } = doc;
  return {
    ...rest,
    streamUrl: buildUrl(api.academicDocs.file.path, { id: doc.id }),
    hasExtractedText: Boolean(doc.extractedText && doc.extractedText.trim()),
  };
}

type PdfParseFn = (data: Buffer | Uint8Array, options?: any) => Promise<{ text?: string }>;

const pdfParse: PdfParseFn =
  typeof (pdfParseModule as unknown as any) === "function"
    ? ((pdfParseModule as unknown as any) as PdfParseFn)
    : ((pdfParseModule as unknown as { default?: PdfParseFn }).default ??
        ((pdfParseModule as unknown as any) as PdfParseFn));

async function extractPdfText(filePath: string) {
  try {
    const buffer = await fs.promises.readFile(filePath);
    const parsed = await pdfParse(buffer, undefined);
    return parsed.text?.trim();
  } catch (err) {
    console.error("Failed to extract PDF text", err);
  }
  return undefined;
}

function parseJsonPayload(body: any) {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  if (typeof body.payload === "string") {
    try {
      return JSON.parse(body.payload);
    } catch {
      return {};
    }
  }
  return body.payload ?? body;
}

type EventCreateInput = z.infer<typeof api.events.create.input>;
type EventUpdateInput = z.infer<typeof api.events.update.input>;

function buildEventInsertPayload(input: EventCreateInput): InsertEvent {
  const startDate = parseDateTimeOrThrow(input.startDateTime, "startDateTime");
  const endDate = input.endDateTime ? parseDateTimeOrThrow(input.endDateTime, "endDateTime") : null;
  if (endDate && endDate.getTime() < startDate.getTime()) {
    raiseFieldError("endDateTime", "End date/time must be after the start date/time.");
  }
  const publishAt = input.publishAt ? parseDateTimeOrThrow(input.publishAt, "publishAt") : null;
  return {
    title: sanitizeUnicode(input.title),
    description: sanitizeUnicode(input.description),
    location: sanitizeUnicode(input.location),
    category: sanitizeUnicode(input.category ?? "General"),
    status: normalizeEventStatus(input.status),
    startDateTime: startDate,
    endDateTime: endDate,
    publishAt,
  };
}

function buildEventUpdatePayload(
  input: EventUpdateInput,
  currentStart?: Date | string | null,
): Partial<InsertEvent> {
  const updates: Partial<InsertEvent> = {};
  const trimmedCategory = typeof input.category === "string" ? input.category.trim() : undefined;
  if (typeof input.title === "string") updates.title = sanitizeUnicode(input.title);
  if (typeof input.description === "string") updates.description = sanitizeUnicode(input.description);
  if (typeof input.location === "string") updates.location = sanitizeUnicode(input.location);
  if (typeof trimmedCategory === "string" && trimmedCategory.length) updates.category = sanitizeUnicode(trimmedCategory);
  if (typeof input.status === "string") updates.status = normalizeEventStatus(input.status);
  if (typeof input.startDateTime === "string") {
    updates.startDateTime = parseDateTimeOrThrow(input.startDateTime, "startDateTime");
  }
  const effectiveStart =
    updates.startDateTime ??
    (currentStart
      ? currentStart instanceof Date
        ? currentStart
        : new Date(currentStart)
      : undefined);
  if (Object.prototype.hasOwnProperty.call(input, "endDateTime")) {
    if (!input.endDateTime) {
      updates.endDateTime = null;
    } else {
      const endDate = parseDateTimeOrThrow(input.endDateTime, "endDateTime");
      if (effectiveStart && endDate.getTime() < effectiveStart.getTime()) {
        raiseFieldError("endDateTime", "End date/time must be after the start date/time.");
      }
      updates.endDateTime = endDate;
    }
  }
  if (Object.prototype.hasOwnProperty.call(input, "publishAt")) {
    if (!input.publishAt) {
      updates.publishAt = null;
    } else {
      updates.publishAt = parseDateTimeOrThrow(input.publishAt, "publishAt");
    }
  }
  return updates;
}

function parseDateTimeOrThrow(value: string, field: string): Date {
  const dateValue = new Date(value);
  if (Number.isNaN(dateValue.getTime())) {
    raiseFieldError(field, "Provide a valid date and time.");
  }
  return dateValue;
}

function normalizeEventStatus(value?: string | null): string {
  if (!value) return "draft";
  const normalized = value.toLowerCase();
  return eventStatusValues.includes(normalized as (typeof eventStatusValues)[number]) ? normalized : "draft";
}

function sanitizeUnicode(input?: string | null) {
  if (typeof input !== "string") return "";
  return Array.from(input.trim())
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code <= 0xffff;
    })
    .join("");
}

function raiseFieldError(field: string, message: string): never {
  const issue: z.ZodIssue = {
    code: z.ZodIssueCode.custom,
    path: [field],
    message,
  };
  throw new z.ZodError([issue]);
}

function buildAdmissionPayload(
  input: Record<string, any>,
  overrides?: Partial<InsertAdmission> & { status?: AdmissionStatus },
): InsertAdmission {
  const statusFromInput = toAdmissionStatus(input.status);
  const payload: InsertAdmission = {
    studentName: input.studentName.trim(),
    parentName: input.parentName.trim(),
    classApplyingFor: input.classApplyingFor.trim(),
    academicYear: normalizeOptionalString(input.academicYear),
    dob: parseOptionalDate(input.dob),
    phone: input.phone.trim(),
    email: input.email.trim().toLowerCase(),
    address: input.address.trim(),
    previousSchool: normalizeOptionalString(input.previousSchool),
    message: normalizeOptionalString(input.message),
    status: overrides?.status ?? statusFromInput ?? "new",
    expectedJoinDate: overrides?.expectedJoinDate ?? parseOptionalDate(input.expectedJoinDate),
    source: overrides?.source ?? "public",
    notes: overrides?.notes ?? normalizeOptionalString(input.notes),
    createdBy: overrides?.createdBy ?? null,
  };
  return payload;
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function parseOptionalDate(value: unknown): string | null {
  if (!value) return null;
  const dateValue = value instanceof Date ? value : new Date(value as string);
  if (Number.isNaN(dateValue.getTime())) {
    return null;
  }
  return dateValue.toISOString().split("T")[0];
}

function toAdmissionStatus(value?: string | AdmissionStatus | null): AdmissionStatus | undefined {
  if (!value) return undefined;
  const normalized = value.toString().toLowerCase() as AdmissionStatus;
  return admissionStatusValues.includes(normalized) ? normalized : undefined;
}

function getRequestUserEmail(req: any): string | undefined {
  if (req?.user && typeof req.user === "object" && "email" in req.user) {
    const email = (req.user as { email?: string }).email;
    if (typeof email === "string") {
      return email;
    }
  }
  return undefined;
}
