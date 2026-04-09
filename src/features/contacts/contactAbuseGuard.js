const CONTACT_SUBMISSION_STATE_KEY = 'citify_contact_submission_state_v1'
const SUBMISSION_COOLDOWN_MS = 60 * 1000
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000
const MAX_SUBMISSIONS_PER_WINDOW = 3

const FALLBACK_ERROR = 'Unable to submit right now. Please try again shortly.'
let memoryState = { submissions: [] }

const safeReadState = (storage) => {
  if (!storage) return memoryState

  try {
    const raw = storage.getItem(CONTACT_SUBMISSION_STATE_KEY)
    if (!raw) return memoryState
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed?.submissions)) return memoryState
    return {
      submissions: parsed.submissions
        .filter((item) => typeof item?.ts === 'number' && typeof item?.fingerprint === 'string')
        .map((item) => ({ ts: item.ts, fingerprint: item.fingerprint })),
    }
  } catch {
    return memoryState
  }
}

const safeWriteState = (storage, state) => {
  if (!storage) {
    memoryState = state
    return
  }

  try {
    storage.setItem(CONTACT_SUBMISSION_STATE_KEY, JSON.stringify(state))
  } catch {
    memoryState = state
  }
}

const toFingerprint = ({ email, message }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const normalizedMessage = String(message || '').trim().toLowerCase().replace(/\s+/g, ' ')
  return `${normalizedEmail}|${normalizedMessage}`
}

const getStorage = () => {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

const getNow = () => Date.now()

export const evaluateContactAbuseRisk = ({ honeypot, email, message }, options = {}) => {
  if (String(honeypot || '').trim().length > 0) {
    return FALLBACK_ERROR
  }

  const storage = options.storage ?? getStorage()
  const now = options.now ?? getNow()
  const state = safeReadState(storage)
  const windowStart = now - DUPLICATE_WINDOW_MS
  const recentSubmissions = state.submissions.filter((item) => item.ts >= windowStart)

  if (recentSubmissions.length > 0) {
    const latest = recentSubmissions[recentSubmissions.length - 1]
    const sinceLastMs = now - latest.ts
    if (sinceLastMs < SUBMISSION_COOLDOWN_MS) {
      const waitSeconds = Math.max(1, Math.ceil((SUBMISSION_COOLDOWN_MS - sinceLastMs) / 1000))
      return `Please wait ${waitSeconds} seconds before sending another message.`
    }
  }

  if (recentSubmissions.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    return 'Too many submissions. Please try again later.'
  }

  const fingerprint = toFingerprint({ email, message })
  if (recentSubmissions.some((item) => item.fingerprint === fingerprint)) {
    return 'This message was already submitted. Please wait before sending again.'
  }

  return ''
}

export const recordContactSubmission = ({ email, message }, options = {}) => {
  const storage = options.storage ?? getStorage()
  const now = options.now ?? getNow()
  const state = safeReadState(storage)
  const windowStart = now - DUPLICATE_WINDOW_MS
  const recentSubmissions = state.submissions.filter((item) => item.ts >= windowStart)

  recentSubmissions.push({
    ts: now,
    fingerprint: toFingerprint({ email, message }),
  })

  safeWriteState(storage, { submissions: recentSubmissions })
}

export const __contactAbuseGuardTest = {
  CONTACT_SUBMISSION_STATE_KEY,
  SUBMISSION_COOLDOWN_MS,
  DUPLICATE_WINDOW_MS,
  MAX_SUBMISSIONS_PER_WINDOW,
  resetMemoryState: () => {
    memoryState = { submissions: [] }
  },
}