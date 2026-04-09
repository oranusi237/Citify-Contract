const EMAILJS_ENDPOINT = 'https://api.emailjs.com/api/v1.0/email/send'

const emailConfig = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  contactTemplateId: import.meta.env.VITE_EMAILJS_CONTACT_TEMPLATE_ID,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
}

const hasEmailConfig = () =>
  Boolean(emailConfig.serviceId && emailConfig.templateId && emailConfig.publicKey)

export const sendTourEmailNotification = async (tour) => {
  if (!hasEmailConfig()) {
    return { sent: false, skipped: true }
  }

  const templateParams = {
    project_title: tour.projectTitle,
    project_location: tour.projectLocation,
    tour_type: tour.tourType,
    date: tour.dateLabel || tour.date,
    time: tour.time,
    name: tour.name,
    phone: tour.phone,
    email: tour.email,
    message: tour.message || 'No additional message',
    request_id: tour.id,
  }

  const response = await fetch(EMAILJS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: emailConfig.serviceId,
      template_id: emailConfig.templateId,
      user_id: emailConfig.publicKey,
      template_params: templateParams,
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Email notification failed: ${details}`)
  }

  return { sent: true }
}

export const sendContactEmailNotification = async (contact) => {
  if (!hasEmailConfig() || !emailConfig.contactTemplateId) {
    return { sent: false, skipped: true }
  }

  const templateParams = {
    name: contact.name,
    email: contact.email,
    mobile: contact.mobile || '',
    subject: contact.subject || 'General enquiry',
    message: contact.message,
    source: contact.source || 'website',
    request_id: contact.id,
  }

  const response = await fetch(EMAILJS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: emailConfig.serviceId,
      template_id: emailConfig.contactTemplateId,
      user_id: emailConfig.publicKey,
      template_params: templateParams,
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Contact email notification failed: ${details}`)
  }

  return { sent: true }
}