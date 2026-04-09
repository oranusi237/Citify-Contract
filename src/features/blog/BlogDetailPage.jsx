import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SitePageLayout from '../../shared/components/SitePageLayout'
import { setDocumentSeo } from '../../shared/lib/seo'
import { COMPANY } from '../../shared/config/siteConfig'
import { subscribeToBlogPostBySlug, subscribeToPublishedBlogPosts } from './blogStore'

const formatDate = (value) => {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parsed)
}

const renderParagraphs = (content) => {
  return String(content || '')
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const BlogDetailPage = () => {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [relatedPosts, setRelatedPosts] = useState([])

  useEffect(() => {
    if (!slug) {
      setPost(null)
      setLoading(false)
      return () => {}
    }

    const unsubscribe = subscribeToBlogPostBySlug(
      slug,
      (nextPost) => {
        setPost(nextPost)
        setLoading(false)
      },
      () => {
        setError('Unable to load this article right now.')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [slug])

  useEffect(() => {
    const unsubscribe = subscribeToPublishedBlogPosts(
      (posts) => {
        const related = posts
          .filter((item) => item.slug !== post?.slug)
          .slice(0, 3)
        setRelatedPosts(related)
      },
      () => {}
    )

    return () => unsubscribe()
  }, [post?.slug])

  useEffect(() => {
    if (!post) return

    setDocumentSeo({
      title: post.title,
      description: post.excerpt || `Read this market insight from ${COMPANY.name}.`,
      canonicalPath: `/blog/${post.slug}`,
      image: post.coverImage || '/header_img.png',
      robots: 'index,follow',
      type: 'article',
    })
  }, [post])

  useEffect(() => {
    if (!post) return () => {}

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      image: post.coverImage ? [post.coverImage] : undefined,
      datePublished: post.publishedAt || undefined,
      dateModified: post.updatedAt || post.publishedAt || undefined,
      author: {
        '@type': 'Organization',
        name: post.author || COMPANY.name,
      },
      publisher: {
        '@type': 'Organization',
        name: COMPANY.name,
      },
      description: post.excerpt,
      mainEntityOfPage: `${window.location.origin}/blog/${post.slug}`,
    })

    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [post])

  const paragraphs = useMemo(() => renderParagraphs(post?.content), [post?.content])

  return (
    <SitePageLayout contentAs='main' contentClassName='pt-24 pb-14'>
      <section className='mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8'>
        <Link to='/blog' className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:border-brand hover:text-brand'>
          Back
        </Link>

        {error && (
          <div className='mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>{error}</div>
        )}

        {loading && (
          <div className='mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500'>Loading article...</div>
        )}

        {!loading && !post && (
          <div className='mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500'>Article not found or not published yet.</div>
        )}

        {!loading && post && (
          <article className='mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm'>
            {post.coverImage && (
              <img src={post.coverImage} alt={post.title} className='h-[280px] w-full object-cover sm:h-[360px]' />
            )}

            <div className='p-6 sm:p-8'>
              <p className='text-xs font-semibold uppercase tracking-[0.15em] text-brand'>Market Insight</p>
              <h1 className='mt-3 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl'>{post.title}</h1>

              <div className='mt-4 flex flex-wrap gap-2 text-xs text-slate-500'>
                {formatDate(post.publishedAt) && <span>{formatDate(post.publishedAt)}</span>}
                {post.author && (
                  <>
                    <span>•</span>
                    <span>{post.author}</span>
                  </>
                )}
              </div>

              {post.excerpt && (
                <p className='mt-5 rounded-2xl border border-brand/20 bg-brand/5 p-4 text-sm leading-relaxed text-slate-700'>{post.excerpt}</p>
              )}

              <div className='mt-7 space-y-4'>
                {paragraphs.map((paragraph, index) => (
                  <p key={index} className='text-base leading-8 text-slate-700'>
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className='mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5'>
                <h2 className='text-base font-semibold text-slate-900'>Ready to apply this insight?</h2>
                <p className='mt-2 text-sm text-slate-600'>Talk to our advisors about your preferred location and budget.</p>
                <div className='mt-4 flex flex-wrap gap-3'>
                  <Link to='/properties' className='rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-strong'>Browse Properties</Link>
                  <Link to='/contact' className='rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-brand hover:text-brand'>Book Consultation</Link>
                </div>
              </div>
            </div>
          </article>
        )}

        {!loading && post && relatedPosts.length > 0 && (
          <section className='mt-8'>
            <h2 className='text-lg font-semibold text-slate-900'>Related Articles</h2>
            <div className='mt-4 grid gap-3 sm:grid-cols-3'>
              {relatedPosts.map((item) => (
                <Link
                  key={item.id}
                  to={`/blog/${item.slug}`}
                  className='rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 transition hover:border-brand/30 hover:shadow-sm'
                >
                  <p className='font-semibold text-slate-900 line-clamp-2'>{item.title}</p>
                  <p className='mt-2 text-xs text-slate-500'>{formatDate(item.publishedAt)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </section>
    </SitePageLayout>
  )
}

export default BlogDetailPage
