import { addDoc, collection, deleteDoc, doc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, startAfter, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { sendContactEmailNotification } from '../../utils/notifications'

const CONTACT_REQUESTS_COLLECTION = 'contact_requests'
const contactRequestsRef = collection(db, CONTACT_REQUESTS_COLLECTION)

const normalizeContact = (contact) => ({
  id: contact.id,
  name: String(contact?.name || '').trim(),
  email: String(contact?.email || '').trim(),
  mobile: String(contact?.mobile || '').trim(),
  subject: String(contact?.subject || '').trim(),
  message: String(contact?.message || '').trim(),
  source: String(contact?.source || 'website').trim(),
  status: String(contact?.status || 'new').trim().toLowerCase(),
  createdAt: contact?.createdAt || null,
})

const normalizeContactRequest = (payload) => ({
  name: String(payload?.name || '').trim(),
  email: String(payload?.email || '').trim(),
  mobile: String(payload?.mobile || '').trim(),
  subject: String(payload?.subject || '').trim(),
  message: String(payload?.message || '').trim(),
  source: String(payload?.source || 'website').trim(),
})

export const createContactRequest = async (payload) => {
  const normalized = normalizeContactRequest(payload)
  const createdDoc = await addDoc(contactRequestsRef, {
    ...normalized,
    status: 'new',
    createdAt: serverTimestamp(),
  })

  // Email failure should not block contact request persistence.
  try {
    await sendContactEmailNotification({
      ...normalized,
      id: createdDoc.id,
    })
  } catch (error) {
    console.error('[Contact] Email notification failed:', error)
  }
}

export const subscribeToContactRequests = (onData, onError) => {
  const contactQuery = query(contactRequestsRef, orderBy('createdAt', 'desc'), limit(300))
  return onSnapshot(
    contactQuery,
    (snapshot) => {
      const contacts = snapshot.docs.map((item) => normalizeContact({ id: item.id, ...item.data() }))
      onData(contacts)
    },
    (error) => {
      if (onError) onError(error)
    }
  )
}

export const fetchContactRequestsPage = async ({ pageSize = 50, cursor = null } = {}) => {
  const constraints = [orderBy('createdAt', 'desc'), limit(pageSize)]
  if (cursor) {
    constraints.push(startAfter(cursor))
  }

  const pageQuery = query(contactRequestsRef, ...constraints)
  const snapshot = await getDocs(pageQuery)
  const contacts = snapshot.docs.map((item) => normalizeContact({ id: item.id, ...item.data() }))
  const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null

  return {
    contacts,
    cursor: lastDoc,
    hasMore: snapshot.docs.length === pageSize,
  }
}

export const updateContactStatus = async (id, status) => {
  await updateDoc(doc(db, CONTACT_REQUESTS_COLLECTION, id), { status })
}

export const deleteContactRequest = async (id) => {
  await deleteDoc(doc(db, CONTACT_REQUESTS_COLLECTION, id))
}
