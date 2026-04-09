const CONTACT_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const validateContactInput = ({ name, email, subject, message, consent }) => {
  const normalizedName = String(name || '').trim()
  const normalizedEmail = String(email || '').trim()
  const normalizedSubject = String(subject || '').trim()
  const normalizedMessage = String(message || '').trim()

  if (normalizedName.length < 2) {
    return 'Please enter your name (at least 2 characters).'
  }

  if (!CONTACT_EMAIL_REGEX.test(normalizedEmail)) {
    return 'Please enter a valid email address.'
  }

  if (normalizedSubject.length < 3) {
    return 'Please enter a subject (at least 3 characters).'
  }

  if (normalizedMessage.length < 10) {
    return 'Please enter a message with at least 10 characters.'
  }

  if (!consent) {
    return 'Please agree to the privacy policy before submitting.'
  }

  return ''
}
