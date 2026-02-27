import { pgTable, text, serial, boolean, timestamp, integer, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("admin"), 
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default('draft'), 
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const facultyProfiles = pgTable("faculty_profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  department: text("department").notNull(),
  qualification: text("qualification"),
  experience: text("experience"),
  description: text("description"),
  email: text("email"),
  phone: text("phone"),
  imageSourceType: text("image_source_type").notNull().default("url"),
  imageUrl: text("image_url"),
  imagePath: text("image_path"),
  status: text("status").notNull().default('draft'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDateTime: timestamp("start_date_time").notNull(),
  endDateTime: timestamp("end_date_time"),
  location: text("location").notNull(),
  category: text("category").notNull().default("General"),
  status: text("status").notNull().default("draft"),
  publishAt: timestamp("publish_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const eventImages = pgTable("event_images", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  imageUrl: text("image_url").notNull(),
  sourceType: text("source_type").notNull().default("upload"),
  filePath: text("file_path"),
  caption: text("caption"),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
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
  hallTicket: text("hall_ticket"),
  className: text("class_name"),
  examName: text("exam_name"),
  percentage: integer("percentage"),
  source: text("source").notNull().default("manual"),
  syncedAt: timestamp("synced_at"),
  imageUrl: text("image_url"),
  imagePath: text("image_path"),
  manualFields: text("manual_fields").array(),
  status: text("status").notNull().default('draft'),
});

export const academics = pgTable("academics", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // e.g., 'Curriculum', 'Syllabus', 'Rules'
  status: text("status").notNull().default('draft'),
});

export const academicDocuments = pgTable("academic_documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  docType: text("doc_type").notNull(), // syllabus | calendar
  subject: text("subject"),
  classLevel: text("class_level"),
  academicYear: text("academic_year").notNull(),
  fileUrl: text("file_url").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  extractedText: text("extracted_text"),
  status: text("status").notNull().default('draft'),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const studentLife = pgTable("student_life", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  highlightTag: text("highlight_tag"),
  status: text("status").notNull().default('draft'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const studentLifeImages = pgTable("student_life_images", {
  id: serial("id").primaryKey(),
  studentLifeId: integer("student_life_id").references(() => studentLife.id, { onDelete: "cascade" }).notNull(),
  imageUrl: text("image_url").notNull(),
  filePath: text("file_path"),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  rollNo: text("roll_no").notNull().unique(),
  studentName: text("student_name").notNull(),
  examName: text("exam_name").notNull(),
  year: integer("year").notNull(),
  data: jsonb("data").notNull(), // Stores detailed marks/grades
  status: text("status").notNull().default('published'),
});

export const admissions = pgTable("admissions", {
  id: serial("id").primaryKey(),
  studentName: text("student_name").notNull(),
  parentName: text("parent_name").notNull(),
  classApplyingFor: text("class_applying_for").notNull(),
  academicYear: text("academic_year"),
  dob: date("dob"),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
  previousSchool: text("previous_school"),
  message: text("message"),
  status: text("status").notNull().default("new"),
  expectedJoinDate: date("expected_join_date"),
  statusUpdatedAt: timestamp("status_updated_at").defaultNow(),
  submittedAt: timestamp("submitted_at").defaultNow(),
  source: text("source").default("public"),
  notes: text("notes"),
  createdBy: text("created_by"),
});

export const admissionStatusValues = ["new", "counselled", "willing_to_join", "joined", "no_admission"] as const;
export type AdmissionStatus = typeof admissionStatusValues[number];

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true, updatedAt: true });
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

export const insertFacultySchema = createInsertSchema(facultyProfiles).omit({ id: true, createdAt: true });
export type Faculty = typeof facultyProfiles.$inferSelect;
export type InsertFaculty = z.infer<typeof insertFacultySchema>;

export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEventImageSchema = createInsertSchema(eventImages).omit({ id: true, createdAt: true });
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventImage = typeof eventImages.$inferSelect;
export type InsertEventImage = z.infer<typeof insertEventImageSchema>;
export const eventStatusValues = ["draft", "scheduled", "published", "expired"] as const;
export type EventStatus = typeof eventStatusValues[number];

export const insertGallerySchema = createInsertSchema(galleryImages).omit({ id: true });
export type GalleryImage = typeof galleryImages.$inferSelect;
export type InsertGalleryImage = z.infer<typeof insertGallerySchema>;

export const insertRankerSchema = createInsertSchema(rankers).omit({
  id: true,
  syncedAt: true,
  manualFields: true,
  imagePath: true,
});
export type Ranker = typeof rankers.$inferSelect;
export type InsertRanker = z.infer<typeof insertRankerSchema>;

export const insertAcademicSchema = createInsertSchema(academics).omit({ id: true });
export type Academic = typeof academics.$inferSelect;
export type InsertAcademic = z.infer<typeof insertAcademicSchema>;

export const insertAcademicDocumentSchema = createInsertSchema(academicDocuments).omit({ id: true, uploadedAt: true });
export type AcademicDocument = typeof academicDocuments.$inferSelect;
export type InsertAcademicDocument = z.infer<typeof insertAcademicDocumentSchema>;

export const insertStudentLifeSchema = createInsertSchema(studentLife).omit({ id: true, createdAt: true, updatedAt: true });
export type StudentLife = typeof studentLife.$inferSelect;
export type InsertStudentLife = z.infer<typeof insertStudentLifeSchema>;

export const insertStudentLifeImageSchema = createInsertSchema(studentLifeImages).omit({ id: true, createdAt: true });
export type StudentLifeImage = typeof studentLifeImages.$inferSelect;
export type InsertStudentLifeImage = z.infer<typeof insertStudentLifeImageSchema>;

export const insertResultSchema = createInsertSchema(results).omit({ id: true });
export type Result = typeof results.$inferSelect;
export type InsertResult = z.infer<typeof insertResultSchema>;

export const insertAdmissionSchema = createInsertSchema(admissions).omit({
  id: true,
  statusUpdatedAt: true,
  submittedAt: true,
});
export type Admission = typeof admissions.$inferSelect;
export type InsertAdmission = z.infer<typeof insertAdmissionSchema>;

export type AuthResponse = { message: string, user?: { id: number, email: string, role: string | null } };
