import { z } from 'zod';
import { 
  insertAnnouncementSchema, announcements, 
  facultyProfiles,
  events, eventStatusValues,
  insertGallerySchema, galleryImages,
  insertRankerSchema, rankers,
  insertAcademicSchema, academics,
  studentLife,
  insertResultSchema, results,
  admissions,
  insertAcademicDocumentSchema, academicDocuments,
  users,
  admissionStatusValues,
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

const UserPublic = z.object({
  id: z.number(),
  email: z.string(),
  role: z.string().nullable(),
});

const academicDocFilterSchema = z.object({
  status: z.string().optional(),
  docType: z.string().optional(),
  academicYear: z.string().optional(),
  classLevel: z.string().optional(),
  subject: z.string().optional(),
}).optional();

const academicDocStatusInput = z.object({
  status: z.enum(["draft", "published"]),
});

const isoDateTimeString = z
  .string()
  .min(4)
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Provide a valid date/time value.",
  });

const eventStatusEnum = z.enum(eventStatusValues);

const eventRemoteImageSchema = z.object({
  url: z.string().url(),
  caption: z.string().optional(),
});

const eventCreateInput = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  location: z.string().min(3),
  category: z.string().optional(),
  status: eventStatusEnum.optional(),
  startDateTime: isoDateTimeString,
  endDateTime: isoDateTimeString.optional(),
  publishAt: isoDateTimeString.optional(),
  remoteImages: z.array(eventRemoteImageSchema).optional(),
});

const eventUpdateInput = eventCreateInput.partial().extend({
  retainImageIds: z.array(z.number()).optional(),
});

const eventImageOutput = z.object({
  id: z.number(),
  eventId: z.number(),
  imageUrl: z.string(),
  sourceType: z.string(),
  filePath: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  orderIndex: z.number().nullable().optional(),
  createdAt: z.string().nullable().optional(),
});

const eventResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  location: z.string(),
  category: z.string(),
  status: eventStatusEnum,
  startDateTime: z.string(),
  endDateTime: z.string().nullable().optional(),
  publishAt: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  images: z.array(eventImageOutput).default([]),
});

const admissionStatusEnum = z.enum(admissionStatusValues);

const admissionFiltersSchema = z.object({
  status: admissionStatusEnum.optional(),
  classLevel: z.string().optional(),
  academicYear: z.string().optional(),
  search: z.string().optional(),
}).optional();

const admissionBaseInput = z.object({
  studentName: z.string().min(2),
  parentName: z.string().min(2),
  classApplyingFor: z.string().min(1),
  academicYear: z.string().min(4).max(32).optional(),
  dob: z.string().optional(),
  phone: z.string().min(6),
  email: z.string().email(),
  address: z.string().min(5),
  previousSchool: z.string().optional(),
  message: z.string().optional(),
});

const adminAdmissionInput = admissionBaseInput.extend({
  status: admissionStatusEnum.optional(),
  expectedJoinDate: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
});

const publicAdmissionInput = admissionBaseInput;

const admissionStatusUpdateInput = z.object({
  status: admissionStatusEnum,
  expectedJoinDate: z.string().optional(),
});

const studentLifeCreateInput = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  highlightTag: z.string().max(48).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

const studentLifeUpdateInput = studentLifeCreateInput.partial().extend({
  retainImageIds: z.array(z.number()).optional(),
});

const facultyBaseInput = z.object({
  name: z.string().min(2),
  role: z.string().min(2),
  department: z.string().min(2),
  qualification: z.string().optional(),
  experience: z.string().optional(),
  description: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  imageSourceType: z.enum(["url", "upload"]).default("url"),
  imageUrl: z.string().url().optional(),
});

const facultyUpdateInput = facultyBaseInput.partial().extend({
  imageSourceType: z.enum(["url", "upload"]).optional(),
});

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({ email: z.string().email(), password: z.string() }),
      responses: {
        200: z.object({ message: z.string(), user: UserPublic }),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: UserPublic,
        401: errorSchemas.unauthorized,
      },
    }
  },
  announcements: {
    list: {
      method: 'GET' as const,
      path: '/api/announcements' as const,
      input: z.object({ status: z.string().optional() }).optional(),
      responses: { 200: z.array(z.custom<typeof announcements.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/announcements' as const,
      input: insertAnnouncementSchema,
      responses: { 201: z.custom<typeof announcements.$inferSelect>(), 401: errorSchemas.unauthorized },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/announcements/:id' as const,
      input: insertAnnouncementSchema.partial(),
      responses: { 200: z.custom<typeof announcements.$inferSelect>(), 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/announcements/:id' as const,
      responses: { 204: z.void(), 404: errorSchemas.notFound },
    }
  },
  faculty: {
    list: {
      method: 'GET' as const,
      path: '/api/faculty' as const,
      input: z.object({ status: z.string().optional() }).optional(),
      responses: { 200: z.array(z.custom<typeof facultyProfiles.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/faculty' as const,
      input: facultyBaseInput,
      responses: { 201: z.custom<typeof facultyProfiles.$inferSelect>(), 401: errorSchemas.unauthorized },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/faculty/:id' as const,
      input: facultyUpdateInput,
      responses: { 200: z.custom<typeof facultyProfiles.$inferSelect>(), 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/faculty/:id' as const,
      responses: { 204: z.void(), 404: errorSchemas.notFound },
    }
  },
  events: {
    list: {
      method: 'GET' as const,
      path: '/api/events' as const,
      input: z.object({ status: z.string().optional(), scope: z.string().optional() }).optional(),
      responses: { 200: z.array(eventResponseSchema) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/events' as const,
      input: eventCreateInput,
      responses: { 201: eventResponseSchema, 401: errorSchemas.unauthorized },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/events/:id' as const,
      input: eventUpdateInput,
      responses: { 200: eventResponseSchema, 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/events/:id' as const,
      responses: { 204: z.void(), 404: errorSchemas.notFound },
    }
  },
  gallery: {
    list: {
      method: 'GET' as const,
      path: '/api/gallery' as const,
      input: z.object({ status: z.string().optional() }).optional(),
      responses: { 200: z.array(z.custom<typeof galleryImages.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/gallery' as const,
      input: insertGallerySchema,
      responses: { 201: z.custom<typeof galleryImages.$inferSelect>(), 401: errorSchemas.unauthorized },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/gallery/:id' as const,
      input: insertGallerySchema.partial(),
      responses: { 200: z.custom<typeof galleryImages.$inferSelect>(), 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/gallery/:id' as const,
      responses: { 204: z.void(), 404: errorSchemas.notFound },
    }
  },
  rankers: {
    list: {
      method: 'GET' as const,
      path: '/api/rankers' as const,
      input: z.object({ status: z.string().optional() }).optional(),
      responses: { 200: z.array(z.custom<typeof rankers.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/rankers' as const,
      input: insertRankerSchema.extend({
        rank: z.coerce.number(),
        year: z.coerce.number(),
        score: z.coerce.number(),
        percentage: z.coerce.number().optional(),
      }),
      responses: { 201: z.custom<typeof rankers.$inferSelect>(), 401: errorSchemas.unauthorized },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/rankers/:id' as const,
      input: insertRankerSchema
        .extend({
          rank: z.coerce.number().optional(),
          year: z.coerce.number().optional(),
          score: z.coerce.number().optional(),
          percentage: z.coerce.number().optional(),
        })
        .partial(),
      responses: { 200: z.custom<typeof rankers.$inferSelect>(), 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/rankers/:id' as const,
      responses: { 204: z.void(), 404: errorSchemas.notFound },
    },
    uploadPhoto: {
      method: 'POST' as const,
      path: '/api/rankers/:id/photo' as const,
      responses: { 200: z.custom<typeof rankers.$inferSelect>(), 404: errorSchemas.notFound },
    }
  },
  academics: {
    list: {
      method: 'GET' as const,
      path: '/api/academics' as const,
      input: z.object({ status: z.string().optional(), category: z.string().optional() }).optional(),
      responses: { 200: z.array(z.custom<typeof academics.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/academics' as const,
      input: insertAcademicSchema,
      responses: { 201: z.custom<typeof academics.$inferSelect>(), 401: errorSchemas.unauthorized },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/academics/:id' as const,
      input: insertAcademicSchema.partial(),
      responses: { 200: z.custom<typeof academics.$inferSelect>(), 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/academics/:id' as const,
      responses: { 204: z.void(), 404: errorSchemas.notFound },
    }
  },
  academicDocs: {
    list: {
      method: 'GET' as const,
      path: '/api/academic-docs' as const,
      input: academicDocFilterSchema,
      responses: { 200: z.array(z.custom<typeof academicDocuments.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/academic-docs' as const,
      responses: { 201: z.custom<typeof academicDocuments.$inferSelect>(), 401: errorSchemas.unauthorized },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/academic-docs/:id' as const,
      responses: { 204: z.void(), 404: errorSchemas.notFound },
    },
    updateStatus: {
      method: 'POST' as const,
      path: '/api/academic-docs/:id/status' as const,
      input: academicDocStatusInput,
      responses: { 200: z.custom<typeof academicDocuments.$inferSelect>(), 404: errorSchemas.notFound },
    },
    file: {
      method: 'GET' as const,
      path: '/api/academic-docs/:id/file' as const,
      responses: { 200: z.void(), 404: errorSchemas.notFound },
    },
  },
  studentLife: {
    list: {
      method: 'GET' as const,
      path: '/api/student-life' as const,
      input: z.object({ status: z.string().optional() }).optional(),
      responses: { 200: z.array(z.any()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/student-life' as const,
      input: studentLifeCreateInput,
      responses: { 201: z.any(), 401: errorSchemas.unauthorized },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/student-life/:id' as const,
      input: studentLifeUpdateInput,
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/student-life/:id' as const,
      responses: { 204: z.void(), 404: errorSchemas.notFound },
    }
  },
  results: {
    list: {
      method: 'GET' as const,
      path: '/api/results' as const,
      input: z.object({ rollNo: z.string().optional(), className: z.string().optional() }).optional(),
      responses: { 200: z.array(z.custom<typeof results.$inferSelect>()) },
    },
    bulkCreate: {
      method: 'POST' as const,
      path: '/api/results/bulk' as const,
      input: z.array(insertResultSchema),
      responses: { 201: z.object({ count: z.number() }), 401: errorSchemas.unauthorized },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/results/:id' as const,
      responses: { 204: z.void(), 404: errorSchemas.notFound },
    }
  },
  admissions: {
    list: {
      method: 'GET' as const,
      path: '/api/admissions' as const,
      input: admissionFiltersSchema,
      responses: { 200: z.array(z.custom<typeof admissions.$inferSelect>()) },
    },
    publicCreate: {
      method: 'POST' as const,
      path: '/api/admissions/enquiry' as const,
      input: publicAdmissionInput,
      responses: { 201: z.custom<typeof admissions.$inferSelect>() },
    },
    create: {
      method: 'POST' as const,
      path: '/api/admissions' as const,
      input: adminAdmissionInput,
      responses: { 201: z.custom<typeof admissions.$inferSelect>(), 401: errorSchemas.unauthorized },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/admissions/:id' as const,
      input: adminAdmissionInput.partial(),
      responses: { 200: z.custom<typeof admissions.$inferSelect>(), 404: errorSchemas.notFound },
    },
    updateStatus: {
      method: 'POST' as const,
      path: '/api/admissions/:id/status' as const,
      input: admissionStatusUpdateInput,
      responses: { 200: z.custom<typeof admissions.$inferSelect>(), 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/admissions/:id' as const,
      responses: { 204: z.void(), 404: errorSchemas.notFound },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
