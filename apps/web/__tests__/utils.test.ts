import { describe, it, expect } from 'vitest'
import { formatRelativeTime, formatCount, slugify, truncate } from '@statistical/shared'

describe('formatRelativeTime', () => {
  it('returns "just now" for recent dates', () => {
    expect(formatRelativeTime(new Date())).toBe('just now')
  })

  it('returns minutes for recent times', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000)
    expect(formatRelativeTime(date)).toBe('5m ago')
  })

  it('returns hours', () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000)
    expect(formatRelativeTime(date)).toBe('3h ago')
  })

  it('returns days', () => {
    const date = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(date)).toBe('4d ago')
  })

  it('returns formatted date for old dates', () => {
    const date = new Date('2023-01-15')
    expect(formatRelativeTime(date)).toBe('Jan 15, 2023')
  })
})

describe('formatCount', () => {
  it('returns plain number for small counts', () => {
    expect(formatCount(42)).toBe('42')
    expect(formatCount(999)).toBe('999')
  })

  it('formats thousands', () => {
    expect(formatCount(1500)).toBe('1.5K')
    expect(formatCount(10000)).toBe('10.0K')
  })

  it('formats millions', () => {
    expect(formatCount(2000000)).toBe('2.0M')
    expect(formatCount(1500000)).toBe('1.5M')
  })
})

describe('slugify', () => {
  it('lowercases and replaces spaces', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(slugify('Bitcoin $BTC!')).toBe('bitcoin-btc')
  })

  it('handles multiple hyphens', () => {
    expect(slugify('foo---bar')).toBe('foo-bar')
  })
})

describe('truncate', () => {
  it('returns full text if within limit', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('truncates and adds ellipsis', () => {
    expect(truncate('hello world this is long', 10)).toBe('hello worl...')
  })

  it('trims trailing space before ellipsis', () => {
    const result = truncate('hello world', 6)
    expect(result).toBe('hello...')
    expect(result.endsWith('...')).toBe(true)
  })
})
