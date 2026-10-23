/**
 * Phase 0 scenarios on the real route handlers, with Nuxt/h3 globals stubbed
 * and Supabase replaced by a small in-memory fake.
 *
 *   A — this device is trusted for the phone and master: recognised, name shown
 *   B — known client, other device: same answer as C, no name before the code
 *   C — new number: a code is needed
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { toCanonicalPhone } from '../shared/utils/phone'
import * as phoneVerification from '../server/utils/phoneVerification'
import * as deviceToken from '../server/utils/deviceToken'
import * as otpPolicy from '../server/utils/otpPolicy'

type Row = Record<string, unknown>
type Tables = Record<string, Row[]>

const MASTER = { id: 'p1', user_id: 'u-master', username: 'aigul' }
const OTHER_MASTER = { id: 'p2', user_id: 'u-other', username: 'dina' }
const KNOWN = '996555123456'
const NEW = '996700000001'

let db: Tables

/** Just enough of the supabase-js query builder for these routes. */
function fakeSupabase() {
  return {
    from(table: string) {
      return new Query(table)
    }
  }
}

class Query {
  private filters: ((row: Row) => boolean)[] = []
  private op: 'select' | 'insert' | 'update' = 'select'
  private patch: Row = {}
  private rowLimit = Infinity
  private orderBy: { column: string; ascending: boolean } | null = null

  constructor(private table: string) {}

  select() {
    return this
  }

  insert(row: Row) {
    db[this.table] = [
      ...(db[this.table] ?? []),
      { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row }
    ]
    return Promise.resolve({ data: null, error: null })
  }

  update(patch: Row) {
    this.op = 'update'
    this.patch = patch
    return this
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value)
    return this
  }

  in(column: string, values: unknown[]) {
    this.filters.push((row) => values.includes(row[column]))
    return this
  }

  is(column: string, value: unknown) {
    this.filters.push((row) => (row[column] ?? null) === value)
    return this
  }

  gt(column: string, value: string) {
    this.filters.push((row) => String(row[column]) > value)
    return this
  }

  order(column: string, { ascending }: { ascending: boolean }) {
    this.orderBy = { column, ascending }
    return this
  }

  limit(n: number) {
    this.rowLimit = n
    return this
  }

  maybeSingle() {
    return Promise.resolve({ data: this.run()[0] ?? null, error: null })
  }

  then<T>(resolve: (value: { data: Row[]; error: null }) => T) {
    return Promise.resolve({ data: this.run(), error: null }).then(resolve)
  }

  private run() {
    let rows = (db[this.table] ?? []).filter((row) => this.filters.every((f) => f(row)))
    if (this.op === 'update') {
      rows.forEach((row) => Object.assign(row, this.patch))
      return rows
    }
    if (this.orderBy) {
      const { column, ascending } = this.orderBy
      rows = [...rows].sort(
        (a, b) => (String(a[column]) > String(b[column]) ? 1 : -1) * (ascending ? 1 : -1)
      )
    }
    return rows.slice(0, this.rowLimit)
  }
}

type FakeEvent = {
  query: Row
  body: Row
  cookies: Record<string, string>
  setCookies: Record<string, string | null>
}

function event(input: Partial<FakeEvent> = {}): FakeEvent {
  return { query: {}, body: {}, cookies: {}, setCookies: {}, ...input }
}

class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message)
  }
}

beforeAll(() => {
  Object.assign(globalThis, phoneVerification, deviceToken, otpPolicy, {
    defineEventHandler: (handler: unknown) => handler,
    createError: ({ statusCode, message }: { statusCode: number; message: string }) =>
      new HttpError(statusCode, message),
    getQuery: (e: FakeEvent) => e.query,
    readBody: async (e: FakeEvent) => e.body,
    getCookie: (e: FakeEvent, name: string) => e.cookies[name],
    setCookie: (e: FakeEvent, name: string, value: string) => {
      e.setCookies[name] = value
    },
    deleteCookie: (e: FakeEvent, name: string) => {
      e.setCookies[name] = null
    },
    useServiceSupabase: fakeSupabase,
    useRuntimeConfig: () => ({ phoneVerificationTokenSecret: 'test-secret' }),
    toCanonicalPhone
  })
})

beforeEach(() => {
  db = {
    master_profile: [MASTER, OTHER_MASTER],
    client: [{ user_id: MASTER.user_id, phone: KNOWN, first_name: 'Айгерим' }],
    client_device_token: [],
    otp_codes: []
  }
})

async function check(
  phone: string,
  cookies: Record<string, string> = {},
  username = MASTER.username
) {
  const { default: handler } = await import('../server/api/auth/phone/check.get')
  return handler(event({ query: { phone, username }, cookies }) as never)
}

async function verify(phone: string, code: string, cookies: Record<string, string> = {}) {
  const { default: handler } = await import('../server/api/auth/phone/verify.post')
  const e = event({ body: { phone, code, username: MASTER.username }, cookies })
  return { result: await handler(e as never), event: e }
}

function issueCode(phone: string, code = '1234') {
  db.otp_codes!.push({
    id: crypto.randomUUID(),
    phone,
    code,
    used: false,
    attempts: 0,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 5 * 60_000).toISOString()
  })
}

/** Passes the code and returns the device cookie the server set. */
async function trustDevice(phone: string) {
  issueCode(phone)
  const { event: e } = await verify(phone, '1234')
  const name = deviceToken.deviceCookieName(MASTER.user_id)
  return { [name]: e.setCookies[name]! }
}

describe('phone check without a code', () => {
  it('gives a known client (B) and a new number (C) the same answer, without a name', async () => {
    expect(await check(KNOWN)).toEqual({ recognized: false })
    expect(await check(NEW)).toEqual({ recognized: false })
  })

  it('recognises a trusted device (A) and only then returns the name', async () => {
    const cookies = await trustDevice(KNOWN)
    expect(await check(KNOWN, cookies)).toEqual({ recognized: true, firstName: 'Айгерим' })
  })

  it('does not recognise the device for another phone', async () => {
    const cookies = await trustDevice(KNOWN)
    expect(await check(NEW, cookies)).toEqual({ recognized: false })
  })

  it('does not recognise the device with another master', async () => {
    const cookies = await trustDevice(KNOWN)
    expect(await check(KNOWN, cookies, OTHER_MASTER.username)).toEqual({ recognized: false })
  })

  it('stops recognising the device after "Not you?"', async () => {
    const cookies = await trustDevice(KNOWN)
    const { default: forget } = await import('../server/api/auth/phone/forget.post')
    await forget(event({ body: { username: MASTER.username }, cookies }) as never)
    expect(await check(KNOWN, cookies)).toEqual({ recognized: false })
  })
})

describe('code verification', () => {
  it('returns the name of a known client only after a correct code', async () => {
    issueCode(KNOWN)
    const { result, event: e } = await verify(KNOWN, '1234')
    expect(result).toMatchObject({ success: true, clientExists: true, firstName: 'Айгерим' })
    expect(e.setCookies[deviceToken.deviceCookieName(MASTER.user_id)]).toBeTruthy()
  })

  it('tells a new number it is a new client', async () => {
    issueCode(NEW)
    const { result } = await verify(NEW, '1234')
    expect(result).toMatchObject({ success: true, clientExists: false })
    expect(result).not.toHaveProperty('firstName')
  })

  it('stores only the hash of the device token', async () => {
    const cookies = await trustDevice(KNOWN)
    const token = Object.values(cookies)[0]!
    const row = db.client_device_token![0]!
    expect(row.token_hash).toBe(deviceToken.hashDeviceToken(token))
    expect(JSON.stringify(db.client_device_token)).not.toContain(token)
  })

  it(`blocks the code after ${otpPolicy.OTP_MAX_ATTEMPTS} wrong attempts`, async () => {
    issueCode(KNOWN)
    for (let i = 1; i < otpPolicy.OTP_MAX_ATTEMPTS; i++) {
      expect((await verify(KNOWN, '0000')).result).toEqual({
        success: false,
        error: 'invalid_code'
      })
    }
    expect((await verify(KNOWN, '0000')).result).toEqual({
      success: false,
      error: 'too_many_attempts'
    })
    expect((await verify(KNOWN, '1234')).result).toEqual({
      success: false,
      error: 'too_many_attempts'
    })
  })

  it('does not accept the same code twice', async () => {
    issueCode(KNOWN)
    await verify(KNOWN, '1234')
    expect((await verify(KNOWN, '1234')).result).toEqual({ success: false, error: 'expired_code' })
  })
})
