import { describe, it, expect } from 'vitest'
import {
  UsernameSchema,
  EmailSchema,
  PasswordSchema,
  LoginSchema,
  RegisterSchema,
  CreatePostSchema,
  CreateCommentSchema,
  UpdateProfileSchema,
  CreateReportSchema,
  SearchSchema,
} from '@/lib/validations'

describe('UsernameSchema', () => {
  it('accepts valid usernames', () => {
    expect(UsernameSchema.parse('john_doe')).toBe('john_doe')
    expect(UsernameSchema.parse('abc123')).toBe('abc123')
    expect(UsernameSchema.parse('a_b_c')).toBe('a_b_c')
  })

  it('rejects short usernames', () => {
    expect(() => UsernameSchema.parse('ab')).toThrow()
  })

  it('rejects long usernames', () => {
    expect(() => UsernameSchema.parse('a'.repeat(31))).toThrow()
  })

  it('rejects usernames with special characters', () => {
    expect(() => UsernameSchema.parse('hello world')).toThrow()
    expect(() => UsernameSchema.parse('hello!')).toThrow()
  })

  it('lowercases usernames', () => {
    expect(UsernameSchema.parse('JOHN_DOE')).toBe('john_doe')
  })
})

describe('EmailSchema', () => {
  it('accepts valid emails', () => {
    expect(EmailSchema.parse('test@example.com')).toBe('test@example.com')
  })

  it('lowercases emails', () => {
    expect(EmailSchema.parse('Test@Example.COM')).toBe('test@example.com')
  })

  it('rejects invalid emails', () => {
    expect(() => EmailSchema.parse('not-an-email')).toThrow()
  })
})

describe('PasswordSchema', () => {
  it('accepts valid passwords', () => {
    expect(PasswordSchema.parse('Password1')).toBe('Password1')
    expect(PasswordSchema.parse('MyPass123')).toBe('MyPass123')
  })

  it('rejects short passwords', () => {
    expect(() => PasswordSchema.parse('Ab1')).toThrow()
  })

  it('rejects passwords without uppercase', () => {
    expect(() => PasswordSchema.parse('password1')).toThrow()
  })

  it('rejects passwords without lowercase', () => {
    expect(() => PasswordSchema.parse('PASSWORD1')).toThrow()
  })

  it('rejects passwords without numbers', () => {
    expect(() => PasswordSchema.parse('Password')).toThrow()
  })
})

describe('LoginSchema', () => {
  it('accepts valid login data', () => {
    const result = LoginSchema.parse({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(result.email).toBe('test@example.com')
    expect(result.password).toBe('password123')
  })

  it('rejects missing password', () => {
    expect(() =>
      LoginSchema.parse({ email: 'test@example.com' })
    ).toThrow()
  })
})

describe('RegisterSchema', () => {
  it('accepts valid registration data', () => {
    const result = RegisterSchema.parse({
      email: 'test@example.com',
      password: 'Password1',
      confirmPassword: 'Password1',
      username: 'testuser',
    })
    expect(result.username).toBe('testuser')
  })

  it('rejects mismatched passwords', () => {
    expect(() =>
      RegisterSchema.parse({
        email: 'test@example.com',
        password: 'Password1',
        confirmPassword: 'Password2',
        username: 'testuser',
      })
    ).toThrow()
  })
})

describe('CreatePostSchema', () => {
  it('accepts valid post data', () => {
    const result = CreatePostSchema.parse({
      title: 'My analysis on BTC',
      body: 'This is my analysis',
      direction: 'bullish',
      confidence: 8,
    })
    expect(result.title).toBe('My analysis on BTC')
    expect(result.direction).toBe('bullish')
    expect(result.confidence).toBe(8)
  })

  it('rejects short title', () => {
    expect(() =>
      CreatePostSchema.parse({ title: 'Short' })
    ).toThrow()
  })

  it('rejects confidence out of range', () => {
    expect(() =>
      CreatePostSchema.parse({
        title: 'My analysis on BTC',
        confidence: 11,
      })
    ).toThrow()
  })

  it('rejects more than 5 images', () => {
    expect(() =>
      CreatePostSchema.parse({
        title: 'My analysis on BTC',
        images: Array(6).fill({ storage_path: 'path', sort_order: 0 }),
      })
    ).toThrow()
  })

  it('accepts post with all optional fields omitted', () => {
    const result = CreatePostSchema.parse({
      title: 'My analysis on the market trends',
    })
    expect(result.body).toBeNull()
    expect(result.direction).toBeUndefined()
    expect(result.tags).toEqual([])
    expect(result.images).toEqual([])
  })
})

describe('CreateCommentSchema', () => {
  it('accepts valid comment', () => {
    const result = CreateCommentSchema.parse({
      post_id: '00000000-0000-0000-0000-000000000001',
      body: 'Great analysis!',
    })
    expect(result.body).toBe('Great analysis!')
  })

  it('rejects empty comment', () => {
    expect(() =>
      CreateCommentSchema.parse({
        post_id: '00000000-0000-0000-0000-000000000001',
        body: '',
      })
    ).toThrow()
  })

  it('rejects comment over 2000 chars', () => {
    expect(() =>
      CreateCommentSchema.parse({
        post_id: '00000000-0000-0000-0000-000000000001',
        body: 'a'.repeat(2001),
      })
    ).toThrow()
  })
})

describe('UpdateProfileSchema', () => {
  it('accepts valid profile update', () => {
    const result = UpdateProfileSchema.parse({
      display_name: 'John Doe',
      bio: 'Elliott Wave analyst',
    })
    expect(result.display_name).toBe('John Doe')
    expect(result.bio).toBe('Elliott Wave analyst')
  })

  it('accepts empty update', () => {
    const result = UpdateProfileSchema.parse({})
    expect(result).toEqual({})
  })

  it('accepts empty website string', () => {
    const result = UpdateProfileSchema.parse({ website: '' })
    expect(result.website).toBe('')
  })

  it('rejects invalid website', () => {
    expect(() =>
      UpdateProfileSchema.parse({ website: 'not-a-url' })
    ).toThrow()
  })
})

describe('CreateReportSchema', () => {
  it('accepts valid report', () => {
    const result = CreateReportSchema.parse({
      reportable_type: 'post',
      reportable_id: '00000000-0000-0000-0000-000000000001',
      reason: 'spam',
    })
    expect(result.reason).toBe('spam')
  })

  it('rejects invalid reportable_type', () => {
    expect(() =>
      CreateReportSchema.parse({
        reportable_type: 'invalid',
        reportable_id: '00000000-0000-0000-0000-000000000001',
        reason: 'spam',
      })
    ).toThrow()
  })
})

describe('SearchSchema', () => {
  it('accepts valid search query', () => {
    const result = SearchSchema.parse({ q: 'bitcoin' })
    expect(result.q).toBe('bitcoin')
    expect(result.type).toBe('posts')
    expect(result.sort).toBe('relevance')
  })

  it('accepts search with all options', () => {
    const result = SearchSchema.parse({
      q: 'ethereum',
      type: 'profiles',
      sort: 'recent',
      direction: 'bullish',
    })
    expect(result.type).toBe('profiles')
    expect(result.sort).toBe('recent')
    expect(result.direction).toBe('bullish')
  })
})
