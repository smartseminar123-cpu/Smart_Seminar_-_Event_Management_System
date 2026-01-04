import { z } from 'zod';
import { 
  insertCollegeSchema, 
  insertUserSchema, 
  insertSeminarSchema, 
  insertRegistrationSchema,
  colleges,
  users,
  seminars,
  registrations
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  // === PUBLIC & AUTH ===
  colleges: {
    list: {
      method: 'GET' as const,
      path: '/api/colleges',
      responses: {
        200: z.array(z.custom<typeof colleges.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/colleges',
      input: insertCollegeSchema,
      responses: {
        201: z.custom<typeof colleges.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: z.object({
        collegeId: z.number(),
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.object({
          user: z.custom<typeof users.$inferSelect>(),
          college: z.custom<typeof colleges.$inferSelect>(),
          redirectUrl: z.string(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
  },

  // === SUPER ADMIN ===
  superadmin: {
    stats: {
      method: 'GET' as const,
      path: '/api/superadmin/stats/:collegeId',
      responses: {
        200: z.object({
          totalSeminars: z.number(),
          averageAttendance: z.number(),
          popularType: z.string(),
          suggestion: z.string(),
        }),
      },
    },
    users: {
      list: {
        method: 'GET' as const,
        path: '/api/superadmin/users/:collegeId',
        responses: {
          200: z.array(z.custom<typeof users.$inferSelect>()),
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/superadmin/users',
        input: insertUserSchema,
        responses: {
          201: z.custom<typeof users.$inferSelect>(),
          400: errorSchemas.validation,
        },
      },
    },
  },

  // === ADMIN ===
  seminars: {
    list: {
      method: 'GET' as const,
      path: '/api/seminars/:collegeId',
      responses: {
        200: z.array(z.custom<typeof seminars.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/seminar/:id',
      responses: {
        200: z.custom<typeof seminars.$inferSelect & { registrations: typeof registrations.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    getBySlug: {
      method: 'GET' as const,
      path: '/api/seminars/slug/:slug',
      responses: {
        200: z.custom<typeof seminars.$inferSelect & { registrations: typeof registrations.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/seminars',
      input: insertSeminarSchema,
      responses: {
        201: z.custom<typeof seminars.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },

  // === PUBLIC / STUDENT ===
  registrations: {
    create: {
      method: 'POST' as const,
      path: '/api/registrations',
      input: insertRegistrationSchema,
      responses: {
        201: z.custom<typeof registrations.$inferSelect>(),
        400: errorSchemas.validation,
        409: z.object({ message: z.string() }), // Seat taken
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/registrations/:seminarId',
      responses: {
        200: z.array(z.custom<typeof registrations.$inferSelect>()),
      },
    },
  },

  // === GUARD / VERIFICATION ===
  attendance: {
    verify: {
      method: 'POST' as const,
      path: '/api/attendance/verify',
      input: z.object({ uniqueId: z.string() }),
      responses: {
        200: z.object({
          valid: z.boolean(),
          message: z.string(),
          registration: z.custom<typeof registrations.$inferSelect>().optional(),
        }),
        404: errorSchemas.notFound,
      },
    },
  },
  // Added for direct verification URL support if needed
  tickets: {
    get: {
      method: 'GET' as const,
      path: '/api/tickets/:uniqueId',
      responses: {
        200: z.custom<typeof registrations.$inferSelect & { seminar: typeof seminars.$inferSelect }>(),
        404: errorSchemas.notFound,
      },
    },
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
