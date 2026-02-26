import { z } from 'zod';
import { 
  insertAnnouncementSchema, announcements, 
  insertFacultySchema, facultyProfiles,
  insertEventSchema, events,
  insertGallerySchema, galleryImages,
  insertRankerSchema, rankers,
  users
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
      input: insertFacultySchema,
      responses: { 201: z.custom<typeof facultyProfiles.$inferSelect>(), 401: errorSchemas.unauthorized },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/faculty/:id' as const,
      input: insertFacultySchema.partial(),
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
      input: z.object({ status: z.string().optional() }).optional(),
      responses: { 200: z.array(z.custom<typeof events.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/events' as const,
      input: insertEventSchema.extend({ date: z.coerce.date() }),
      responses: { 201: z.custom<typeof events.$inferSelect>(), 401: errorSchemas.unauthorized },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/events/:id' as const,
      input: insertEventSchema.extend({ date: z.coerce.date().optional() }).partial(),
      responses: { 200: z.custom<typeof events.$inferSelect>(), 404: errorSchemas.notFound },
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
      input: insertRankerSchema.extend({ rank: z.coerce.number(), year: z.coerce.number(), score: z.coerce.number() }),
      responses: { 201: z.custom<typeof rankers.$inferSelect>(), 401: errorSchemas.unauthorized },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/rankers/:id' as const,
      input: insertRankerSchema.extend({ rank: z.coerce.number().optional(), year: z.coerce.number().optional(), score: z.coerce.number().optional() }).partial(),
      responses: { 200: z.custom<typeof rankers.$inferSelect>(), 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/rankers/:id' as const,
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
