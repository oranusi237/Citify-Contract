import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { createContactRequest } from '../contactStore'
import { validateContactInput } from '../contactValidation'
import { evaluateContactAbuseRisk, recordContactSubmission } from '../contactAbuseGuard'

export const useContactRequestForm = ({
  source,
  successMessage = 'Form Submitted Successfully',
  pendingMessage = 'Sending...',
  genericErrorMessage = 'Unable to submit right now. Please try again shortly.',
  offlineMessage = "You're offline.",
  clearStatusDelayMs = 2500,
}) => {
  const [consent, setConsent] = useState(false)
  const [contactError, setContactError] = useState('')
  const [statusText, setStatusText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false)
  const statusTimeoutRef = useRef(null)

  useEffect(() => {
    const onOffline = () => setIsOffline(true)
    const onOnline = () => setIsOffline(false)

    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)

    return () => {
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
    }
  }, [])

  useEffect(() => () => {
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current)
    }
  }, [])

  const handleConsentChange = (checked) => {
    setConsent(checked)
    setContactError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setContactError('')

    if (!navigator.onLine) {
      setContactError(offlineMessage)
      toast.error(offlineMessage)
      return
    }

    const formData = new FormData(event.target)
    const name = String(formData.get('Name') || '').trim()
    const email = String(formData.get('Email') || '').trim()
    const subject = String(formData.get('Subject') || '').trim()
    const message = String(formData.get('Message') || '').trim()
    const mobile = String(formData.get('Mobile') || '').trim()
    const honeypot = String(formData.get('Website') || '').trim()

    const validationError = validateContactInput({ name, email, subject, message, consent })
    if (validationError) {
      setContactError(validationError)
      return
    }

    const abuseError = evaluateContactAbuseRisk({ honeypot, email, message })
    if (abuseError) {
      setContactError(abuseError)
      return
    }

    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current)
    }

    setStatusText(pendingMessage)
    setIsSubmitting(true)

    try {
      await createContactRequest({
        name,
        email,
        subject,
        message,
        mobile,
        source,
      })

      recordContactSubmission({ email, message })
      toast.success(successMessage)
      setStatusText(successMessage)
      event.target.reset()
      setConsent(false)
      setContactError('')

      statusTimeoutRef.current = setTimeout(() => {
        setStatusText('')
      }, clearStatusDelayMs)
    } catch (error) {
      console.error('Contact request submit error:', error)

      if (!navigator.onLine) {
        setContactError(offlineMessage)
        toast.error(offlineMessage)
      } else {
        setContactError(genericErrorMessage)
        toast.error(genericErrorMessage)
      }

      setStatusText('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    consent,
    contactError,
    handleConsentChange,
    handleSubmit,
    isOffline,
    isSubmitting,
    statusText,
  }
}