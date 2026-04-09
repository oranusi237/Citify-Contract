import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SitePageLayout from '../../shared/components/SitePageLayout'
import { setDocumentSeo } from '../../shared/lib/seo'
import { subscribeToPublishedBlogPosts } from './blogStore'
import { COMPANY } from '../../shared/config/siteConfig'

const formatDate = (value) => {
  if (!value) return 'Recently published'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Recently published'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}

const estimateReadingTime = (content) => {
  const words = String(content || '').trim().split(/\s+/).filter(Boolean).length
  if (!words) return '1 min read'
  return `${Math.max(1, Math.ceil(words / 220))} min read`
}

const BlogPage = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setDocumentSeo({
      title: 'Blog and Market Insights',
      description: `Expert property buying guides, market updates, and investor tips from ${COMPANY.name}.`,
      canonicalPath: '/blog',
      robots: 'index,follow',
      type: 'website',
    })

    const unsubscribe = subscribeToPublishedBlogPosts(
      (nextPosts) => {
        setPosts(nextPosts)
        setLoading(false)
      },
      () => {
        setError('Unable to load blog posts right now.')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return posts

    return posts.filter((post) => {
      const haystack = `${post.title || ''} ${post.excerpt || ''} ${(post.tags || []).join(' ')}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [posts, searchQuery])

  return (
    <SitePageLayout contentAs='main' contentClassName='pt-24 pb-14'>
      <section className='mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='rounded-3xl border border-brand/15 bg-linear-to-br from-emerald-50 via-white to-slate-50 p-6 sm:p-8'>
          <p className='text-xs font-semibold uppercase tracking-[0.2em] text-brand'>Market Insights</p>
          <h1 className='mt-3 text-3xl sm:text-4xl font-bold text-slate-900'>Real Estate Blog</h1>
          <p className='mt-3 max-w-2xl text-sm sm:text-base text-slate-600'>
            Practical guides on land acquisition, due diligence, financing, and high-growth locations.
          </p>

          <div className='mt-6 mx-auto w-full max-w-xl'>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder='Search'
              className='w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10'
            />
          </div>
        </div>

        {error && (
          <div className='mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>{error}</div>
        )}

        {loading && (
          <div className='mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500'>Loading blog posts...</div>
        )}

        {!loading && !error && filteredPosts.length === 0 && (
          <div className='mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500'>No blog posts match your search yet.</div>
        )}

        {!loading && filteredPosts.length > 0 && (
          <div className='mt-8 grid grid-cols-1 gap-5 md:grid-cols-2'>
            {filteredPosts.map((post) => (
              <article key={post.id} className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md'>
                <Link to={`/blog/${post.slug}`} className='block'>
                  {post.coverImage && (
                    <img src={post.coverImage} alt={post.title} className='h-52 w-full object-cover' loading='lazy' />
                  )}

                  <div className='p-5'>
                    <div className='mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500'>
                      <span>{formatDate(post.publishedAt)}</span>
                      <span>•</span>
                      <span>{estimateReadingTime(post.content)}</span>
                      {post.author && (
                        <>
                          <span>•</span>
                          <span>{post.author}</span>
                        </>
                      )}
                    </div>

                    <h2 className='text-xl font-semibold text-slate-900'>{post.title}</h2>
                    <p className='mt-2 text-sm text-slate-600'>{post.excerpt}</p>

                    {Array.isArray(post.tags) && post.tags.length > 0 && (
                      <div className='mt-4 flex flex-wrap gap-2'>
                        {post.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className='rounded-full border border-brand/20 bg-brand/5 px-2.5 py-1 text-[11px] font-semibold text-brand'>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </SitePageLayout>
  )
}

export default BlogPage
