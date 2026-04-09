import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { setDocumentSeo } from '../lib/seo'
import { trackRouteView } from '../../utils/observability'
import { COMPANY } from '../config/siteConfig'

const routeMeta = (pathname) => {
  if (pathname === '/') {
    return {
      title: 'Premium Real Estate in Nigeria',
      description: `Discover premium properties, investment-ready land, and guided inspections with ${COMPANY.name}.`,
      robots: 'index,follow',
    }
  }

  if (pathname.startsWith('/about')) {
    return {
      title: 'About Us',
      description: `Learn how ${COMPANY.name} delivers transparent, trusted, and high-value real estate opportunities.`,
      robots: 'index,follow',
    }
  }

  if (pathname.startsWith('/properties')) {
    return {
      title: 'Properties',
      description: 'Browse curated land and property listings in growth-focused locations across Nigeria.',
      robots: 'index,follow',
    }
  }

  if (pathname.startsWith('/property/')) {
    return {
      title: 'Property Details',
      description: `View detailed property information and request an inspection with ${COMPANY.name}.`,
      robots: 'index,follow',
    }
  }

  if (pathname.startsWith('/blog')) {
    return {
      title: 'Blog and Market Insights',
      description: `Explore buying guides and market insights from ${COMPANY.name}.`,
      robots: 'index,follow',
    }
  }

  if (pathname.startsWith('/contact')) {
    return {
      title: 'Contact Us',
      description: 'Talk to our team about your property goals, timeline, and acquisition strategy.',
      robots: 'index,follow',
    }
  }

  if (pathname.startsWith('/privacy-policy')) {
    return {
      title: 'Privacy Policy',
      description: `Read how ${COMPANY.name} collects, stores, and processes your personal information.`,
      robots: 'index,follow',
    }
  }

  if (pathname.startsWith('/events')) {
    return {
      title: 'Events',
      description: `Stay updated on upcoming tours, investor sessions, and events from ${COMPANY.name}.`,
      robots: 'index,follow',
    }
  }

  if (pathname.startsWith('/admin')) {
    return {
      title: 'Admin',
      description: 'Internal dashboard for managing listings and inspection requests.',
      robots: 'noindex,nofollow',
    }
  }

  return {
    title: 'Page Not Found',
    description: 'The page you requested could not be found.',
    robots: 'noindex,nofollow',
  }
}

const RouteSeo = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    const meta = routeMeta(pathname)
    setDocumentSeo({
      title: meta.title,
      description: meta.description,
      robots: meta.robots,
      canonicalPath: pathname,
      type: pathname.startsWith('/property/') ? 'article' : 'website',
    })

    trackRouteView(pathname)
  }, [pathname])

  return null
}

export default RouteSeo
