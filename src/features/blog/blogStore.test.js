import { beforeEach, describe, expect, it, vi } from 'vitest'

const firestoreMocks = vi.hoisted(() => ({
  collection: vi.fn(() => 'blog_collection_ref'),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  documentId: vi.fn(() => '__name__'),
  getDocs: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  setDoc: vi.fn(),
  startAfter: vi.fn(),
  where: vi.fn(),
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
  doc: firestoreMocks.doc,
  documentId: firestoreMocks.documentId,
  getDocs: firestoreMocks.getDocs,
  limit: firestoreMocks.limit,
  onSnapshot: firestoreMocks.onSnapshot,
  orderBy: firestoreMocks.orderBy,
  query: firestoreMocks.query,
  setDoc: firestoreMocks.setDoc,
  startAfter: firestoreMocks.startAfter,
  where: firestoreMocks.where,
}))

vi.mock('../../firebase', () => ({
  db: { name: 'db' },
}))

vi.mock('../../supabase', () => ({
  assertSupabaseConfig: vi.fn(),
  supabase: supabaseMocks.supabase,
  supabaseBucket: 'project-images',
}))

import { BLOG_IMAGE_MAX_BYTES, fetchBlogPostsPage, slugFromTitle, uploadBlogImage } from './blogStore'

describe('blogStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseMocks.upload.mockResolvedValue({ error: null })
    supabaseMocks.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/blog-image.webp' } })
  })

  it('creates clean slugs from titles', () => {
    expect(slugFromTitle('  7 Checks Before Buying Land in Abuja! ')).toBe('7-checks-before-buying-land-in-abuja')
  })

  it('rejects files larger than 5MB before upload', async () => {
    await expect(uploadBlogImage({
      name: 'large.jpg',
      type: 'image/jpeg',
      size: BLOG_IMAGE_MAX_BYTES + 1,
    })).rejects.toThrow('Image exceeds the 5MB size limit.')

    expect(supabaseMocks.upload).not.toHaveBeenCalled()
  })

  it('uploads validated images and returns public url', async () => {
    const url = await uploadBlogImage({
      name: 'hero image.webp',
      type: 'image/webp',
      size: 1024,
    })

    expect(url).toBe('https://cdn.example.com/blog-image.webp')
    expect(supabaseMocks.from).toHaveBeenCalledWith('project-images')
    expect(supabaseMocks.upload).toHaveBeenCalledTimes(1)

    const [uploadedPath] = supabaseMocks.upload.mock.calls[0]
    expect(uploadedPath).toMatch(/^blog\/images\/\d+_hero_image\.webp$/)
  })

  it('fetches blog page and returns cursor metadata', async () => {
    const snapshot = {
      docs: [
        {
          id: '1',
          data: () => ({
            id: '1',
            title: 'Post 1',
            slug: 'post-1',
            excerpt: 'Excerpt 1',
            content: 'Content 1',
            status: 'published',
            publishedAt: '2026-04-01T10:00:00.000Z',
          }),
        },
      ],
    }

    firestoreMocks.getDocs.mockResolvedValue(snapshot)

    const result = await fetchBlogPostsPage({ pageSize: 1 })

    expect(result.posts).toHaveLength(1)
    expect(result.cursor).toBe(snapshot.docs[0])
    expect(result.hasMore).toBe(true)
  })
})
