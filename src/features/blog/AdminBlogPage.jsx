import React, { useMemo, useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase'
import { deleteBlogPost, fetchBlogPostsPage, seedBlogIfEmpty, slugFromTitle, upsertBlogPost, uploadBlogImage } from './blogStore'

const BLOG_BATCH_SIZE = 50

const emptyForm = {
  id: '',
  title: '',
  excerpt: '',
  content: '',
  coverImage: '',
  tagsText: '',
  status: 'draft',
  author: '',
  publishedAt: '',
}

const toForm = (post) => ({
  id: post.id,
  title: post.title || '',
  excerpt: post.excerpt || '',
  content: post.content || '',
  coverImage: post.coverImage || '',
  tagsText: Array.isArray(post.tags) ? post.tags.join(', ') : '',
  status: post.status || 'draft',
  author: post.author || '',
  publishedAt: post.publishedAt ? String(post.publishedAt).slice(0, 10) : '',
})

const parseTags = (value) => {
  const seen = new Set()

  return String(value || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .filter((tag) => {
      const key = tag.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

const toPayload = (form) => ({
  id: form.id,
  title: form.title.trim(),
  slug: slugFromTitle(form.title),
  excerpt: form.excerpt.trim(),
  content: form.content.trim(),
  coverImage: form.coverImage.trim(),
  tags: parseTags(form.tagsText),
  status: form.status === 'published' ? 'published' : 'draft',
  author: form.author.trim(),
  // Use local noon to avoid timezone shifts that move the intended calendar day.
  publishedAt: form.publishedAt ? new Date(`${form.publishedAt}T12:00:00`).toISOString() : '',
})

const formatDate = (value) => {
  if (!value) return 'Not published'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Not published'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}

const toDateInputValue = (value) => {
  if (!value) return ''

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''

  return parsed.toISOString().slice(0, 10)
}

const AdminBlogPage = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [editingId, setEditingId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [postsCursor, setPostsCursor] = useState(null)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const navigate = useNavigate()
  const selectedTags = useMemo(() => parseTags(form.tagsText), [form.tagsText])

  useEffect(() => {
    const loadInitialPosts = async () => {
      setLoading(true)
      setError('')

      try {
        await seedBlogIfEmpty()
        const { posts: firstPage, cursor, hasMore } = await fetchBlogPostsPage({ pageSize: BLOG_BATCH_SIZE })
        setPosts(firstPage)
        setPostsCursor(cursor)
        setHasMorePosts(hasMore)
      } catch {
        setError('Unable to load blog posts. Check Firebase connection and permissions.')
      } finally {
        setLoading(false)
      }
    }

    loadInitialPosts()
  }, [])

  const onLogout = async () => {
    await signOut(auth)
    navigate('/admin/login')
  }

  const loadMorePosts = async () => {
    if (isLoadingMore || !hasMorePosts || !postsCursor) return

    setIsLoadingMore(true)
    try {
      const { posts: nextPage, cursor, hasMore } = await fetchBlogPostsPage({
        pageSize: BLOG_BATCH_SIZE,
        cursor: postsCursor,
      })

      setPosts((prev) => {
        const merged = [...prev, ...nextPage]
        const seen = new Set()
        return merged.filter((item) => {
          if (seen.has(item.id)) return false
          seen.add(item.id)
          return true
        })
      })
      setPostsCursor(cursor)
      setHasMorePosts(hasMore)
    } catch {
      setError('Unable to load more blog posts.')
    } finally {
      setIsLoadingMore(false)
    }
  }

  const sortedPosts = useMemo(() => {
    const list = [...posts]
    list.sort((a, b) => {
      const dateA = Date.parse(a.publishedAt || 0)
      const dateB = Date.parse(b.publishedAt || 0)
      return dateB - dateA
    })
    return list
  }, [posts])

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return sortedPosts.filter((post) => {
      const matchesStatus = statusFilter === 'all' ? true : post.status === statusFilter
      if (!matchesStatus) return false

      if (!query) return true
      const haystack = `${post.title || ''} ${post.slug || ''} ${post.excerpt || ''}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [sortedPosts, statusFilter, searchQuery])

  const clearForm = () => {
    setForm(emptyForm)
    setFormErrors({})
    setEditingId('')
    setTagInput('')
  }

  const nextId = () => {
    const max = posts.reduce((acc, item) => Math.max(acc, Number(item.id) || 0), 0)
    return String(max + 1)
  }

  const updateField = (event) => {
    const { name, value } = event.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    setFormErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validateForm = () => {
    const errors = {}
    const parsedTags = parseTags(form.tagsText)

    if (form.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters.'
    }

    if (form.excerpt.trim().length < 20) {
      errors.excerpt = 'Excerpt should be at least 20 characters.'
    }

    if (form.content.trim().length < 120) {
      errors.content = 'Content should be at least 120 characters.'
    }

    if (parsedTags.length === 0) {
      errors.tagsText = 'Add at least one tag.'
    }

    return errors
  }

  const appendTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      tagsText: [...parseTags(prev.tagsText), tag].join(', '),
    }))
    setFormErrors((prev) => ({ ...prev, tagsText: '' }))
  }

  const addTag = () => {
    const value = tagInput.trim()
    if (!value) return

    appendTag(value)
    setTagInput('')
  }

  const removeTag = (tagToRemove) => {
    setForm((prev) => ({
      ...prev,
      tagsText: parseTags(prev.tagsText)
        .filter((tag) => tag.toLowerCase() !== tagToRemove.toLowerCase())
        .join(', '),
    }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    const validationErrors = validateForm()
    setFormErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const payload = toPayload({
        ...form,
        id: editingId || nextId(),
      })

      const saved = await upsertBlogPost(payload)

      setPosts((prev) => {
        const exists = prev.some((item) => item.id === saved.id)
        return exists
          ? prev.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...prev]
      })

      clearForm()
    } catch {
      setError('Failed to save blog post.')
    } finally {
      setSubmitting(false)
    }
  }

  const onEdit = (post) => {
    setEditingId(post.id)
    setForm(toForm(post))
    setFormErrors({})
    setTagInput('')
  }

  const onDelete = async (id) => {
    try {
      await deleteBlogPost(id)
      setPosts((prev) => prev.filter((post) => post.id !== id))
      if (editingId === id) {
        clearForm()
      }
    } catch {
      setError('Failed to delete blog post.')
    }
  }

  const onToggleStatus = async (post) => {
    const nextStatus = post.status === 'published' ? 'draft' : 'published'

    try {
      const saved = await upsertBlogPost({
        ...post,
        status: nextStatus,
        publishedAt: nextStatus === 'published' ? (post.publishedAt || new Date().toISOString()) : '',
      })

      setPosts((prev) => prev.map((item) => (item.id === post.id ? saved : item)))
    } catch {
      setError('Failed to update publish status.')
    }
  }

  const onUploadCover = async (event) => {
    const [file] = Array.from(event.target.files || [])
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const url = await uploadBlogImage(file)
      setForm((prev) => ({ ...prev, coverImage: url }))
    } catch (err) {
      const message = String(err?.message || 'Upload failed.').trim()
      setError(message.length > 140 ? `${message.slice(0, 140)}...` : message)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      <header className='fixed top-0 left-0 right-0 z-50 bg-slate-900 shadow-lg'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 py-3 md:py-0 md:h-16 flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-lg bg-brand flex items-center justify-center font-bold text-white text-sm select-none'>C</div>
            <span className='font-semibold text-white text-lg tracking-tight'>Citify Admin</span>
          </div>
          <nav className='w-full md:w-auto flex items-center gap-1 overflow-x-auto pb-1 md:pb-0'>
            <Link to='/admin/properties' className='px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-medium transition-colors whitespace-nowrap'>Properties</Link>
            <Link to='/admin/blog' className='px-3 py-2 rounded-lg bg-brand text-white text-sm font-medium whitespace-nowrap'>Blog</Link>
            <Link to='/admin/tours' className='px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-medium transition-colors whitespace-nowrap'>Inspections</Link>
            <Link to='/admin/contacts' className='px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-medium transition-colors whitespace-nowrap'>Contacts</Link>
            <button onClick={onLogout} className='ml-auto md:ml-2 px-3 py-2 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 text-sm transition-colors whitespace-nowrap'>Log Out</button>
          </nav>
        </div>
      </header>

      <div className='pt-28 md:pt-16'>
        <div className='bg-white border-b border-slate-200'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 py-5 md:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div>
              <h1 className='text-xl font-bold text-slate-900'>Blog Posts</h1>
              <p className='text-slate-500 text-sm mt-0.5'>Create and publish market insights for SEO and lead education.</p>
            </div>
            <p className='text-sm text-slate-500'>{sortedPosts.length} post{sortedPosts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8'>
          {error && (
            <div className='mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium'>{error}</div>
          )}

          <div className='grid grid-cols-1 xl:grid-cols-5 gap-8'>
            <div className='xl:col-span-3 space-y-3'>
              <div className='rounded-2xl border border-slate-200 bg-white p-4 space-y-3'>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder='Search blog posts'
                  className='w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10'
                />

                <div className='grid grid-cols-3 gap-2'>
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'published', label: 'Published' },
                    { value: 'draft', label: 'Drafts' },
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      type='button'
                      onClick={() => setStatusFilter(tab.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                        statusFilter === tab.value
                          ? 'bg-brand text-white border-brand'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <p className='text-xs text-slate-500'>Showing {filteredPosts.length} loaded post{filteredPosts.length !== 1 ? 's' : ''}</p>
              </div>

              <div className='rounded-2xl border border-slate-200 bg-white overflow-hidden'>
                <div className='hidden md:grid grid-cols-[2.2fr_0.9fr_1fr_auto] gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50'>
                  <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-500'>Post</p>
                  <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-500'>Status</p>
                  <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-500'>Published</p>
                  <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-500'>Actions</p>
                </div>

                <div className='max-h-[68vh] overflow-y-auto'>
                  {loading && (
                    <div className='p-10 text-center text-slate-400 text-sm'>Loading blog posts...</div>
                  )}

                  {!loading && filteredPosts.length === 0 && (
                    <div className='p-10 text-center text-slate-400 text-sm'>No matching posts found.</div>
                  )}

                  {!loading && filteredPosts.map((post) => (
                    <div key={post.id} className={`grid grid-cols-1 md:grid-cols-[2.2fr_0.9fr_1fr_auto] gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0 ${editingId === post.id ? 'bg-brand/5' : 'bg-white'}`}>
                      <div className='min-w-0'>
                        <p className='text-sm font-semibold text-slate-900 truncate'>{post.title}</p>
                        <p className='text-xs text-slate-500 truncate mt-0.5'>/{post.slug}</p>
                      </div>

                      <div className='text-xs flex items-center'>
                        <span className={`rounded-full border px-2.5 py-1 font-semibold ${post.status === 'published' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
                          {post.status}
                        </span>
                      </div>

                      <div className='text-xs text-slate-600 flex items-center'>{formatDate(post.publishedAt)}</div>

                      <div className='flex flex-wrap items-center gap-1.5 md:justify-end'>
                        <button
                          type='button'
                          onClick={() => onEdit(post)}
                          className='px-2.5 py-1.5 rounded-lg bg-brand text-white text-[11px] font-medium hover:bg-brand-strong transition-colors'
                        >
                          Edit
                        </button>
                        <button
                          type='button'
                          onClick={() => onToggleStatus(post)}
                          className='px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-medium hover:bg-slate-50 transition-colors'
                        >
                          {post.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          type='button'
                          onClick={() => onDelete(post.id)}
                          className='px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 text-[11px] font-medium hover:bg-red-50 transition-colors'
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {hasMorePosts && (
                <div className='flex items-center justify-center'>
                  <button
                    type='button'
                    onClick={loadMorePosts}
                    disabled={isLoadingMore}
                    className='px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold'
                  >
                    {isLoadingMore ? 'Loading more...' : 'Load More Posts'}
                  </button>
                </div>
              )}
            </div>

            <div className='xl:col-span-2'>
              <div className='bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-20'>
                <div className='px-6 py-4 border-b border-slate-100 flex items-center justify-between'>
                  <h2 className='text-sm font-semibold text-slate-900'>
                    {editingId ? `Editing Post #${editingId}` : 'Create Blog Post'}
                  </h2>
                  {editingId && (
                    <span className='text-[10px] font-semibold uppercase tracking-wider text-brand bg-brand/10 px-2 py-1 rounded-full'>Editing</span>
                  )}
                </div>

                <form onSubmit={onSubmit} className='p-6 space-y-4'>
                  <div>
                    <label className='text-xs font-medium text-slate-600 mb-1 block'>Title</label>
                    <input
                      name='title'
                      value={form.title}
                      onChange={updateField}
                      placeholder='Blog title'
                      className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10'
                    />
                    {formErrors.title && <p className='mt-1 text-xs text-red-600'>{formErrors.title}</p>}
                  </div>

                  <div>
                    <label className='text-xs font-medium text-slate-600 mb-1 block'>Excerpt</label>
                    <textarea
                      name='excerpt'
                      value={form.excerpt}
                      onChange={updateField}
                      rows={3}
                      placeholder='Short summary'
                      className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 resize-y'
                    />
                    {formErrors.excerpt && <p className='mt-1 text-xs text-red-600'>{formErrors.excerpt}</p>}
                  </div>

                  <div>
                    <label className='text-xs font-medium text-slate-600 mb-1 block'>Content</label>
                    <textarea
                      name='content'
                      value={form.content}
                      onChange={updateField}
                      rows={10}
                      placeholder='Article'
                      className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 resize-y'
                    />
                    {formErrors.content && <p className='mt-1 text-xs text-red-600'>{formErrors.content}</p>}
                  </div>

                  <div>
                    <label className='text-xs font-medium text-slate-600 mb-1 block'>Cover Image URL</label>
                    <input
                      name='coverImage'
                      value={form.coverImage}
                      onChange={updateField}
                      placeholder='https://...'
                      className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10'
                    />
                    <div className='mt-2 flex items-center gap-2'>
                      <label className='inline-flex cursor-pointer items-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50'>
                        <input type='file' accept='image/png,image/jpeg,image/webp' className='hidden' onChange={onUploadCover} />
                        {uploading ? 'Uploading...' : 'Upload Image'}
                      </label>
                      {form.coverImage && (
                        <button
                          type='button'
                          onClick={() => setForm((prev) => ({ ...prev, coverImage: '' }))}
                          className='text-xs font-semibold text-red-600 hover:text-red-700'
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    <div>
                      <label className='text-xs font-medium text-slate-600 mb-1 block'>Status</label>
                      <select
                        name='status'
                        value={form.status}
                        onChange={updateField}
                        className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10'
                      >
                        <option value='draft'>Draft</option>
                        <option value='published'>Published</option>
                      </select>
                    </div>

                    <div>
                      <label className='text-xs font-medium text-slate-600 mb-1 block'>Publish Date</label>
                      <DatePicker
                        selected={form.publishedAt ? new Date(form.publishedAt) : null}
                        onChange={(date) => {
                          setForm((prev) => ({
                            ...prev,
                            publishedAt: toDateInputValue(date),
                          }))
                          setFormErrors((prev) => ({ ...prev, publishedAt: '' }))
                        }}
                        dateFormat='yyyy-MM-dd'
                        placeholderText='Select date'
                        isClearable
                        className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10'
                        wrapperClassName='w-full'
                      />
                    </div>
                  </div>

                  <div>
                    <label className='text-xs font-medium text-slate-600 mb-1 block'>Author</label>
                    <input
                      name='author'
                      value={form.author}
                      onChange={updateField}
                      placeholder='Citify Research Team'
                      className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10'
                    />
                  </div>

                  <div>
                    <label className='text-xs font-medium text-slate-600 mb-1 block'>Tags</label>
                    <div className='flex gap-2'>
                      <input
                        value={tagInput}
                        onChange={(event) => setTagInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            addTag()
                          }
                        }}
                        placeholder='Add tag'
                        className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10'
                      />
                      <button
                        type='button'
                        onClick={addTag}
                        className='px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm shrink-0'
                      >
                        Add
                      </button>
                    </div>
                    {formErrors.tagsText && <p className='mt-1 text-xs text-red-600'>{formErrors.tagsText}</p>}

                    {selectedTags.length > 0 && (
                      <div className='mt-3 flex flex-wrap gap-1.5'>
                        {selectedTags.map((tag) => (
                          <span
                            key={tag}
                            className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-medium border border-brand/20'
                          >
                            {tag}
                            <button type='button' onClick={() => removeTag(tag)} className='hover:text-brand-strong text-base leading-none mt-px'>×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className='flex items-center gap-2 pt-2'>
                    <button
                      type='submit'
                      disabled={submitting || uploading}
                      className='flex-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-60'
                    >
                      {submitting ? 'Saving...' : editingId ? 'Update Post' : 'Create Post'}
                    </button>

                    <button
                      type='button'
                      onClick={clearForm}
                      className='rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50'
                    >
                      Clear
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminBlogPage
