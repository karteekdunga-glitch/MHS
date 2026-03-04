import {
  type User,
  type InsertUser,
  type Announcement,
  type InsertAnnouncement,
  type Faculty,
  type InsertFaculty,
  type Event,
  type InsertEvent,
  type EventImage,
  type InsertEventImage,
  type GalleryImage,
  type InsertGalleryImage,
  type Ranker,
  type InsertRanker,
  type Academic,
  type InsertAcademic,
  type StudentLife,
  type InsertStudentLife,
  type StudentLifeImage,
  type InsertStudentLifeImage,
  type HeadmasterMessage,
  type InsertHeadmasterMessage,
  type Result,
  type InsertResult,
  type Admission,
  type InsertAdmission,
  type AdmissionStatus,
  type AcademicDocument,
  type InsertAcademicDocument,
  type SitePreferences,
  type SitePreferenceInput,
} from "@shared/schema";
import {
  normalizeResultData,
  collectClassTokens,
  summariseSubjects,
  inferSubjectsFromRecord,
} from "@shared/results";
import {
  deleteRecord as deleteFirebaseNode,
  generateNumericId,
  patchRecord as patchFirebaseRecord,
  readCollection,
  readRecord,
  writeRecord,
  type FirebaseRecord,
} from "./firebase";

export type StudentLifeWithImages = StudentLife & { images: StudentLifeImage[] };
export type EventWithImages = Event & { images: EventImage[] };

const COLLECTION_PATHS = {
  users: "users",
  announcements: "announcements",
  faculty: "faculty",
  events: "events",
  gallery: "gallery",
  rankers: "rankers",
  academics: "academics",
  studentLife: "studentLife",
  headmasterMessages: "headmasterMessages",
  results: "results",
  admissions: "admissions",
  academicDocuments: "academicDocuments",
  sitePreferences: "sitePreferences",
} as const;

const RESULT_PHOTO_KEYS = [
  "photoUrl",
  "photoURL",
  "imageUrl",
  "profileImage",
  "avatarUrl",
  "avatar",
  "picture",
  "studentImage",
] as const;

const RANKER_MANUAL_FIELDS = [
  "studentName",
  "className",
  "hallTicket",
  "examName",
  "imageUrl",
  "imagePath",
] as const;

type RankerManualField = (typeof RANKER_MANUAL_FIELDS)[number];

type CollectionKey = keyof typeof COLLECTION_PATHS;

async function listRecords<T>(key: CollectionKey): Promise<FirebaseRecord<T>[]> {
  return await readCollection<T>(COLLECTION_PATHS[key]);
}

async function getRecordById<T>(
  key: CollectionKey,
  id: number,
): Promise<FirebaseRecord<T> | undefined> {
  return await readRecord<T>(COLLECTION_PATHS[key], id);
}

async function requireRecord<T>(
  key: CollectionKey,
  id: number,
  entityName: string,
): Promise<FirebaseRecord<T>> {
  const record = await getRecordById<T>(key, id);
  if (!record) {
    throw new Error(`${entityName} not found`);
  }
  return record;
}

async function saveRecord<T>(key: CollectionKey, record: FirebaseRecord<T>): Promise<void> {
  await writeRecord<T>(COLLECTION_PATHS[key], sanitizeForFirebase(record));
}

async function updateRecord<T>(
  key: CollectionKey,
  id: number,
  updates: Partial<T>,
): Promise<void> {
  await patchFirebaseRecord<T>(COLLECTION_PATHS[key], id, sanitizeForFirebase(updates));
}

async function removeRecord(key: CollectionKey, id: number): Promise<void> {
  await deleteFirebaseNode(COLLECTION_PATHS[key], id);
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getAnnouncements(status?: string): Promise<Announcement[]>;
  getAnnouncement(id: number): Promise<Announcement | undefined>;
  createAnnouncement(data: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: number, data: Partial<InsertAnnouncement>): Promise<Announcement>;
  deleteAnnouncement(id: number): Promise<void>;

  getFaculty(status?: string): Promise<Faculty[]>;
  getFacultyById(id: number): Promise<Faculty | undefined>;
  createFaculty(data: InsertFaculty): Promise<Faculty>;
  updateFaculty(id: number, data: Partial<InsertFaculty>): Promise<Faculty>;
  deleteFaculty(id: number): Promise<void>;

  getEvents(status?: string): Promise<EventWithImages[]>;
  getEvent(id: number): Promise<EventWithImages | undefined>;
  createEvent(data: InsertEvent): Promise<EventWithImages>;
  updateEvent(id: number, data: Partial<InsertEvent>): Promise<EventWithImages>;
  deleteEvent(id: number): Promise<void>;
  getEventImages(eventId: number): Promise<EventImage[]>;
  addEventImages(
    eventId: number,
    images: Array<Omit<InsertEventImage, "eventId">>,
  ): Promise<EventImage[]>;
  removeEventImages(imageIds: number[]): Promise<EventImage[]>;
  syncEventStatuses(now?: Date): Promise<void>;

  getGalleryImages(status?: string): Promise<GalleryImage[]>;
  getGalleryImage(id: number): Promise<GalleryImage | undefined>;
  createGalleryImage(data: InsertGalleryImage): Promise<GalleryImage>;
  updateGalleryImage(id: number, data: Partial<InsertGalleryImage>): Promise<GalleryImage>;
  deleteGalleryImage(id: number): Promise<void>;

  getRankers(status?: string): Promise<Ranker[]>;
  getRanker(id: number): Promise<Ranker | undefined>;
  createRanker(data: InsertRanker): Promise<Ranker>;
  updateRanker(
    id: number,
    data: Partial<InsertRanker> & { manualFields?: string[] | null; imagePath?: string | null },
  ): Promise<Ranker>;
  deleteRanker(id: number): Promise<void>;
  syncRankersFromResults(limit?: number): Promise<void>;

  getAcademics(status?: string, category?: string): Promise<Academic[]>;
  getAcademic(id: number): Promise<Academic | undefined>;
  createAcademic(data: InsertAcademic): Promise<Academic>;
  updateAcademic(id: number, data: Partial<InsertAcademic>): Promise<Academic>;
  deleteAcademic(id: number): Promise<void>;

  getStudentLife(status?: string): Promise<StudentLifeWithImages[]>;
  getStudentLifeById(id: number): Promise<StudentLifeWithImages | undefined>;
  createStudentLife(data: InsertStudentLife): Promise<StudentLife>;
  updateStudentLife(id: number, data: Partial<InsertStudentLife>): Promise<StudentLife>;
  getStudentLifeImages(studentLifeId: number): Promise<StudentLifeImage[]>;
  addStudentLifeImages(
    studentLifeId: number,
    images: Array<Omit<InsertStudentLifeImage, "studentLifeId">>,
  ): Promise<StudentLifeImage[]>;
  removeStudentLifeImages(imageIds: number[]): Promise<StudentLifeImage[]>;
  deleteStudentLife(id: number): Promise<void>;

  getHeadmasterMessages(status?: string): Promise<HeadmasterMessage[]>;
  getHeadmasterMessage(id: number): Promise<HeadmasterMessage | undefined>;
  createHeadmasterMessage(data: InsertHeadmasterMessage): Promise<HeadmasterMessage>;
  updateHeadmasterMessage(
    id: number,
    data: Partial<InsertHeadmasterMessage>,
  ): Promise<HeadmasterMessage>;
  deleteHeadmasterMessage(id: number): Promise<void>;

  getResults(rollNo?: string, className?: string): Promise<Result[]>;
  createResults(data: InsertResult[]): Promise<void>;
  deleteResult(id: number): Promise<void>;

  getAdmissions(filters?: AdmissionFilters): Promise<Admission[]>;
  getAdmission(id: number): Promise<Admission | undefined>;
  createAdmission(data: InsertAdmission): Promise<Admission>;
  updateAdmission(id: number, data: Partial<InsertAdmission>): Promise<Admission>;
  updateAdmissionStatus(
    id: number,
    status: AdmissionStatus,
    expectedJoinDate?: string | null,
  ): Promise<Admission>;
  deleteAdmission(id: number): Promise<void>;

  getAcademicDocuments(filters?: AcademicDocFilters): Promise<AcademicDocument[]>;
  getAcademicDocumentById(id: number): Promise<AcademicDocument | undefined>;
  createAcademicDocument(data: InsertAcademicDocument): Promise<AcademicDocument>;
  updateAcademicDocumentStatus(id: number, status: string): Promise<AcademicDocument>;
  deleteAcademicDocument(id: number): Promise<void>;

  getSitePreferences(): Promise<SitePreferences>;
  updateSitePreferences(data: SitePreferenceInput): Promise<SitePreferences>;
}

export type AcademicDocFilters = {
  status?: string;
  docType?: string;
  classLevel?: string;
  academicYear?: string;
  subject?: string;
};

export type AdmissionFilters = {
  status?: AdmissionStatus;
  classLevel?: string;
  academicYear?: string;
  search?: string;
};

class FirebaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    return (await getRecordById<User>("users", id)) as User | undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const records = await listRecords<User>("users");
    return records.find((user) => user.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = generateNumericId();
    const record: User = { id, ...user, role: user.role ?? "admin" };
    await saveRecord("users", record);
    return record;
  }

  // Announcements
  async getAnnouncements(status?: string): Promise<Announcement[]> {
    const items = await listRecords<Announcement>("announcements");
    return status ? items.filter((item) => item.status === status) : items;
  }

  async getAnnouncement(id: number): Promise<Announcement | undefined> {
    return (await getRecordById<Announcement>("announcements", id)) as Announcement | undefined;
  }

  async createAnnouncement(data: InsertAnnouncement): Promise<Announcement> {
    const id = generateNumericId();
    const now = new Date().toISOString();
    const record: Announcement = {
      id,
      ...data,
      createdAt: now as unknown as Date,
      updatedAt: now as unknown as Date,
    };
    await saveRecord("announcements", record);
    return record;
  }

  async updateAnnouncement(id: number, data: Partial<InsertAnnouncement>): Promise<Announcement> {
    await updateRecord("announcements", id, {
      ...data,
      updatedAt: new Date().toISOString() as unknown as Date,
    });
    const updated = await this.getAnnouncement(id);
    if (!updated) throw new Error("Announcement not found");
    return updated;
  }

  async deleteAnnouncement(id: number): Promise<void> {
    await removeRecord("announcements", id);
  }

  // Faculty
  async getFaculty(status?: string): Promise<Faculty[]> {
    const items = await listRecords<Faculty>("faculty");
    return status ? items.filter((item) => item.status === status) : items;
  }

  async getFacultyById(id: number): Promise<Faculty | undefined> {
    return (await getRecordById<Faculty>("faculty", id)) as Faculty | undefined;
  }

  async createFaculty(data: InsertFaculty): Promise<Faculty> {
    const id = generateNumericId();
    const record: Faculty = { id, ...data };
    await saveRecord("faculty", record);
    return record;
  }

  async updateFaculty(id: number, data: Partial<InsertFaculty>): Promise<Faculty> {
    await updateRecord("faculty", id, data);
    const updated = await this.getFacultyById(id);
    if (!updated) throw new Error("Faculty profile not found");
    return updated;
  }

  async deleteFaculty(id: number): Promise<void> {
    await removeRecord("faculty", id);
  }

  // Events
  async getEvents(status?: string): Promise<EventWithImages[]> {
    await this.syncEventStatuses();
    const items = (await listRecords<EventWithImages>("events")).sort((a, b) => {
      const aTime = new Date(a.startDateTime || "").getTime();
      const bTime = new Date(b.startDateTime || "").getTime();
      return aTime - bTime;
    });
    return status ? items.filter((item) => item.status === status) : items;
  }

  async getEvent(id: number): Promise<EventWithImages | undefined> {
    return (await getRecordById<EventWithImages>("events", id)) as EventWithImages | undefined;
  }

  async createEvent(data: InsertEvent): Promise<EventWithImages> {
    const id = generateNumericId();
    const record: EventWithImages = {
      id,
      ...data,
      images: [],
    };
    await saveRecord("events", record);
    return record;
  }

  async updateEvent(id: number, data: Partial<InsertEvent>): Promise<EventWithImages> {
    await updateRecord("events", id, data);
    const updated = await this.getEvent(id);
    if (!updated) throw new Error("Event not found");
    return updated;
  }

  async deleteEvent(id: number): Promise<void> {
    await removeRecord("events", id);
  }

  async getEventImages(eventId: number): Promise<EventImage[]> {
    const event = await this.getEvent(eventId);
    return event?.images ?? [];
  }

  async addEventImages(
    eventId: number,
    images: Array<Omit<InsertEventImage, "eventId">>,
  ): Promise<EventImage[]> {
    if (!images.length) return [];
    const event = await requireRecord<EventWithImages>("events", eventId, "Event");
    const existing = event.images ?? [];
    let orderIndex =
      existing.reduce((max, img) => Math.max(max, img.orderIndex ?? max), -1) + 1;

    const appended = images.map((image) => ({
      id: generateNumericId(),
      ...image,
      orderIndex: orderIndex++,
    }));
    const nextImages = [...existing, ...appended];
    await updateRecord("events", eventId, { images: nextImages });
    return nextImages;
  }

  async removeEventImages(imageIds: number[]): Promise<EventImage[]> {
    if (!imageIds.length) return [];
    const eventsList = await listRecords<EventWithImages>("events");
    const updates: Promise<void>[] = [];
    let removed: EventImage[] = [];

    for (const event of eventsList) {
      const before = event.images ?? [];
      const after = before.filter((img) => !imageIds.includes(img.id));
      if (after.length !== before.length) {
        removed = removed.concat(before.filter((img) => imageIds.includes(img.id)));
        updates.push(updateRecord("events", event.id, { images: after }));
      }
    }
    await Promise.all(updates);
    return removed;
  }

  async syncEventStatuses(now: Date = new Date()): Promise<void> {
    const events = await listRecords<EventWithImages>("events");
    const updates: Promise<void>[] = [];
    events.forEach((event) => {
      const start = new Date(event.startDateTime || 0).getTime();
      const end = new Date(event.endDateTime || event.startDateTime || 0).getTime();
      let nextStatus = event.status;
      if (event.status === "scheduled" && start && start <= now.getTime()) {
        nextStatus = "published";
      } else if (end && end < now.getTime() && event.status !== "expired") {
        nextStatus = "expired";
      }
      if (nextStatus !== event.status) {
        updates.push(updateRecord("events", event.id, { status: nextStatus }));
      }
    });
    await Promise.all(updates);
  }

  // Gallery
  async getGalleryImages(status?: string): Promise<GalleryImage[]> {
    const items = await listRecords<GalleryImage>("gallery");
    return status ? items.filter((item) => item.status === status) : items;
  }

  async getGalleryImage(id: number): Promise<GalleryImage | undefined> {
    return (await getRecordById<GalleryImage>("gallery", id)) as GalleryImage | undefined;
  }

  async createGalleryImage(data: InsertGalleryImage): Promise<GalleryImage> {
    const id = generateNumericId();
    const record: GalleryImage = { id, ...data };
    await saveRecord("gallery", record);
    return record;
  }

  async updateGalleryImage(id: number, data: Partial<InsertGalleryImage>): Promise<GalleryImage> {
    await updateRecord("gallery", id, data);
    const updated = await this.getGalleryImage(id);
    if (!updated) throw new Error("Gallery image not found");
    return updated;
  }

  async deleteGalleryImage(id: number): Promise<void> {
    await removeRecord("gallery", id);
  }

  // Rankers
  async getRankers(status?: string): Promise<Ranker[]> {
    const items = (await listRecords<Ranker>("rankers")).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
    return status ? items.filter((item) => item.status === status) : items;
  }

  async getRanker(id: number): Promise<Ranker | undefined> {
    return (await getRecordById<Ranker>("rankers", id)) as Ranker | undefined;
  }

  async createRanker(data: InsertRanker): Promise<Ranker> {
    const id = generateNumericId();
    const record: Ranker = {
      id,
      ...data,
      source: data.source ?? "manual",
      syncedAt: new Date().toISOString() as unknown as Date,
      manualFields: data.manualFields ?? [],
    };
    await saveRecord("rankers", record);
    return record;
  }

  async updateRanker(
    id: number,
    data: Partial<InsertRanker> & { manualFields?: string[] | null; imagePath?: string | null },
  ): Promise<Ranker> {
    await updateRecord("rankers", id, data);
    const updated = await this.getRanker(id);
    if (!updated) throw new Error("Ranker not found");
    return updated;
  }

  async deleteRanker(id: number): Promise<void> {
    await removeRecord("rankers", id);
  }

  async syncRankersFromResults(limit = 10): Promise<void> {
    const [results, existingRankers] = await Promise.all([
      listRecords<Result>("results"),
      listRecords<Ranker>("rankers"),
    ]);
    const autoRankers = existingRankers.filter((ranker) => ranker.source === "auto");
    if (results.length === 0) {
      if (autoRankers.length) {
        await Promise.all(autoRankers.map((ranker) => removeRecord("rankers", ranker.id)));
      }
      return;
    }

    const autoByHallTicket = new Map(
      autoRankers.filter((ranker) => ranker.hallTicket).map((ranker) => [ranker.hallTicket as string, ranker]),
    );

    const decorated = results
      .map((record) => {
        const rawPayload = isPlainObject(record.data) ? (record.data as Record<string, any>) : undefined;
        const normalized = normalizeResultData({
          data: rawPayload,
          rawRow: rawPayload,
          fallbackYear: record.year,
        }) as Record<string, any>;
        const subjects = Array.isArray(normalized.subjects)
          ? (normalized.subjects as any[])
          : inferSubjectsFromRecord(normalized);
        const summary = summariseSubjects(subjects);
        const imageCandidate = RESULT_PHOTO_KEYS.map(
          (key) => normalized[key as keyof typeof normalized] as string | undefined,
        ).find((value) => typeof value === "string" && value.trim().length);
        return {
          rollNo: record.rollNo,
          studentName: record.studentName,
          className: normalized.className || normalized.class || normalized.grade || "",
          examName: record.examName,
          year: record.year,
          score: Math.round(summary.totalObtained),
          percentage: Number(summary.percentage.toFixed(2)),
          imageUrl: imageCandidate || null,
        };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const keepIds = new Set<number>();
    const timestamp = new Date().toISOString() as unknown as Date;

    for (let index = 0; index < decorated.length; index++) {
      const entry = decorated[index];
      const reuse = entry.rollNo ? autoByHallTicket.get(entry.rollNo) : undefined;
      const id = reuse?.id ?? generateNumericId();
      keepIds.add(id);
      const manualFields = new Set<RankerManualField>(reuse?.manualFields ?? []);

      const preferManual = <K extends RankerManualField>(field: K, autoValue: Ranker[K]) => {
        if (manualFields.has(field) && reuse) {
          return reuse[field];
        }
        return autoValue;
      };

      await saveRecord("rankers", {
        id,
        studentName: preferManual("studentName", entry.studentName),
        rank: index + 1,
        year: entry.year,
        score: entry.score,
        className: preferManual("className", entry.className),
        hallTicket: preferManual("hallTicket", entry.rollNo),
        examName: preferManual("examName", entry.examName),
        percentage: entry.percentage,
        imageUrl: preferManual("imageUrl", entry.imageUrl ?? null) ?? null,
        imagePath: preferManual("imagePath", reuse?.imagePath ?? null) ?? null,
        manualFields: Array.from(manualFields),
        status: "published",
        source: "auto",
        syncedAt: timestamp,
      } as Ranker);
    }

    const removals = autoRankers.filter((ranker) => !keepIds.has(ranker.id));
    if (removals.length) {
      await Promise.all(removals.map((ranker) => removeRecord("rankers", ranker.id)));
    }
  }

  // Academics
  async getAcademics(status?: string, category?: string): Promise<Academic[]> {
    const items = await listRecords<Academic>("academics");
    return items.filter((item) => {
      const statusMatch = status ? item.status === status : true;
      const categoryMatch = category ? item.category === category : true;
      return statusMatch && categoryMatch;
    });
  }

  async getAcademic(id: number): Promise<Academic | undefined> {
    return (await getRecordById<Academic>("academics", id)) as Academic | undefined;
  }

  async createAcademic(data: InsertAcademic): Promise<Academic> {
    const id = generateNumericId();
    const record: Academic = { id, ...data };
    await saveRecord("academics", record);
    return record;
  }

  async updateAcademic(id: number, data: Partial<InsertAcademic>): Promise<Academic> {
    await updateRecord("academics", id, data);
    const updated = await this.getAcademic(id);
    if (!updated) throw new Error("Academic record not found");
    return updated;
  }

  async deleteAcademic(id: number): Promise<void> {
    await removeRecord("academics", id);
  }

  // Student Life
  async getStudentLife(status?: string): Promise<StudentLifeWithImages[]> {
    const items = await listRecords<StudentLifeWithImages>("studentLife");
    const filtered = status ? items.filter((item) => item.status === status) : items;
    return filtered.sort((a, b) => {
      const aTime = new Date(a.createdAt || 0 as any).getTime();
      const bTime = new Date(b.createdAt || 0 as any).getTime();
      return bTime - aTime;
    });
  }

  async getStudentLifeById(id: number): Promise<StudentLifeWithImages | undefined> {
    return (await getRecordById<StudentLifeWithImages>("studentLife", id)) as
      | StudentLifeWithImages
      | undefined;
  }

  async createStudentLife(data: InsertStudentLife): Promise<StudentLife> {
    const id = generateNumericId();
    const now = new Date().toISOString();
    const record: StudentLifeWithImages = {
      id,
      ...data,
      createdAt: now as unknown as Date,
      updatedAt: now as unknown as Date,
      images: [],
    };
    await saveRecord("studentLife", record);
    return record;
  }

  async updateStudentLife(id: number, data: Partial<InsertStudentLife>): Promise<StudentLife> {
    await updateRecord("studentLife", id, {
      ...data,
      updatedAt: new Date().toISOString() as unknown as Date,
    });
    const updated = await this.getStudentLifeById(id);
    if (!updated) throw new Error("Student life entry not found");
    return updated;
  }

  async getStudentLifeImages(studentLifeId: number): Promise<StudentLifeImage[]> {
    const entry = await this.getStudentLifeById(studentLifeId);
    return entry?.images ?? [];
  }

  async addStudentLifeImages(
    studentLifeId: number,
    images: Array<Omit<InsertStudentLifeImage, "studentLifeId">>,
  ): Promise<StudentLifeImage[]> {
    if (!images.length) return [];
    const entry = await requireRecord<StudentLifeWithImages>(
      "studentLife",
      studentLifeId,
      "Student life entry",
    );
    const existing = entry.images ?? [];
    const additions = images.map((image, index) => ({
      id: generateNumericId(),
      ...image,
      studentLifeId,
      orderIndex: existing.length + index,
      createdAt: new Date().toISOString() as unknown as Date,
    }));
    const nextImages = [...existing, ...additions];
    await updateRecord("studentLife", studentLifeId, { images: nextImages });
    return nextImages;
  }

  async removeStudentLifeImages(imageIds: number[]): Promise<StudentLifeImage[]> {
    if (!imageIds.length) return [];
    const entries = await listRecords<StudentLifeWithImages>("studentLife");
    const updates: Promise<void>[] = [];
    let removed: StudentLifeImage[] = [];

    for (const entry of entries) {
      const before = entry.images ?? [];
      const after = before.filter((img) => !imageIds.includes(img.id));
      if (after.length !== before.length) {
        removed = removed.concat(before.filter((img) => imageIds.includes(img.id)));
        updates.push(updateRecord("studentLife", entry.id, { images: after }));
      }
    }
    await Promise.all(updates);
    return removed;
  }

  async deleteStudentLife(id: number): Promise<void> {
    await removeRecord("studentLife", id);
  }

  async getHeadmasterMessages(status?: string): Promise<HeadmasterMessage[]> {
    const records = await listRecords<HeadmasterMessage>("headmasterMessages");
    const sorted = records.sort((a, b) => {
      const aTime = new Date((a.updatedAt ?? a.createdAt ?? 0) as any).getTime();
      const bTime = new Date((b.updatedAt ?? b.createdAt ?? 0) as any).getTime();
      return bTime - aTime;
    });
    return status ? sorted.filter((item) => item.status === status) : sorted;
  }

  async getHeadmasterMessage(id: number): Promise<HeadmasterMessage | undefined> {
    return (await getRecordById<HeadmasterMessage>("headmasterMessages", id)) as
      | HeadmasterMessage
      | undefined;
  }

  async createHeadmasterMessage(data: InsertHeadmasterMessage): Promise<HeadmasterMessage> {
    const id = generateNumericId();
    const now = new Date().toISOString() as unknown as Date;
    const record: HeadmasterMessage = {
      id,
      status: data.status ?? "draft",
      createdAt: now,
      updatedAt: now,
      ...data,
    };
    await saveRecord("headmasterMessages", record);
    return record;
  }

  async updateHeadmasterMessage(
    id: number,
    data: Partial<InsertHeadmasterMessage>,
  ): Promise<HeadmasterMessage> {
    await updateRecord("headmasterMessages", id, {
      ...data,
      updatedAt: new Date().toISOString() as unknown as Date,
    });
    const updated = await this.getHeadmasterMessage(id);
    if (!updated) throw new Error("Headmaster message not found");
    return updated;
  }

  async deleteHeadmasterMessage(id: number): Promise<void> {
    await removeRecord("headmasterMessages", id);
  }

  // Results
  async getResults(rollNo?: string, className?: string): Promise<Result[]> {
    const records = (await listRecords<Result>("results")).map((record) => ({
      ...record,
      data: normalizeResultData({
        data: isPlainObject(record.data) ? (record.data as Record<string, any>) : undefined,
        rawRow: record as Record<string, any>,
        fallbackYear: record.year,
      }),
    }));

    const filteredByRoll = rollNo
      ? records.filter((record) => record.rollNo === rollNo)
      : records;
    if (!className) return filteredByRoll;
    return filteredByRoll.filter((record) => matchesClass(record, className, Boolean(rollNo)));
  }

  async createResults(data: InsertResult[]): Promise<void> {
    if (!data.length) return;
    const existing = await listRecords<Result>("results");
    const existingByRoll = new Map(existing.map((record) => [record.rollNo, record]));

    for (const entry of data) {
      const normalized = {
        ...entry,
        data: normalizeResultData({
          data: isPlainObject(entry.data) ? (entry.data as Record<string, any>) : undefined,
          rawRow: entry as Record<string, any>,
          fallbackYear: entry.year,
        }),
      };
      const current = existingByRoll.get(entry.rollNo);
      if (current) {
        await updateRecord("results", current.id, normalized);
      } else {
        const id = generateNumericId();
        await saveRecord("results", { id, ...normalized });
      }
    }
    await this.syncRankersFromResults();
  }

  async deleteResult(id: number): Promise<void> {
    await removeRecord("results", id);
    await this.syncRankersFromResults();
  }

  // Admissions
  async getAdmissions(filters?: AdmissionFilters): Promise<Admission[]> {
    const items = await listRecords<Admission>("admissions");
    return items.filter((item) => {
      const statusMatch = filters?.status ? item.status === filters.status : true;
      const classMatch = filters?.classLevel
        ? item.classApplyingFor === filters.classLevel
        : true;
      const yearMatch = filters?.academicYear ? item.academicYear === filters.academicYear : true;
      const searchTerm = filters?.search?.toLowerCase();
      const searchMatch = searchTerm
        ? [item.studentName, item.parentName, item.email, item.phone]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(searchTerm))
        : true;
      return statusMatch && classMatch && yearMatch && searchMatch;
    });
  }

  async getAdmission(id: number): Promise<Admission | undefined> {
    return (await getRecordById<Admission>("admissions", id)) as Admission | undefined;
  }

  async createAdmission(data: InsertAdmission): Promise<Admission> {
    const id = generateNumericId();
    const record: Admission = {
      id,
      ...data,
      submittedAt: new Date().toISOString() as unknown as Date,
      statusUpdatedAt: new Date().toISOString() as unknown as Date,
    };
    await saveRecord("admissions", record);
    return record;
  }

  async updateAdmission(id: number, data: Partial<InsertAdmission>): Promise<Admission> {
    await updateRecord("admissions", id, data);
    const updated = await this.getAdmission(id);
    if (!updated) throw new Error("Admission not found");
    return updated;
  }

  async updateAdmissionStatus(
    id: number,
    status: AdmissionStatus,
    expectedJoinDate?: string | null,
  ): Promise<Admission> {
    await updateRecord("admissions", id, {
      status,
      expectedJoinDate: expectedJoinDate ?? null,
      statusUpdatedAt: new Date().toISOString() as unknown as Date,
    });
    const updated = await this.getAdmission(id);
    if (!updated) throw new Error("Admission not found");
    return updated;
  }

  async deleteAdmission(id: number): Promise<void> {
    await removeRecord("admissions", id);
  }

  // Academic Documents
  async getAcademicDocuments(filters?: AcademicDocFilters): Promise<AcademicDocument[]> {
    const items = await listRecords<AcademicDocument>("academicDocuments");
    return items.filter((doc) => {
      const statusMatch = filters?.status ? doc.status === filters.status : true;
      const docTypeMatch = filters?.docType ? doc.docType === filters.docType : true;
      const yearMatch = filters?.academicYear ? doc.academicYear === filters.academicYear : true;
      const classMatch = filters?.classLevel ? doc.classLevel === filters.classLevel : true;
      const subjectMatch = filters?.subject ? doc.subject === filters.subject : true;
      return statusMatch && docTypeMatch && yearMatch && classMatch && subjectMatch;
    });
  }

  async getAcademicDocumentById(id: number): Promise<AcademicDocument | undefined> {
    return (await getRecordById<AcademicDocument>("academicDocuments", id)) as
      | AcademicDocument
      | undefined;
  }

  async createAcademicDocument(data: InsertAcademicDocument): Promise<AcademicDocument> {
    const id = generateNumericId();
    const record: AcademicDocument = {
      id,
      ...data,
      uploadedAt: new Date().toISOString() as unknown as Date,
    };
    await saveRecord("academicDocuments", record);
    return record;
  }

  async updateAcademicDocumentStatus(
    id: number,
    status: string,
  ): Promise<AcademicDocument> {
    await updateRecord("academicDocuments", id, { status });
    const updated = await this.getAcademicDocumentById(id);
    if (!updated) throw new Error("Document not found");
    return updated;
  }

  async deleteAcademicDocument(id: number): Promise<void> {
    await removeRecord("academicDocuments", id);
  }

  async getSitePreferences(): Promise<SitePreferences> {
    return this.ensureSitePreferences();
  }

  async updateSitePreferences(data: SitePreferenceInput): Promise<SitePreferences> {
    const current = await this.ensureSitePreferences();
    const next: SitePreferences = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString() as unknown as Date,
    };
    await saveRecord("sitePreferences", next);
    return next;
  }

  private async ensureSitePreferences(): Promise<SitePreferences> {
    const existing = await listRecords<SitePreferences>("sitePreferences");
    if (existing.length > 0) {
      return existing[0];
    }
    const defaults: SitePreferences = {
      id: generateNumericId(),
      showResultsInNav: true,
      updatedAt: new Date().toISOString() as unknown as Date,
    };
    await saveRecord("sitePreferences", defaults);
    return defaults;
  }
}

export const storage = new FirebaseStorage();

function matchesClass(record: Result, className: string, allowLooseMatch: boolean) {
  const data = (record.data ?? {}) as Record<string, unknown>;
  const recordTokens = new Set<string>();
  const classCandidates = [
    data["classSlug"],
    data["className"],
    data["class"],
    data["Class"],
    data["class name"],
    data["Class Name"],
    data["class level"],
    data["Class Level"],
    data["standard"],
    data["Standard"],
    data["grade"],
    data["Grade"],
    data["classSection"],
    data["class section"],
    data["section"],
    data["Section"],
  ];
  const examCandidates = [
    data["examClass"],
    data["exam class"],
    data["examName"],
    data["exam name"],
    data["Exam Name"],
    data["exam"],
    data["Exam"],
    data["exam title"],
    data["Exam Title"],
    data["course"],
    data["Course"],
    data["stream"],
    data["Stream"],
    record.examName,
  ];

  [...classCandidates, ...examCandidates].forEach((candidate) => {
    collectClassTokens(candidate).forEach((token) => recordTokens.add(token));
  });

  const recordVariants = Array.from(recordTokens).filter((token) => !!token);
  const filterVariants = collectClassTokens(className).filter((token) => !!token);

  if (!filterVariants.length) {
    return true;
  }

  if (!recordVariants.length) {
    return allowLooseMatch;
  }

  for (const expected of filterVariants) {
    for (const token of recordVariants) {
      if (!expected || !token) continue;
      if (token === expected || token.includes(expected) || expected.includes(token)) {
        return true;
      }
    }
  }
  return false;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeForFirebase<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForFirebase(item)) as unknown as T;
  }
  if (value instanceof Date || value instanceof Buffer) {
    return value;
  }
  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    Object.entries(value).forEach(([key, entry]) => {
      if (entry === undefined) return;
      result[key] = sanitizeForFirebase(entry);
    });
    return result as T;
  }
  return value;
}
