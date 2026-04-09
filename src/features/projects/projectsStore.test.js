import { beforeEach, describe, expect, it, vi } from 'vitest'

const firestoreMocks = vi.hoisted(() => ({
  collection: vi.fn(() => 'projects_collection_ref'),
  deleteDoc: vi.fn(),
  documentId: vi.fn(() => '__name__'),
  doc: vi.fn(),
  getDocs: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  setDoc: vi.fn(),
  startAfter: vi.fn(),
}))

const supabaseMocks = vi.hoisted(() => {
  const upload = vi.fn()
  const getPublicUrl = vi.fn()
  const from = vi.fn(() => ({ upload, getPublicUrl }))

  return {
    upload,
    getPublicUrl,
    from,
    supabase: {
      storage: {
        from,
      },
    },
  }
})

vi.mock('firebase/firestore', () => ({
  collection: firestoreMocks.collection,
  deleteDoc: firestoreMocks.deleteDoc,
  documentId: firestoreMocks.documentId,
  doc: firestoreMocks.doc,
  getDocs: firestoreMocks.getDocs,
  limit: firestoreMocks.limit,
  onSnapshot: firestoreMocks.onSnapshot,
  orderBy: firestoreMocks.orderBy,
  query: firestoreMocks.query,
  setDoc: firestoreMocks.setDoc,
  startAfter: firestoreMocks.startAfter,
}))

vi.mock('../../firebase', () => ({
  db: { name: 'db' },
}))

vi.mock('../../supabase', () => ({
  assertSupabaseConfig: vi.fn(),
  supabase: supabaseMocks.supabase,
  supabaseBucket: 'project-images',
}))

import { fetchProjectsPage, PROJECT_IMAGE_MAX_BYTES, uploadProjectImage } from './projectsStore'

describe('uploadProjectImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseMocks.upload.mockResolvedValue({ error: null })
    supabaseMocks.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/image.webp' } })
  })

  it('rejects unsupported file types before upload', async () => {
    await expect(uploadProjectImage({
      name: 'payload.gif',
      type: 'image/gif',
      size: 10,
    })).rejects.toThrow('Only JPG, PNG, or WebP images are allowed.')

    expect(supabaseMocks.upload).not.toHaveBeenCalled()
  })

  it('rejects files larger than 5MB before upload', async () => {
    await expect(uploadProjectImage({
      name: 'large.jpg',
      type: 'image/jpeg',
      size: PROJECT_IMAGE_MAX_BYTES + 1,
    })).rejects.toThrow('Image exceeds the 5MB size limit.')

    expect(supabaseMocks.upload).not.toHaveBeenCalled()
  })

  it('uploads validated images and returns public url', async () => {
    const url = await uploadProjectImage({
      name: 'hero banner.webp',
      type: 'image/webp',
      size: 1024,
    })

    expect(url).toBe('https://cdn.example.com/image.webp')
    expect(supabaseMocks.from).toHaveBeenCalledWith('project-images')
    expect(supabaseMocks.upload).toHaveBeenCalledTimes(1)

    const [uploadedPath] = supabaseMocks.upload.mock.calls[0]
    expect(uploadedPath).toMatch(/^projects\/images\/\d+_hero_banner\.webp$/)
  })

  it('fetches first projects page with cursor metadata', async () => {
    const snapshot = {
      docs: [
        {
          id: '1',
          data: () => ({ id: '1', title: 'A', location: 'Loc', listingType: 'land', price: '1000', featured: false }),
        },
        {
          id: '2',
          data: () => ({ id: '2', title: 'B', location: 'Loc', listingType: 'land', price: '2000', featured: false }),
        },
      ],
    }
    firestoreMocks.getDocs.mockResolvedValue(snapshot)

    const result = await fetchProjectsPage({ pageSize: 2 })

    expect(result.projects).toHaveLength(2)
    expect(result.cursor).toBe(snapshot.docs[1])
    expect(result.hasMore).toBe(true)
  })

  it('fetches next projects page using cursor', async () => {
    const previousCursor = { id: 'cursor_doc' }
    const snapshot = {
      docs: [
        {
          id: '3',
          data: () => ({ id: '3', title: 'C', location: 'Loc', listingType: 'land', price: '3000', featured: false }),
        },
      ],
    }
    firestoreMocks.getDocs.mockResolvedValue(snapshot)

    const result = await fetchProjectsPage({ pageSize: 2, cursor: previousCursor })

    expect(firestoreMocks.startAfter).toHaveBeenCalledWith(previousCursor)
    expect(result.projects).toHaveLength(1)
    expect(result.hasMore).toBe(false)
  })
})
