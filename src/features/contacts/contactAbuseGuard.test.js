import { beforeEach, describe, expect, it } from 'vitest'
import { __contactAbuseGuardTest, evaluateContactAbuseRisk, recordContactSubmission } from './contactAbuseGuard'

const createStorageMock = () => {
  const state = new Map()
  return {
    getItem: (key) => (state.has(key) ? state.get(key) : null),
    setItem: (key, value) => state.set(key, value),
  }
}

describe('contactAbuseGuard', () => {
  beforeEach(() => {
    __contactAbuseGuardTest.resetMemoryState()
  })

  it('blocks honeypot submissions', () => {
    const error = evaluateContactAbuseRisk({
      honeypot: 'https://bot-site.tld',
      email: 'jane@example.com',
      message: 'Legit looking message text.',
    })

    expect(error).toBe('Unable to submit right now. Please try again shortly.')
  })

  it('enforces cooldown between submissions', () => {
    const storage = createStorageMock()
    const now = 1_000_000

    recordContactSubmission({
      email: 'jane@example.com',
      message: 'First message payload.',
    }, { storage, now })

    const error = evaluateContactAbuseRisk({
      honeypot: '',
      email: 'jane@example.com',
      message: 'Another message payload.',
    }, { storage, now: now + 5_000 })

    expect(error).toContain('Please wait')
  })

  it('blocks duplicate content in duplicate window', () => {
    const storage = createStorageMock()
    const now = 1_000_000

    recordContactSubmission({
      email: 'jane@example.com',
      message: 'Same content duplicate',
    }, { storage, now })

    const error = evaluateContactAbuseRisk({
      honeypot: '',
      email: 'jane@example.com',
      message: 'Same content duplicate',
    }, { storage, now: now + __contactAbuseGuardTest.SUBMISSION_COOLDOWN_MS + 1_000 })

    expect(error).toBe('This message was already submitted. Please wait before sending again.')
  })

  it('blocks high volume in rolling window', () => {
    const storage = createStorageMock()
    const now = 1_000_000
    const step = __contactAbuseGuardTest.SUBMISSION_COOLDOWN_MS + 1_000

    recordContactSubmission({ email: 'a@x.com', message: 'one one one one' }, { storage, now })
    recordContactSubmission({ email: 'a@x.com', message: 'two two two two' }, { storage, now: now + step })
    recordContactSubmission({ email: 'a@x.com', message: 'three three three three' }, { storage, now: now + step * 2 })

    const error = evaluateContactAbuseRisk({
      honeypot: '',
      email: 'a@x.com',
      message: 'four four four four',
    }, { storage, now: now + step * 3 })

    expect(error).toBe('Too many submissions. Please try again later.')
  })

  it('allows valid submissions', () => {
    const storage = createStorageMock()
    const error = evaluateContactAbuseRisk({
      honeypot: '',
      email: 'jane@example.com',
      message: 'I want to discuss available plots in Lekki.',
    }, { storage, now: 1_000_000 })

    expect(error).toBe('')
  })

  it('falls back to memory when storage writes fail', () => {
    const failingStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded')
      },
    }

    const now = 1_000_000
    recordContactSubmission({
      email: 'jane@example.com',
      message: 'Fallback memory state message.',
    }, { storage: failingStorage, now })

    const error = evaluateContactAbuseRisk({
      honeypot: '',
      email: 'jane@example.com',
      message: 'Another message payload.',
    }, { storage: failingStorage, now: now + 5_000 })

    expect(error).toContain('Please wait')
  })
})