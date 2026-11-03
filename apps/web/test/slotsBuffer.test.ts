import { describe, it, expect } from 'vitest'
import { buildFreeSlots, zonedTimeToUtc } from '../server/utils/slots'

const scheduleDay = { enabled: true, start: '10:00', end: '13:00', breaks: [] }
const base = {
  date: '2030-06-03',
  scheduleDay,
  timeBlocks: [],
  timezone: 'UTC',
  slotStepMinutes: 30,
  nowMs: 0
}
const visit = { start_at: '2030-06-03T11:00:00.000Z', duration: 30 }
const times = (slots: string[]) => slots.map((s) => s.slice(11, 16))

describe('buildFreeSlots with breaks after services', () => {
  it('keeps the break after a booked visit closed', () => {
    const slots = buildFreeSlots({
      ...base,
      appointments: [{ ...visit, buffer_after_minutes: 30 }],
      serviceDuration: 30
    })
    expect(times(slots)).toEqual(['10:00', '10:30', '12:00', '12:30'])
  })

  it('takes the larger of the service break and the master’s buffer', () => {
    const slots = buildFreeSlots({
      ...base,
      appointments: [{ ...visit, buffer_after_minutes: 10 }],
      bufferMinutes: 30,
      serviceDuration: 30
    })
    expect(times(slots)).toEqual(['10:00', '12:00', '12:30'])
  })

  it('keeps the new visit’s own break clear of the next visit', () => {
    const slots = buildFreeSlots({
      ...base,
      appointments: [visit],
      serviceDuration: 30,
      visitBufferMinutes: 30
    })
    expect(times(slots)).toEqual(['10:00', '11:30', '12:00', '12:30'])
  })

  it('lets the own break run past closing time', () => {
    const slots = buildFreeSlots({
      ...base,
      appointments: [],
      serviceDuration: 30,
      visitBufferMinutes: 60
    })
    expect(times(slots)).toContain('12:30')
  })

  it('lets the own break run into a time block', () => {
    const slots = buildFreeSlots({
      ...base,
      appointments: [],
      timeBlocks: [
        {
          start_at: '2030-06-03T11:00:00.000Z',
          end_at: '2030-06-03T11:30:00.000Z',
          all_day: false
        }
      ],
      serviceDuration: 30,
      visitBufferMinutes: 30
    })
    expect(times(slots)).toEqual(['10:00', '10:30', '11:30', '12:00', '12:30'])
  })
})

describe('buildFreeSlots agrees with the booking functions', () => {
  it('counts steps from the start of the day after a break off the grid', () => {
    const slots = buildFreeSlots({
      ...base,
      scheduleDay: { ...scheduleDay, breaks: [{ start: '11:00', end: '11:10' }] },
      appointments: [],
      serviceDuration: 30
    })
    expect(times(slots)).toEqual(['10:00', '10:30', '11:30', '12:00', '12:30'])
  })

  it('keeps the master’s buffer before the next visit', () => {
    const slots = buildFreeSlots({
      ...base,
      appointments: [visit],
      bufferMinutes: 30,
      serviceDuration: 30
    })
    expect(times(slots)).toEqual(['10:00', '12:00', '12:30'])
  })

  it('keeps a visit that began yesterday busy', () => {
    const slots = buildFreeSlots({
      ...base,
      appointments: [{ start_at: '2030-06-02T23:00:00.000Z', duration: 12 * 60 }],
      serviceDuration: 30
    })
    expect(times(slots)).toEqual(['11:00', '11:30', '12:00', '12:30'])
  })
})

describe('zonedTimeToUtc on the day the clocks change', () => {
  it('reads the offset after the autumn change', () => {
    expect(zonedTimeToUtc('2026-11-01', '08:00', 'America/Vancouver').toISOString()).toBe(
      '2026-11-01T16:00:00.000Z'
    )
  })

  it('reads the offset after the spring change', () => {
    expect(zonedTimeToUtc('2026-03-08', '08:00', 'America/Vancouver').toISOString()).toBe(
      '2026-03-08T15:00:00.000Z'
    )
  })

  it('moves a skipped time forward, as AT TIME ZONE does', () => {
    expect(zonedTimeToUtc('2026-03-08', '02:30', 'America/Vancouver').toISOString()).toBe(
      '2026-03-08T10:30:00.000Z'
    )
  })

  it('takes the first occurrence of a repeated time', () => {
    expect(zonedTimeToUtc('2026-11-01', '01:30', 'America/Vancouver').toISOString()).toBe(
      '2026-11-01T08:30:00.000Z'
    )
  })

  it('leaves a zone without changes alone', () => {
    expect(zonedTimeToUtc('2026-06-03', '10:00', 'Asia/Bishkek').toISOString()).toBe(
      '2026-06-03T04:00:00.000Z'
    )
  })
})
