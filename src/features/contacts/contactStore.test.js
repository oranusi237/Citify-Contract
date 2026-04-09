import { beforeEach, describe, expect, it, vi } from 'vitest'

const firestoreMocks = vi.hoisted(() => ({
  addDoc: vi.fn(),
  collection: vi.fn(() => 'contact_collection_ref'),
  getDocs: vi.fn(),
  serverTimestamp: vi.fn(() => 'server_ts'),
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
  sendContactEmailNotification: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  addDoc: firestoreMocks.addDoc,
  collection: firestoreMocks.collection,
  getDocs: firestoreMocks.getDocs,
  serverTimestamp: firestoreMocks.serverTimestamp,
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
  sendContactEmailNotification: notificationMocks.sendContactEmailNotification,
}))

import { createContactRequest, deleteContactRequest, fetchContactRequestsPage, updateContactStatus } from './contactStore'

describe('createContactRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    firestoreMocks.addDoc.mockResolvedValue({ id: 'contact_1' })
    notificationMocks.sendContactEmailNotification.mockResolvedValue({ sent: true })
  })

  it('persists contact payload and triggers email notification', async () => {
    await createContactRequest({
      name: 'Jane Doe',
      email: 'jane@example.com',
      subject: 'Property enquiry',
      message: 'I would like more information about your listings.',
      source: 'contact-page',
    })

    expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1)
    expect(firestoreMocks.addDoc).toHaveBeenCalledWith('contact_collection_ref', {
      name: 'Jane Doe',
      email: 'jane@example.com',
      mobile: '',
      subject: 'Property enquiry',
      message: 'I would like more information about your listings.',
      source: 'contact-page',
      status: 'new',
      createdAt: 'server_ts',
    })

    expect(notificationMocks.sendContactEmailNotification).toHaveBeenCalledWith({
      id: 'contact_1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      mobile: '',
      subject: 'Property enquiry',
      message: 'I would like more information about your listings.',
      source: 'contact-page',
    })
  })

  it('does not fail the request when email notification fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    notificationMocks.sendContactEmailNotification.mockRejectedValue(new Error('email failed'))

    await expect(createContactRequest({
      name: 'Jane Doe',
      email: 'jane@example.com',
      subject: 'Support request',
      message: 'I would like more information about your listings.',
      source: 'header',
    })).resolves.toBeUndefined()

    expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1)
    expect(notificationMocks.sendContactEmailNotification).toHaveBeenCalledTimes(1)

    consoleSpy.mockRestore()
  })

  it('updates contact status for admin workflows', async () => {
    firestoreMocks.doc.mockReturnValue('contact_doc_ref')

    await updateContactStatus('contact_1', 'contacted')

    expect(firestoreMocks.doc).toHaveBeenCalledWith({ name: 'db' }, 'contact_requests', 'contact_1')
    expect(firestoreMocks.updateDoc).toHaveBeenCalledWith('contact_doc_ref', { status: 'contacted' })
  })

  it('deletes contact request for admin workflows', async () => {
    firestoreMocks.doc.mockReturnValue('contact_doc_ref')

    await deleteContactRequest('contact_2')

    expect(firestoreMocks.doc).toHaveBeenCalledWith({ name: 'db' }, 'contact_requests', 'contact_2')
    expect(firestoreMocks.deleteDoc).toHaveBeenCalledWith('contact_doc_ref')
  })

  it('fetches first contact page with cursor metadata', async () => {
    const snapshot = {
      docs: [
        { id: 'c1', data: () => ({ name: 'A', email: 'a@x.com', subject: 'S1', message: 'm', status: 'new', source: 'web' }) },
        { id: 'c2', data: () => ({ name: 'B', email: 'b@x.com', subject: 'S2', message: 'm2', status: 'new', source: 'web' }) },
      ],
    }
    firestoreMocks.getDocs.mockResolvedValue(snapshot)

    const result = await fetchContactRequestsPage({ pageSize: 2 })

    expect(result.contacts).toHaveLength(2)
    expect(result.cursor).toBe(snapshot.docs[1])
    expect(result.hasMore).toBe(true)
  })

  it('fetches next contact page using cursor', async () => {
    const previousCursor = { id: 'cursor_doc' }
    const snapshot = {
      docs: [
        { id: 'c3', data: () => ({ name: 'C', email: 'c@x.com', subject: 'S3', message: 'm3', status: 'new', source: 'web' }) },
      ],
    }
    firestoreMocks.getDocs.mockResolvedValue(snapshot)

    const result = await fetchContactRequestsPage({ pageSize: 2, cursor: previousCursor })

    expect(firestoreMocks.startAfter).toHaveBeenCalledWith(previousCursor)
    expect(result.contacts).toHaveLength(1)
    expect(result.hasMore).toBe(false)
  })
})
