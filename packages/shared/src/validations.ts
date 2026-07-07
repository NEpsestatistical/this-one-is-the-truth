import { z } from 'zod'

export const UsernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username can only contain letters, numbers, and underscores',
  )
  .transform((v) => v.toLowerCase())

export const EmailSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email is too long')
  .transform((v) => v.toLowerCase().trim())

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number')

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
  returnUrl: z.string().optional(),
})

export const RegisterSchema = z
  .object({
    email: EmailSchema,
    password: PasswordSchema,
    confirmPassword: z.string(),
    username: UsernameSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const CreatePostSchema = z.object({
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must be at most 200 characters'),
  body: z
    .string()
    .max(10000, 'Post body is too long')
    .optional()
    .nullable()
    .default(null),
  direction: z.enum(['bullish', 'bearish', 'neutral']).optional().nullable(),
  confidence: z
    .number()
    .int()
    .min(1)
    .max(10)
    .optional()
    .nullable(),
  tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags').optional().default([]),
  images: z
    .array(
      z.object({
        storage_path: z.string().min(1),
        alt_text: z.string().max(200).optional().nullable(),
        sort_order: z.number().int().min(0),
        width: z.number().int().min(0).optional().nullable(),
        height: z.number().int().min(0).optional().nullable(),
        size: z.number().int().min(0).optional().nullable(),
        content_type: z.string().optional().nullable(),
      }),
    )
    .max(5, 'Maximum 5 images')
    .optional()
    .default([]),
})

export const UpdatePostSchema = CreatePostSchema.partial().extend({
  is_published: z.boolean().optional(),
})

export const CreateCommentSchema = z.object({
  post_id: z.string().uuid(),
  parent_id: z.string().uuid().optional().nullable(),
  body: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment is too long'),
})

export const UpdateProfileSchema = z.object({
  display_name: z
    .string()
    .max(50, 'Display name is too long')
    .optional()
    .nullable(),
  bio: z
    .string()
    .max(500, 'Bio is too long')
    .optional()
    .nullable(),
  website: z
    .string()
    .url('Invalid URL')
    .max(200)
    .optional()
    .nullable()
    .or(z.literal('')),
  location: z
    .string()
    .max(100)
    .optional()
    .nullable(),
})

export const CreateReportSchema = z.object({
  reportable_type: z.enum(['post', 'comment', 'profile']),
  reportable_id: z.string().uuid(),
  reason: z.enum([
    'spam',
    'harassment',
    'misinformation',
    'impersonation',
    'hate_speech',
    'violent',
    'copyright',
    'other',
  ]),
  description: z.string().max(2000).optional().nullable(),
})

export const SearchSchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(['posts', 'profiles', 'tags']).optional().default('posts'),
  sort: z.enum(['relevance', 'recent', 'likes']).optional().default('relevance'),
  direction: z.enum(['bullish', 'bearish', 'neutral']).optional(),
})
