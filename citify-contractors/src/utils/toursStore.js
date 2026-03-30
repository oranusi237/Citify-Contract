import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { sendTourEmailNotification } from './notifications'

const TOURS_COLLECTION = 'tour_requests'
const toursRef = collection(db, TOURS_COLLECTION)

const normalizeTour = (tour) => ({
  id: tour.id,
  projectId: String(tour.projectId || ''),
  projectTitle: tour.projectTitle || '',
  projectLocation: tour.projectLocation || '',
  tourType: tour.tourType || 'in-person',
  date: tour.date || '',
  time: tour.time || '',
  name: tour.name || '',
  phone: tour.phone || '',
  email: tour.email || '',
  message: tour.message || '',
  status: tour.status || 'new',
  createdAt: tour.createdAt || null,
})

export const createTourRequest = async (tour) => {
  const payload = {
    ...normalizeTour(tour),
    status: 'new',
    createdAt: serverTimestamp(),
  }
  delete payload.id
  const createdDoc = await addDoc(toursRef, payload)

  // Notification failure should not block request creation.
  try {
    await sendTourEmailNotification({
      ...payload,
      id: createdDoc.id,
    })
  } catch (error) {
    console.error('[Tours] Email notification failed:', error)
  }
}

export const subscribeToTours = (onData, onError) => {
  const toursQuery = query(toursRef, orderBy('createdAt', 'desc'))
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

export const updateTourStatus = async (id, status) => {
  await updateDoc(doc(db, TOURS_COLLECTION, id), { status })
}

export const deleteTourRequest = async (id) => {
  await deleteDoc(doc(db, TOURS_COLLECTION, id))
}
