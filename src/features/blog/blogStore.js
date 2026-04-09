import { collection, deleteDoc, doc, documentId, getDocs, limit, onSnapshot, orderBy, query, setDoc, startAfter, where } from 'firebase/firestore'
import { db } from '../../firebase'
import { assertSupabaseConfig, supabase, supabaseBucket } from '../../supabase'
import { STORAGE_PATHS } from '../../utils/storagePaths'

const BLOG_COLLECTION = 'blog_posts'
const blogRef = collection(db, BLOG_COLLECTION)

export const BLOG_IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const BLOG_IMAGE_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const normalizeStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized === 'published' ? 'published' : 'draft'
}

const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) return []

  const sanitized = tags
    .map((item) => String(item || '').trim())
    .filter(Boolean)

  return [...new Set(sanitized)]
}

const toIsoString = (value) => {
  if (!value) return ''

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }

  if (typeof value?.toDate === 'function') {
    const converted = value.toDate()
    if (!Number.isNaN(converted.getTime())) {
      return converted.toISOString()
    }
  }

  if (typeof value?.seconds === 'number') {
    return new Date(value.seconds * 1000).toISOString()
  }

  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString()
  }

  return ''
}

const sanitizeSlug = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

export const slugFromTitle = (title) => sanitizeSlug(title)

const normalizePost = (post) => {
  const nowIso = new Date().toISOString()
  const normalizedTitle = String(post?.title || '').trim()
  const normalizedSlug = sanitizeSlug(post?.slug || normalizedTitle)
  const status = normalizeStatus(post?.status)
  const publishedAt = status === 'published'
    ? (toIsoString(post?.publishedAt) || nowIso)
    : (toIsoString(post?.publishedAt) || '')

  return {
    id: String(post?.id || ''),
    title: normalizedTitle,
    slug: normalizedSlug,
    excerpt: String(post?.excerpt || '').trim(),
    content: String(post?.content || '').trim(),
    coverImage: String(post?.coverImage || '').trim(),
    tags: normalizeTags(post?.tags),
    status,
    author: String(post?.author || '').trim(),
    publishedAt,
    updatedAt: nowIso,
    createdAt: toIsoString(post?.createdAt) || nowIso,
  }
}

const sortByPublishedDate = (posts) =>
  [...posts].sort((a, b) => {
    const dateA = Date.parse(a.publishedAt || 0)
    const dateB = Date.parse(b.publishedAt || 0)
    return dateB - dateA
  })

const readSnapshot = (snapshot) =>
  snapshot.docs.map((item) => normalizePost(item.data()))

export const seedBlogIfEmpty = async () => {
  const snapshot = await getDocs(blogRef)
  return sortByPublishedDate(readSnapshot(snapshot))
}

export const fetchBlogPostsPage = async ({ pageSize = 50, cursor = null } = {}) => {
  const constraints = [orderBy(documentId()), limit(pageSize)]
  if (cursor) {
    constraints.push(startAfter(cursor))
  }

  const pageQuery = query(blogRef, ...constraints)

  const snapshot = await getDocs(pageQuery)
  const posts = readSnapshot(snapshot)
  const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null

  return {
    posts: sortByPublishedDate(posts),
    cursor: lastDoc,
    hasMore: snapshot.docs.length === pageSize,
  }
}

export const subscribeToPublishedBlogPosts = (onData, onError) =>
  onSnapshot(
    query(blogRef, where('status', '==', 'published'), limit(300)),
    (snapshot) => {
      const now = Date.now()
      const posts = readSnapshot(snapshot)
        .filter((post) => {
          if (!post.publishedAt) return true
          const publishedAtMs = Date.parse(post.publishedAt)
          if (Number.isNaN(publishedAtMs)) return true
          return publishedAtMs <= now
        })

      onData(sortByPublishedDate(posts))
    },
    (error) => {
      if (onError) onError(error)
    }
  )

export const subscribeToBlogPostBySlug = (slug, onData, onError) => {
  const sanitizedSlug = sanitizeSlug(slug)
  if (!sanitizedSlug) {
    onData(null)
    return () => {}
  }

  return onSnapshot(
    query(blogRef, where('slug', '==', sanitizedSlug), where('status', '==', 'published'), limit(1)),
    (snapshot) => {
      if (snapshot.empty) {
        onData(null)
        return
      }

      const item = snapshot.docs[0]
      const post = normalizePost(item.data())
      onData(post)
    },
    (error) => {
      if (onError) onError(error)
    }
  )
}

export const upsertBlogPost = async (post) => {
  const normalized = normalizePost(post)
  await setDoc(doc(db, BLOG_COLLECTION, String(normalized.id)), normalized)
  return normalized
}

export const deleteBlogPost = async (id) => {
  await deleteDoc(doc(db, BLOG_COLLECTION, String(id)))
}

export const validateBlogImageFile = (file) => {
  if (!file || typeof file !== 'object') {
    throw new Error('Invalid file selected.')
  }

  const fileName = String(file.name || 'image')
  const fileType = String(file.type || '').toLowerCase()
  const fileSize = Number(file.size || 0)

  if (!BLOG_IMAGE_ALLOWED_TYPES.includes(fileType)) {
    throw new Error('Only JPG, PNG, or WebP images are allowed.')
  }

  if (fileSize <= 0) {
    throw new Error(`Image ${fileName} is empty or invalid.`)
  }

  if (fileSize > BLOG_IMAGE_MAX_BYTES) {
    throw new Error('Image exceeds the 5MB size limit.')
  }
}

export const uploadBlogImage = async (file) => {
  assertSupabaseConfig()
  validateBlogImageFile(file)

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${STORAGE_PATHS.blogImages}/${Date.now()}_${safeName}`

  const { error: uploadError } = await supabase
    .storage
    .from(supabaseBucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase
    .storage
    .from(supabaseBucket)
    .getPublicUrl(filePath)

  return data.publicUrl
}
