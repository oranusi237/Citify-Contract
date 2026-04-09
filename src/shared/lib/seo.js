import { COMPANY } from '../config/siteConfig'

export const SITE_NAME = COMPANY.name
export const DEFAULT_IMAGE = '/header_img.png'

const setMeta = (name, content, attribute = 'name') => {
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, name)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

const setCanonical = (href) => {
  let element = document.head.querySelector('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }
  element.setAttribute('href', href)
}

export const setDocumentSeo = ({
  title,
  description,
  robots = 'index,follow',
  canonicalPath,
  image = DEFAULT_IMAGE,
  type = 'website',
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
  const canonicalUrl = canonicalPath
    ? `${window.location.origin}${canonicalPath}`
    : `${window.location.origin}${window.location.pathname}`
  const imageUrl = image.startsWith('http') ? image : `${window.location.origin}${image}`

  document.title = fullTitle
  setMeta('description', description)
  setMeta('robots', robots)
  setMeta('og:title', fullTitle, 'property')
  setMeta('og:description', description, 'property')
  setMeta('og:type', type, 'property')
  setMeta('og:url', canonicalUrl, 'property')
  setMeta('og:image', imageUrl, 'property')
  setMeta('og:image:width', '1200', 'property')
  setMeta('og:image:height', '630', 'property')
  setMeta('og:image:alt', description, 'property')
  setMeta('twitter:card', 'summary_large_image')
  setMeta('twitter:title', fullTitle)
  setMeta('twitter:description', description)
  setMeta('twitter:image', imageUrl)
  setMeta('twitter:image:alt', description)
  setCanonical(canonicalUrl)
}
