import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  users, announcements, facultyProfiles, events, galleryImages, rankers,
  type User, type InsertUser,
  type Announcement, type InsertAnnouncement,
  type Faculty, type InsertFaculty,
  type Event, type InsertEvent,
  type GalleryImage, type InsertGalleryImage,
  type Ranker, type InsertRanker
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Announcements
  getAnnouncements(status?: string): Promise<Announcement[]>;
  getAnnouncement(id: number): Promise<Announcement | undefined>;
  createAnnouncement(data: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: number, data: Partial<InsertAnnouncement>): Promise<Announcement>;
  deleteAnnouncement(id: number): Promise<void>;

  // Faculty
  getFaculty(status?: string): Promise<Faculty[]>;
  getFacultyById(id: number): Promise<Faculty | undefined>;
  createFaculty(data: InsertFaculty): Promise<Faculty>;
  updateFaculty(id: number, data: Partial<InsertFaculty>): Promise<Faculty>;
  deleteFaculty(id: number): Promise<void>;

  // Events
  getEvents(status?: string): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(data: InsertEvent): Promise<Event>;
  updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: number): Promise<void>;

  // Gallery
  getGalleryImages(status?: string): Promise<GalleryImage[]>;
  getGalleryImage(id: number): Promise<GalleryImage | undefined>;
  createGalleryImage(data: InsertGalleryImage): Promise<GalleryImage>;
  updateGalleryImage(id: number, data: Partial<InsertGalleryImage>): Promise<GalleryImage>;
  deleteGalleryImage(id: number): Promise<void>;

  // Rankers
  getRankers(status?: string): Promise<Ranker[]>;
  getRanker(id: number): Promise<Ranker | undefined>;
  createRanker(data: InsertRanker): Promise<Ranker>;
  updateRanker(id: number, data: Partial<InsertRanker>): Promise<Ranker>;
  deleteRanker(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  // Announcements
  async getAnnouncements(status?: string): Promise<Announcement[]> {
    if (status) {
      return await db.select().from(announcements).where(eq(announcements.status, status));
    }
    return await db.select().from(announcements);
  }
  async getAnnouncement(id: number): Promise<Announcement | undefined> {
    const [item] = await db.select().from(announcements).where(eq(announcements.id, id));
    return item;
  }
  async createAnnouncement(data: InsertAnnouncement): Promise<Announcement> {
    const [item] = await db.insert(announcements).values(data).returning();
    return item;
  }
  async updateAnnouncement(id: number, data: Partial<InsertAnnouncement>): Promise<Announcement> {
    const [item] = await db.update(announcements).set({ ...data, updatedAt: new Date() }).where(eq(announcements.id, id)).returning();
    return item;
  }
  async deleteAnnouncement(id: number): Promise<void> {
    await db.delete(announcements).where(eq(announcements.id, id));
  }

  // Faculty
  async getFaculty(status?: string): Promise<Faculty[]> {
    if (status) {
      return await db.select().from(facultyProfiles).where(eq(facultyProfiles.status, status));
    }
    return await db.select().from(facultyProfiles);
  }
  async getFacultyById(id: number): Promise<Faculty | undefined> {
    const [item] = await db.select().from(facultyProfiles).where(eq(facultyProfiles.id, id));
    return item;
  }
  async createFaculty(data: InsertFaculty): Promise<Faculty> {
    const [item] = await db.insert(facultyProfiles).values(data).returning();
    return item;
  }
  async updateFaculty(id: number, data: Partial<InsertFaculty>): Promise<Faculty> {
    const [item] = await db.update(facultyProfiles).set(data).where(eq(facultyProfiles.id, id)).returning();
    return item;
  }
  async deleteFaculty(id: number): Promise<void> {
    await db.delete(facultyProfiles).where(eq(facultyProfiles.id, id));
  }

  // Events
  async getEvents(status?: string): Promise<Event[]> {
    if (status) {
      return await db.select().from(events).where(eq(events.status, status));
    }
    return await db.select().from(events);
  }
  async getEvent(id: number): Promise<Event | undefined> {
    const [item] = await db.select().from(events).where(eq(events.id, id));
    return item;
  }
  async createEvent(data: InsertEvent): Promise<Event> {
    const [item] = await db.insert(events).values(data).returning();
    return item;
  }
  async updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event> {
    const [item] = await db.update(events).set(data).where(eq(events.id, id)).returning();
    return item;
  }
  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  // Gallery
  async getGalleryImages(status?: string): Promise<GalleryImage[]> {
    if (status) {
      return await db.select().from(galleryImages).where(eq(galleryImages.status, status));
    }
    return await db.select().from(galleryImages);
  }
  async getGalleryImage(id: number): Promise<GalleryImage | undefined> {
    const [item] = await db.select().from(galleryImages).where(eq(galleryImages.id, id));
    return item;
  }
  async createGalleryImage(data: InsertGalleryImage): Promise<GalleryImage> {
    const [item] = await db.insert(galleryImages).values(data).returning();
    return item;
  }
  async updateGalleryImage(id: number, data: Partial<InsertGalleryImage>): Promise<GalleryImage> {
    const [item] = await db.update(galleryImages).set(data).where(eq(galleryImages.id, id)).returning();
    return item;
  }
  async deleteGalleryImage(id: number): Promise<void> {
    await db.delete(galleryImages).where(eq(galleryImages.id, id));
  }

  // Rankers
  async getRankers(status?: string): Promise<Ranker[]> {
    if (status) {
      return await db.select().from(rankers).where(eq(rankers.status, status));
    }
    return await db.select().from(rankers);
  }
  async getRanker(id: number): Promise<Ranker | undefined> {
    const [item] = await db.select().from(rankers).where(eq(rankers.id, id));
    return item;
  }
  async createRanker(data: InsertRanker): Promise<Ranker> {
    const [item] = await db.insert(rankers).values(data).returning();
    return item;
  }
  async updateRanker(id: number, data: Partial<InsertRanker>): Promise<Ranker> {
    const [item] = await db.update(rankers).set(data).where(eq(rankers.id, id)).returning();
    return item;
  }
  async deleteRanker(id: number): Promise<void> {
    await db.delete(rankers).where(eq(rankers.id, id));
  }
}

export const storage = new DatabaseStorage();
