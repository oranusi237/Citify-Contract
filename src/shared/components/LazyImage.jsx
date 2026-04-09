import React, { useState } from 'react'

const DEFAULT_SIZES = '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw'

const buildResponsiveSrcSet = (src) => {
  const value = String(src || '').trim()
  if (
    !value ||
    value.startsWith('data:') ||
    value.startsWith('/') ||
    (!value.startsWith('http://') && !value.startsWith('https://'))
  ) {
    return undefined
  }

  try {
    const widths = [480, 768, 1200]
    return widths
      .map((width) => {
        const url = new URL(value)
        url.searchParams.set('width', String(width))
        return `${url.toString()} ${width}w`
      })
      .join(', ')
  } catch {
    return undefined
  }
}

const LazyImage = ({ src, alt, className = '', skeletonClass = '', loading = 'lazy', sizes }) => {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const resolvedSizes = sizes || DEFAULT_SIZES
  const resolvedSrcSet = buildResponsiveSrcSet(src)
  const fallbackText = alt ? `Image unavailable: ${alt}` : 'Image unavailable'

  return (
    <div className={`relative overflow-hidden ${skeletonClass}`}>
      {!loaded && !errored && (
        <div className='absolute inset-0 bg-gray-200 animate-pulse' />
      )}
      {errored && (
        <div className='absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-xs px-3 text-center'>
          {fallbackText}
        </div>
      )}
      <img
        src={src}
        srcSet={resolvedSrcSet}
        alt={alt}
        loading={loading}
        decoding='async'
        sizes={resolvedSizes}
        onLoad={() => setLoaded(true)}
        onError={() => { setLoaded(true); setErrored(true) }}
        className={`transition-opacity duration-300 ${loaded && !errored ? 'opacity-100' : 'opacity-0'} ${className}`}
      />
    </div>
  )
}

export default LazyImage
