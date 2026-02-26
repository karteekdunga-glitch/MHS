import { pgTable, text, serial, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("admin"), // "admin"
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default('draft'), // 'draft', 'published'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const facultyProfiles = pgTable("faculty_profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  department: text("department").notNull(),
  imageUrl: text("image_url"),
  status: text("status").notNull().default('draft'),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  description: text("description"),
  status: text("status").notNull().default('draft'),
});

export const galleryImages = pgTable("gallery_images", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  caption: text("caption"),
  category: text("category").notNull().default('general'),
  status: text("status").notNull().default('draft'),
});

export const rankers = pgTable("rankers", {
  id: serial("id").primaryKey(),
  studentName: text("student_name").notNull(),
  rank: integer("rank").notNull(),
  year: integer("year").notNull(),
  score: integer("score").notNull(),
  imageUrl: text("image_url"),
  status: text("status").notNull().default('draft'),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Announcements
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true, updatedAt: true });
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

// Faculty
export const insertFacultySchema = createInsertSchema(facultyProfiles).omit({ id: true });
export type Faculty = typeof facultyProfiles.$inferSelect;
export type InsertFaculty = z.infer<typeof insertFacultySchema>;

// Events
export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

// Gallery
export const insertGallerySchema = createInsertSchema(galleryImages).omit({ id: true });
export type GalleryImage = typeof galleryImages.$inferSelect;
export type InsertGalleryImage = z.infer<typeof insertGallerySchema>;

// Rankers
export const insertRankerSchema = createInsertSchema(rankers).omit({ id: true });
export type Ranker = typeof rankers.$inferSelect;
export type InsertRanker = z.infer<typeof insertRankerSchema>;

// Common responses
export type AuthResponse = { message: string, user?: { id: number, email: string, role: string | null } };
