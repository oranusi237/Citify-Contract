import { collection, deleteDoc, doc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, startAfter, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { sendTourEmailNotification } from '../../utils/notifications'

const TOURS_COLLECTION = 'tour_requests'
const toursRef = collection(db, TOURS_COLLECTION)

const normalizeTour = (tour) => ({
  id: tour.id,
  projectId: String(tour.projectId || ''),
  projectTitle: tour.projectTitle || '',
  projectLocation: tour.projectLocation || '',
  tourType: tour.tourType || 'in-person',
  date: tour.date || '',
  dateLabel: tour.dateLabel || '',
  time: tour.time || '',
  name: tour.name || '',
  phone: tour.phone || '',
  email: tour.email || '',
  message: tour.message || '',
  status: tour.status || 'new',
  createdAt: tour.createdAt || null,
})

export const createTourRequest = async (tour) => {
  const isoDate = String(tour?.date || '')
  const slotTime = String(tour?.time || '').trim()
  const dateLabel = isoDate
    ? new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    : ''

  if (!isoDate) {
    throw new Error('Inspection date is required.')
  }

  if (!slotTime) {
    throw new Error('Inspection time is required.')
  }

  const slotId = `${isoDate}_${slotTime}`

  const payload = {
    ...normalizeTour(tour),
    date: isoDate,
    time: slotTime,
    dateLabel,
    status: 'new',
    createdAt: serverTimestamp(),
  }
  delete payload.id
  const docRef = doc(db, TOURS_COLLECTION, slotId)
  await setDoc(docRef, payload)

  // Notification failure should not block request creation.
  try {
    await sendTourEmailNotification({
      ...payload,
      id: docRef.id,
    })
  } catch (error) {
    console.error('[Tours] Email notification failed:', error)
  }
}

export const subscribeToTours = (onData, onError) => {
  const toursQuery = query(toursRef, orderBy('createdAt', 'desc'), limit(300))
  return onSnapshot(
    toursQuery,
    (snapshot) => {
      const tours = snapshot.docs.map((item) => normalizeTour({ id: item.id, ...item.data() }))
      onData(tours)
    },
    (error) => {
      if (onError) onError(error)
    }
  )
}

export const fetchToursPage = async ({ pageSize = 50, cursor = null } = {}) => {
  const constraints = [orderBy('createdAt', 'desc'), limit(pageSize)]
  if (cursor) {
    constraints.push(startAfter(cursor))
  }

  const pageQuery = query(toursRef, ...constraints)
  const snapshot = await getDocs(pageQuery)
  const tours = snapshot.docs.map((item) => normalizeTour({ id: item.id, ...item.data() }))
  const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null

  return {
    tours,
    cursor: lastDoc,
    hasMore: snapshot.docs.length === pageSize,
  }
}

export const updateTourStatus = async (id, status) => {
  await updateDoc(doc(db, TOURS_COLLECTION, id), { status })
}

export const deleteTourRequest = async (id) => {
  await deleteDoc(doc(db, TOURS_COLLECTION, id))
}
