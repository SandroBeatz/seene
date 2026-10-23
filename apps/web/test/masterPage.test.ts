import { describe, it, expect } from 'vitest'
import {
  activeVacationUntil,
  daysBetween,
  instagramLink,
  mergeWorkingDays,
  roundVisits,
  summarizeWorkingHours,
  telegramLink,
  todayIn,
  whatsappLink
} from '../shared/utils/masterPage'

const day = (start: string, end: string, enabled = true) => ({ start, end, enabled, breaks: [] })

describe('summarizeWorkingHours', () => {
  it('merges consecutive days with the same hours', () => {
    const days = {
      monday: day('10:00:00', '20:00:00'),
      tuesday: day('10:00', '20:00'),
      wednesday: day('10:00', '20:00'),
      thursday: day('10:00', '20:00'),
      friday: day('10:00', '20:00'),
      saturday: day('10:00', '20:00'),
      sunday: day('10:00', '20:00', false)
    }
    expect(summarizeWorkingHours(days)).toEqual([{ from: 1, to: 6, start: '10:00', end: '20:00' }])
  })

  it('splits on different hours and on days off', () => {
    const days = {
      monday: day('10:00', '20:00'),
      tuesday: day('10:00', '20:00'),
      wednesday: day('10:00', '20:00', false),
      thursday: day('10:00', '20:00'),
      saturday: day('11:00', '16:00')
    }
    expect(summarizeWorkingHours(days)).toEqual([
      { from: 1, to: 2, start: '10:00', end: '20:00' },
      { from: 4, to: 4, start: '10:00', end: '20:00' },
      { from: 6, to: 6, start: '11:00', end: '16:00' }
    ])
  })

  it('is empty without a schedule', () => {
    expect(summarizeWorkingHours(null)).toEqual([])
    expect(summarizeWorkingHours({ monday: { start: null, end: null, enabled: true } })).toEqual([])
  })
})

describe('mergeWorkingDays', () => {
  it('joins consecutive days with different hours', () => {
    expect(
      mergeWorkingDays([
        { from: 1, to: 1, start: '11:00', end: '18:00' },
        { from: 2, to: 2, start: '10:00', end: '18:30' },
        { from: 3, to: 5, start: '09:00', end: '18:00' },
        { from: 7, to: 7, start: '12:00', end: '16:00' }
      ])
    ).toEqual([
      { from: 1, to: 5 },
      { from: 7, to: 7 }
    ])
  })
})

describe('roundVisits', () => {
  it('is exact below 100 and rounds down to hundreds with a plus after', () => {
    expect(roundVisits(42)).toEqual({ value: 42, plus: false })
    expect(roundVisits(1249)).toEqual({ value: 1200, plus: true })
    expect(roundVisits(100)).toEqual({ value: 100, plus: true })
  })
})

describe('contact links', () => {
  it('builds wa.me links from any number format', () => {
    expect(whatsappLink('+996 555 123-456')).toBe('https://wa.me/996555123456')
    expect(whatsappLink('996555123456', 'Hi Aigul!')).toBe(
      'https://wa.me/996555123456?text=Hi%20Aigul!'
    )
    expect(whatsappLink('12')).toBeNull()
  })

  it('accepts handles, @handles and full links', () => {
    expect(telegramLink('@aigul')).toBe('https://t.me/aigul')
    expect(telegramLink('https://t.me/aigul')).toBe('https://t.me/aigul')
    expect(instagramLink('aigul.nails')).toBe('https://instagram.com/aigul.nails')
    expect(instagramLink('https://www.instagram.com/aigul.nails/?hl=ru')).toBe(
      'https://instagram.com/aigul.nails'
    )
    expect(instagramLink('  ')).toBeNull()
  })
})

describe('vacation', () => {
  const vacation = { vacation_from: '2026-11-01', vacation_until: '2026-11-05' }

  it('returns the end date only while the vacation is on', () => {
    expect(activeVacationUntil(vacation, '2026-10-31')).toBeNull()
    expect(activeVacationUntil(vacation, '2026-11-01')).toBe('2026-11-05')
    expect(activeVacationUntil(vacation, '2026-11-05')).toBe('2026-11-05')
    expect(activeVacationUntil(vacation, '2026-11-06')).toBeNull()
    expect(activeVacationUntil({ vacation_from: null, vacation_until: null }, '2026-11-01')).toBe(
      null
    )
  })
})

describe('dates', () => {
  it('counts days between dates across months', () => {
    expect(daysBetween('2026-10-31', '2026-11-01')).toBe(1)
    expect(daysBetween('2026-10-23', '2026-10-23')).toBe(0)
  })

  it("gives today's date in the master's time zone", () => {
    // 2026-10-23 20:00 UTC is already Oct 24 in Bishkek (UTC+6).
    const now = Date.UTC(2026, 9, 23, 20, 0)
    expect(todayIn('Asia/Bishkek', now)).toBe('2026-10-24')
    expect(todayIn('America/Toronto', now)).toBe('2026-10-23')
  })
})
