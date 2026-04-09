import { describe, expect, it } from 'vitest'
import { validateContactInput } from './contactValidation'

describe('validateContactInput', () => {
  it('returns empty string for valid payload', () => {
    const result = validateContactInput({
      name: 'Jane Doe',
      email: 'jane@example.com',
      subject: 'Property enquiry',
      message: 'I would like details about available properties.',
      consent: true,
    })

    expect(result).toBe('')
  })

  it('fails when name is too short', () => {
    const result = validateContactInput({
      name: 'J',
      email: 'jane@example.com',
      subject: 'Property enquiry',
      message: 'This is a valid message length.',
      consent: true,
    })

    expect(result).toBe('Please enter your name (at least 2 characters).')
  })

  it('fails when email is invalid', () => {
    const result = validateContactInput({
      name: 'Jane Doe',
      email: 'invalid-email',
      subject: 'Property enquiry',
      message: 'This is a valid message length.',
      consent: true,
    })

    expect(result).toBe('Please enter a valid email address.')
  })

  it('fails when message is too short', () => {
    const result = validateContactInput({
      name: 'Jane Doe',
      email: 'jane@example.com',
      subject: 'Property enquiry',
      message: 'Too short',
      consent: true,
    })

    expect(result).toBe('Please enter a message with at least 10 characters.')
  })

  it('fails when consent is false', () => {
    const result = validateContactInput({
      name: 'Jane Doe',
      email: 'jane@example.com',
      subject: 'Property enquiry',
      message: 'This is a valid message length.',
      consent: false,
    })

    expect(result).toBe('Please agree to the privacy policy before submitting.')
  })

  it('fails when subject is too short', () => {
    const result = validateContactInput({
      name: 'Jane Doe',
      email: 'jane@example.com',
      subject: 'Hi',
      message: 'This is a valid message length.',
      consent: true,
    })

    expect(result).toBe('Please enter a subject (at least 3 characters).')
  })
})
