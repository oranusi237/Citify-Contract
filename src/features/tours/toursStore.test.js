import { beforeEach, describe, expect, it, vi } from 'vitest'

const firestoreMocks = vi.hoisted(() => ({
  collection: vi.fn(() => 'tour_collection_ref'),
  getDocs: vi.fn(),
  serverTimestamp: vi.fn(() => 'server_ts'),
  setDoc: vi.fn(),
  onSnapshot: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  updateDoc: vi.fn(),
  doc: vi.fn(),
  deleteDoc: vi.fn(),
}))

const notificationMocks = vi.hoisted(() => ({
  sendTourEmailNotification: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  collection: firestoreMocks.collection,
  getDocs: firestoreMocks.getDocs,
  serverTimestamp: firestoreMocks.serverTimestamp,
  setDoc: firestoreMocks.setDoc,
  onSnapshot: firestoreMocks.onSnapshot,
  orderBy: firestoreMocks.orderBy,
  query: firestoreMocks.query,
  limit: firestoreMocks.limit,
  startAfter: firestoreMocks.startAfter,
  updateDoc: firestoreMocks.updateDoc,
  doc: firestoreMocks.doc,
  deleteDoc: firestoreMocks.deleteDoc,
}))

vi.mock('../../firebase', () => ({
  db: { name: 'db' },
}))

vi.mock('../../utils/notifications', () => ({
  sendTourEmailNotification: notificationMocks.sendTourEmailNotification,
}))

import { createTourRequest, deleteTourRequest, fetchToursPage, updateTourStatus } from './toursStore'

describe('createTourRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    firestoreMocks.doc.mockImplementation((...args) => ({ id: args[2] }))
    notificationMocks.sendTourEmailNotification.mockResolvedValue({ sent: true })
  })

  it('stores canonical ISO date and sends notification payload', async () => {
    await createTourRequest({
      projectId: '100',
      projectTitle: 'Prime Estate',
      projectLocation: 'Abuja',
      tourType: 'in-person',
      date: '2026-04-06',
      time: '10:00',
      name: 'John Doe',
      phone: '+2348012345678',
      email: 'john@example.com',
      message: 'Looking to inspect this property.',
    })

    expect(firestoreMocks.doc).toHaveBeenCalledWith({ name: 'db' }, 'tour_requests', '2026-04-06_10:00')
    expect(firestoreMocks.setDoc).toHaveBeenCalledTimes(1)
    const payload = firestoreMocks.setDoc.mock.calls[0][1]

    expect(payload.date).toBe('2026-04-06')
    expect(payload.dateLabel).toBeTypeOf('string')
    expect(payload.status).toBe('new')
    expect(payload.createdAt).toBe('server_ts')
    expect(payload.id).toBeUndefined()

    expect(notificationMocks.sendTourEmailNotification).toHaveBeenCalledWith({
      ...payload,
      id: '2026-04-06_10:00',
    })
  })

  it('does not fail the request when notification fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    notificationMocks.sendTourEmailNotification.mockRejectedValue(new Error('notification failed'))

    await expect(createTourRequest({
      projectId: '101',
      projectTitle: 'City View',
      projectLocation: 'Lagos',
      tourType: 'video',
      date: '2026-05-01',
      time: '11:00',
      name: 'Jane Doe',
      phone: '+2348098765432',
      email: 'jane@example.com',
      message: '',
    })).resolves.toBeUndefined()

    expect(firestoreMocks.setDoc).toHaveBeenCalledTimes(1)
    expect(notificationMocks.sendTourEmailNotification).toHaveBeenCalledTimes(1)

    consoleSpy.mockRestore()
  })

  it('updates tour status for admin workflows', async () => {
    firestoreMocks.doc.mockReturnValue('tour_doc_ref')

    await updateTourStatus('tour_1', 'scheduled')

    expect(firestoreMocks.doc).toHaveBeenCalledWith({ name: 'db' }, 'tour_requests', 'tour_1')
    expect(firestoreMocks.updateDoc).toHaveBeenCalledWith('tour_doc_ref', { status: 'scheduled' })
  })

  it('deletes tour request for admin workflows', async () => {
    firestoreMocks.doc.mockReturnValue('tour_doc_ref')

    await deleteTourRequest('tour_2')

    expect(firestoreMocks.doc).toHaveBeenCalledWith({ name: 'db' }, 'tour_requests', 'tour_2')
    expect(firestoreMocks.deleteDoc).toHaveBeenCalledWith('tour_doc_ref')
  })

  it('fetches first tour page with cursor metadata', async () => {
    const snapshot = {
      docs: [
        { id: 't1', data: () => ({ projectTitle: 'A', name: 'N1', createdAt: null }) },
        { id: 't2', data: () => ({ projectTitle: 'B', name: 'N2', createdAt: null }) },
      ],
    }
    firestoreMocks.getDocs.mockResolvedValue(snapshot)

    const result = await fetchToursPage({ pageSize: 2 })

    expect(result.tours).toHaveLength(2)
    expect(result.cursor).toBe(snapshot.docs[1])
    expect(result.hasMore).toBe(true)
  })

  it('fetches next tour page using cursor', async () => {
    const previousCursor = { id: 'cursor_doc' }
    const snapshot = {
      docs: [
        { id: 't3', data: () => ({ projectTitle: 'C', name: 'N3', createdAt: null }) },
      ],
    }
    firestoreMocks.getDocs.mockResolvedValue(snapshot)

    const result = await fetchToursPage({ pageSize: 2, cursor: previousCursor })

    expect(firestoreMocks.startAfter).toHaveBeenCalledWith(previousCursor)
    expect(result.tours).toHaveLength(1)
    expect(result.hasMore).toBe(false)
  })
})
