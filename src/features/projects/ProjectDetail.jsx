import React, { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../../shared/components/Navbar'
import Footer from '../../shared/components/Footer'
import LazyImage from '../../shared/components/LazyImage'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { toast } from 'react-toastify'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { seedProjectsIfEmpty, subscribeToProjectById } from './projectsStore'
import { subscribeToPublishedBlogPosts } from '../blog/blogStore'
import { createTourRequest } from '../tours/toursStore'
import { getListingTypeConfig } from './listingTypes'
import { setDocumentSeo } from '../../shared/lib/seo'
import { COMPANY } from '../../shared/config/siteConfig'

const inspectionTimeSlots = Array.from({ length: 13 }, (_, idx) => {
  const totalMinutes = 10 * 60 + (idx * 30)
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
  const minutes = String(totalMinutes % 60).padStart(2, '0')
  return `${hours}:${minutes}`
})

const formatSlotLabel = (time24) => {
  const [hourText, minuteText] = time24.split(':')
  const hourNum = Number(hourText)
  const period = hourNum >= 12 ? 'PM' : 'AM'
  const hour12 = hourNum % 12 || 12
  return `${hour12}:${minuteText} ${period}`
}

const formatStatusLabel = (status) => {
  const labels = {
    available: 'Available',
    'sold-out': 'Sold Out',
  }
  return labels[String(status || '').toLowerCase()] || 'Available'
}

const getStatusBadgeClass = (status, featured) => {
  if (featured) return 'border-brand/25 bg-brand/10 text-brand'

  const normalized = String(status || '').toLowerCase()
  if (normalized === 'sold-out' || normalized === 'sold' || normalized === 'reserved') return 'border-red-200 bg-red-50 text-red-600'
  return 'border-brand/25 bg-brand/10 text-brand'
}

const toLocalIsoDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toDateFromIso = (isoDate) => {
  if (!isoDate) return null
  const parsed = new Date(`${isoDate}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const isWorkingDay = (date) => {
  const day = date.getDay()
  return day !== 0 && day !== 6
}

const toSearchTokens = (value) =>
  String(value || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2)

const formatBlogDate = (value) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Recently published'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}

const ProjectDetail = () => {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState('')
  const [tourForm, setTourForm] = useState({
    tourType: 'in-person',
    date: '',
    time: '10:00',
    name: '',
    phone: '',
    email: '',
    message: '',
  })
  const [tourSubmitted, setTourSubmitted] = useState(false)
  const [tourSubmitting, setTourSubmitting] = useState(false)
  const [tourError, setTourError] = useState('')
  const [tourFieldErrors, setTourFieldErrors] = useState({})
  const [relatedPosts, setRelatedPosts] = useState([])
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false)
  const jsonLdRef = useRef(null)

  useEffect(() => {
    if (!id) {
      setProject(null)
      setLoading(false)
      return () => {}
    }

    let unsubscribe = () => {}

    const init = async () => {
      await seedProjectsIfEmpty()
      unsubscribe = subscribeToProjectById(
        id,
        (data) => {
          setProject(data)
          setLoading(false)
        },
        () => {
          setProject(null)
          setLoading(false)
        }
      )
    }

    try {
      setLoading(true)
      init()
    } catch {
        setLoading(false)
      setProject(null)
    }

    return () => unsubscribe()
  }, [id])

  useEffect(() => {
    const onOffline = () => setIsOffline(true)
    const onOnline = () => setIsOffline(false)
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)
    return () => {
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
    }
  }, [])

  const galleryImages =
    Array.isArray(project?.images) && project.images.length > 0
      ? project.images
      : project?.image
        ? [project.image]
        : []
  const primaryGalleryImage = galleryImages[0] || ''
  const listingConfig = getListingTypeConfig(project?.listingType)
  const paymentPlanStatus = project?.listingType === 'property'
    ? (project?.paymentPlan || '')
    : (project?.specifications?.floors || '')
  const showPaymentPlanBadge = paymentPlanStatus === 'Available' || paymentPlanStatus === 'Unavailable'
  const paymentPlanBadgeClass = paymentPlanStatus === 'Available'
    ? 'bg-brand/10 text-brand border-brand/20'
    : 'bg-slate-100 text-slate-600 border-slate-200'
  const isLandListing = project?.listingType === 'land'
  const selectedTourDate = toDateFromIso(tourForm.date)
  const todayDate = new Date()
  const hasMultipleLandPlots = project?.listingType === 'land' && project?.landPlotMode === 'multiple' && Array.isArray(project?.plotOptions) && project.plotOptions.length > 0
  const sortedLandPlotOptions = hasMultipleLandPlots
    ? [...project.plotOptions].sort((a, b) => {
      const amountA = Number(String(a?.price || '').replace(/[^0-9]/g, '')) || 0
      const amountB = Number(String(b?.price || '').replace(/[^0-9]/g, '')) || 0
      return amountA - amountB
    })
    : []
  const singleLandPlotOption = isLandListing && !hasMultipleLandPlots
    ? [{
      size: project?.specifications?.area || 'Single plot',
      buildingType: project?.buildingType || 'Not specified',
      price: project?.price || 'Price on request',
      status: project?.landOptionStatus || 'available',
      featured: Boolean(project?.landOptionFeatured),
    }]
    : []
  const landPlotCards = hasMultipleLandPlots ? sortedLandPlotOptions : singleLandPlotOption
  const specificationEntries = Object.entries(project?.specifications || {}).filter(([key]) => {
    if (project?.listingType === 'property' && key === 'parking') return false
    if (project?.listingType === 'shop' && (key === 'units' || key === 'parking')) return false
    return true
  })

  useEffect(() => {
    if (primaryGalleryImage) {
      setSelectedImage(primaryGalleryImage)
    }
  }, [project?.id, primaryGalleryImage])

  useEffect(() => {
    if (!project) return

    const seoDescription = [
      project.location ? `Located in ${project.location}.` : '',
      project.price ? `Price: ${project.price}.` : '',
      project.details ? String(project.details).replace(/\|/g, ', ') : '',
    ]
      .filter(Boolean)
      .join(' ')

    setDocumentSeo({
      title: `${project.title} Property Details`,
      description: seoDescription || `View detailed property information and request an inspection with ${COMPANY.name}.`,
      robots: 'index,follow',
      canonicalPath: `/property/${project.id}`,
      image: primaryGalleryImage || project.image || '/header_img.png',
      type: 'article',
    })
  }, [project, primaryGalleryImage])

  useEffect(() => {
    if (jsonLdRef.current) {
      try { document.head.removeChild(jsonLdRef.current) } catch { /* already removed */ }
      jsonLdRef.current = null
    }

    if (!project) return

    const imageUrl = (primaryGalleryImage || project.image || '')
    const resolvedImage = imageUrl.startsWith('http') ? imageUrl : `${window.location.origin}${imageUrl || '/header_img.png'}`

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'RealEstateListing',
      name: project.title,
      description: [
        project.location ? `Located in ${project.location}.` : '',
        project.price ? `Price: ${project.price}.` : '',
        project.details ? String(project.details).replace(/\|/g, ', ') : '',
      ].filter(Boolean).join(' ') || `Property listing by ${COMPANY.name}.`,
      url: `${window.location.origin}/property/${project.id}`,
      image: resolvedImage,
      ...(project.location && {
        address: {
          '@type': 'PostalAddress',
          addressLocality: project.location,
          addressCountry: 'NG',
        },
      }),
      ...(project.price && {
        offers: {
          '@type': 'Offer',
          price: project.price,
          priceCurrency: 'NGN',
          availability: project.status === 'sold-out'
            ? 'https://schema.org/SoldOut'
            : 'https://schema.org/InStock',
        },
      }),
      provider: {
        '@type': 'Organization',
        name: COMPANY.name,
        url: window.location.origin,
      },
    })

    document.head.appendChild(script)
    jsonLdRef.current = script

    return () => {
      if (jsonLdRef.current) {
        try { document.head.removeChild(jsonLdRef.current) } catch { /* already removed */ }
        jsonLdRef.current = null
      }
    }
  }, [project, primaryGalleryImage])

  useEffect(() => {
    const unsubscribe = subscribeToPublishedBlogPosts(
      (posts) => {
        if (!project) {
          setRelatedPosts([])
          return
        }

        const projectTokens = [
          ...toSearchTokens(project.listingType),
          ...toSearchTokens(project.location),
          ...toSearchTokens(project.title),
        ]

        const scoredPosts = posts
          .map((post) => {
            const postTags = (post.tags || []).map(tag => tag.toLowerCase())
            const titleExcerpt = `${post.title || ''} ${post.excerpt || ''}`.toLowerCase()
            
            // Tag matches weighted 5x higher than text matches
            const tagScore = projectTokens.reduce((acc, token) => {
              if (!token || !postTags.some(tag => tag.includes(token))) return acc
              return acc + 5
            }, 0)
            
            const textScore = projectTokens.reduce((acc, token) => {
              if (!token || !titleExcerpt.includes(token)) return acc
              return acc + 1
            }, 0)
            
            const score = tagScore + textScore

            return {
              ...post,
              _score: score,
            }
          })
          .sort((a, b) => b._score - a._score)

        const prioritized = scoredPosts.filter((post) => post._score > 0)
        const fallback = scoredPosts.filter((post) => post._score === 0)
        const nextPosts = [...prioritized, ...fallback].slice(0, 3)
        setRelatedPosts(nextPosts)
      },
      () => {
        setRelatedPosts([])
      }
    )

    return () => unsubscribe()
  }, [project])

  const updateTourField = (event) => {
    const { name, value } = event.target
    setTourForm((prev) => ({ ...prev, [name]: value }))
    setTourFieldErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const onSelectPlotOption = (option) => {
    const nextMessage = `I would like to schedule an inspection for the ${option?.size || 'selected'} plot${option?.buildingType ? ` approved for ${option.buildingType}` : ''}, currently listed at ${option?.price || 'the stated price'}. Please share the next available inspection slot.`
    setTourForm((prev) => ({ ...prev, message: nextMessage }))
    setTourFieldErrors((prev) => ({ ...prev, message: '' }))
    document.getElementById('inspection-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const validateTourForm = () => {
    const errors = {}
    const today = toLocalIsoDate(new Date())
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^[+]?[(]?[0-9\s\-()]{7,20}$/

    if (!tourForm.date) {
      errors.date = 'Please select a date.'
    } else if (tourForm.date < today) {
      errors.date = 'Date cannot be in the past.'
    } else {
      const selectedDate = toDateFromIso(tourForm.date)
      if (!selectedDate || !isWorkingDay(selectedDate)) {
        errors.date = 'Inspections are available Monday to Friday only.'
      }
    }

    if (!tourForm.time) {
      errors.time = 'Please select a time.'
    } else if (tourForm.date === today) {
      const now = new Date()
      const [selectedHour, selectedMinute] = tourForm.time.split(':').map(Number)
      const selectedTime = new Date(now)
      selectedTime.setHours(selectedHour, selectedMinute, 0, 0)
      if (selectedTime < now) {
        errors.time = 'Please select a future time for today.'
      }
    }

    if (!tourForm.name.trim() || tourForm.name.trim().length < 2) {
      errors.name = 'Please enter your full name.'
    }

    if (!phoneRegex.test(tourForm.phone.trim())) {
      errors.phone = 'Please enter a valid phone number.'
    }

    if (!emailRegex.test(tourForm.email.trim())) {
      errors.email = 'Please enter a valid email address.'
    }

    if (tourForm.message.trim().length > 1000) {
      errors.message = 'Message cannot exceed 1000 characters.'
    }

    return errors
  }

  const onSubmitTour = async (event) => {
    event.preventDefault()
    setTourSubmitted(false)
    setTourError('')

    if (!navigator.onLine) {
      setTourError("You're offline.")
      toast.error("You're offline.")
      return
    }

    const fieldErrors = validateTourForm()
    setTourFieldErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) {
      toast.error('Please fix the highlighted fields before submitting.')
      return
    }

    setTourSubmitting(true)

    try {
      await createTourRequest({
        projectId: project.id,
        projectTitle: project.title,
        projectLocation: project.location,
        ...tourForm,
        date: tourForm.date,
      })

      setTourSubmitted(true)
      toast.success('Inspection request submitted successfully. We will contact you shortly.')
      setTourForm({
        tourType: 'in-person',
        date: '',
        time: '10:00',
        name: '',
        phone: '',
        email: '',
        message: '',
      })
    } catch (error) {
      if (error?.code === 'permission-denied') {
        const bookedMessage = 'That date and time slot is already booked. Please choose another slot.'
        setTourError(bookedMessage)
        toast.error(bookedMessage)
        return
      }

      if (!navigator.onLine) {
        setTourError("You're offline.")
        toast.error("You're offline.")
      } else {
        setTourError('Network error. Please check your connection and try again.')
        toast.error('Network error. Please check your connection and try again.')
      }
    } finally {
      setTourSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className='w-full overflow-hidden'>
        <Navbar />
        <div className='pt-24 pb-20 text-center text-gray-600'>Loading property...</div>
        <Footer />
      </div>
    )
  }

  if (!project) {
    return (
      <div className='w-full overflow-hidden'>
        <Navbar />
        <div className='pt-20 pb-20 text-center'>
          <h1 className='text-2xl font-bold'>Property Not Found</h1>
          <Link to="/properties" className='mt-6 bg-brand text-white px-8 py-2 rounded inline-block cursor-pointer'>
            Back
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className='w-full overflow-hidden'>
      <Navbar />
      <div className='pt-24 pb-20 px-6 md:px-12 lg:px-20'>
        {/* Back Button */}
        <div className='max-w-6xl mx-auto mb-8'>
          <Link to="/properties" className='flex items-center gap-2 text-brand hover:text-brand-strong font-medium'>
            <ChevronLeft size={20} />
            Back 
          </Link>
        </div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className='max-w-6xl mx-auto mb-14'
        >
          <div className='grid grid-cols-1 md:grid-cols-[96px_minmax(0,1fr)] gap-4 md:gap-5 items-start'>
            {galleryImages.length > 1 && (
              <div className='order-2 md:order-1 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:max-h-130 pb-1 md:pb-0'>
                {galleryImages.map((img, idx) => (
                  <button
                    key={`${project.id}-gallery-${idx}`}
                    type='button'
                    onClick={() => setSelectedImage(img)}
                    aria-label={`Show image ${idx + 1}`}
                    className={`shrink-0 w-20 h-20 md:w-full md:h-20 rounded-2xl overflow-hidden border-2 transition-all ${selectedImage === img ? 'border-brand shadow-[0_0_0_2px_rgba(5,143,68,0.15)]' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <LazyImage
                      src={img}
                      alt={`${project.title} image ${idx + 1}`}
                      className='w-full h-full object-cover bg-slate-100'
                      skeletonClass='w-full h-full bg-slate-100'
                    />
                  </button>
                ))}
              </div>
            )}

            <div className='order-1 md:order-2 rounded-3xl overflow-hidden shadow-lg bg-gray-100'>
              <AnimatePresence mode='wait'>
                <motion.div
                  key={selectedImage || 'default'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <LazyImage
                    src={selectedImage || galleryImages[0] || project.image}
                    alt={project.title}
                    className='w-full h-72 sm:h-96 md:h-115 lg:h-130 object-contain rounded-3xl bg-gray-100'
                    skeletonClass='w-full h-72 sm:h-96 md:h-115 lg:h-130 rounded-3xl bg-gray-100'
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Content Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className='max-w-6xl mx-auto'
        >
          {/* Header */}
          <div className='mb-12'>
            <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4'>{project.title}</h1>
            {showPaymentPlanBadge && (
              <div className='mt-2'>
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${paymentPlanBadgeClass}`}>
                  <span className='inline-flex items-center gap-2'>
                    {tourSubmitting && <span className='h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin' />}
                    {tourSubmitting ? 'Submitting...' : 'Request Inspection'}
                  </span>
                </span>
              </div>
            )}
            <div className='flex flex-col md:flex-row md:items-center md:gap-8 gap-4'>
              <div>
                <p className='text-gray-600'>Location</p>
                <p className='text-xl font-semibold text-gray-900'>{project.location}</p>
              </div>
              <div>
                <p className='text-gray-600'>{hasMultipleLandPlots ? 'Starting Price' : 'Price'}</p>
                <p className='text-xl font-semibold text-brand'>{project.price}</p>
              </div>
            </div>
          </div>

          {isLandListing && landPlotCards.length > 0 && (
            <div className='mb-12'>
              <div className='mb-5 flex flex-wrap items-end justify-between gap-3'>
                <div>
                  <h2 className='text-2xl font-bold text-gray-900'>{hasMultipleLandPlots ? 'Available Plot Sizes' : 'Plot Option'}</h2>
                </div>
              </div>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                {landPlotCards.map((option, idx) => {
                  const isSoldOut = String(option?.status || '').toLowerCase() === 'sold-out'

                  return (
                  <div key={`plot-option-${idx}`} className={`rounded-2xl border p-5 shadow-sm transition ${isSoldOut ? 'border-slate-200 bg-slate-100/80 opacity-75' : 'border-gray-200 bg-white hover:border-brand/35 hover:shadow-md'}`}>
                    <div className='mb-3 flex items-start justify-between gap-3'>
                      <div>
                        <p className='text-xs font-semibold uppercase tracking-[0.16em] text-gray-500'>Plot Size</p>
                        <p className='mt-1 text-lg font-semibold text-gray-900'>{option.size || 'N/A'}</p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(option?.status, option?.featured)}`}>
                        {option?.featured ? 'Best Value' : formatStatusLabel(option?.status)}
                      </span>
                    </div>

                    <div className='space-y-2 text-sm'>
                      <p className='text-gray-600'>
                        <span className='font-medium text-gray-900'>Approved Development:</span> {option.buildingType || 'Not specified'}
                      </p>
                      <p className='text-brand text-xl font-semibold'>{option.price}</p>
                    </div>

                    <button
                      type='button'
                      disabled={isSoldOut}
                      onClick={() => onSelectPlotOption(option)}
                      className={`mt-4 inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${isSoldOut ? 'cursor-not-allowed border-slate-200 bg-slate-200 text-slate-500' : 'border-brand/30 bg-brand/8 text-brand hover:bg-brand hover:text-white'}`}
                    >
                      {isSoldOut ? 'No longer available' : 'Book inspection for this plot'}
                    </button>
                  </div>
                )})}
              </div>
            </div>
          )}

          {/* Description */}
          {project.listingType !== 'land' && (
            <div className='mb-12'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900'>Description</h2>
              <p className='text-gray-600 text-lg leading-relaxed'>{project.details}</p>
            </div>
          )}

          {/* Features */}
          {Array.isArray(project.features) && project.features.length > 0 && (
            <div className='mb-12'>
              <h2 className='text-2xl font-bold mb-6 text-gray-900'>Features</h2>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {project.features.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className='flex items-center gap-4 p-4 rounded-lg bg-brand/10'
                  >
                    <div className='w-3 h-3 rounded-full bg-brand shrink-0' />
                    <span className='font-semibold text-gray-900'>{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Specifications */}
          <div className='mb-12'>
            <h2 className='text-2xl font-bold mb-6 text-gray-900'>Details</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              {specificationEntries.map(([key, value], idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className='p-6 rounded-lg border border-gray-200 text-center'
                >
                  <p className='text-gray-600 text-sm uppercase tracking-wide mb-2'>
                    {listingConfig.specificationLabels[key] || key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className={`text-2xl font-bold ${key === 'floors' && (value === 'Available' || value === 'Unavailable') ? (value === 'Available' ? 'text-brand' : 'text-slate-600') : 'text-gray-900'}`}>{value}</p>
                </motion.div>
              ))}
              {project.listingType === 'property' && project.paymentPlan && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.45 }}
                  className='p-6 rounded-lg border border-gray-200 text-center'
                >
                  <p className='text-gray-600 text-sm uppercase tracking-wide mb-2'>Payment Plan</p>
                  <p className={`text-2xl font-bold ${project.paymentPlan === 'Available' ? 'text-brand' : 'text-slate-600'}`}>{project.paymentPlan}</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Request Inspection */}
          <div id='inspection-form' className='rounded-2xl border border-brand/20 bg-linear-to-r from-brand/5 to-brand/10 p-6 md:p-8'>
            <h3 className='text-2xl font-bold text-gray-900 mb-2'>Request Inspection</h3>
            <p className='text-gray-600 mb-6'>Schedule an inspection and our team will confirm your visit details.</p>

            <form onSubmit={onSubmitTour} className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <label className='text-sm font-medium text-gray-700 mb-1 block'>Inspection Type</label>
                  <select
                    name='tourType'
                    value={tourForm.tourType}
                    onChange={updateTourField}
                    className='w-full rounded-lg border border-gray-300 bg-white px-4 py-2'
                    required
                  >
                    <option value='in-person'>In-person</option>
                    <option value='video'>Video-chat</option>
                  </select>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700 mb-1 block'>Date</label>
                  <DatePicker
                    selected={selectedTourDate}
                    onChange={(date) => {
                      const nextDate = date ? toLocalIsoDate(date) : ''
                      setTourForm((prev) => ({ ...prev, date: nextDate }))
                      setTourFieldErrors((prev) => ({ ...prev, date: '' }))
                    }}
                    minDate={todayDate}
                    filterDate={isWorkingDay}
                    dateFormat='yyyy-MM-dd'
                    placeholderText='Inspection date'
                    dayClassName={(date) => (!isWorkingDay(date) ? 'inspection-day-disabled' : '')}
                    className='w-full rounded-lg border border-gray-300 bg-white px-4 py-2'
                    required
                  />
                  {tourFieldErrors.date && <p className='mt-1 text-xs text-red-600'>{tourFieldErrors.date}</p>}
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700 mb-1 block'>Time</label>
                  <select
                    name='time'
                    value={tourForm.time}
                    onChange={updateTourField}
                    className='w-full rounded-lg border border-gray-300 bg-white px-4 py-2'
                    required
                  >
                    {inspectionTimeSlots.map((slot) => (
                      <option key={slot} value={slot}>{formatSlotLabel(slot)}</option>
                    ))}
                  </select>
                  {tourFieldErrors.time && <p className='mt-1 text-xs text-red-600'>{tourFieldErrors.time}</p>}
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <label className='text-sm font-medium text-gray-700 mb-1 block'>Name</label>
                  <input
                    type='text'
                    name='name'
                    value={tourForm.name}
                    onChange={updateTourField}
                    placeholder='Your full name'
                    className='w-full rounded-lg border border-gray-300 bg-white px-4 py-2'
                    required
                  />
                  {tourFieldErrors.name && <p className='mt-1 text-xs text-red-600'>{tourFieldErrors.name}</p>}
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700 mb-1 block'>Phone</label>
                  <input
                    type='tel'
                    name='phone'
                    value={tourForm.phone}
                    onChange={updateTourField}
                    placeholder='Enter your phone'
                    className='w-full rounded-lg border border-gray-300 bg-white px-4 py-2'
                    required
                  />
                  {tourFieldErrors.phone && <p className='mt-1 text-xs text-red-600'>{tourFieldErrors.phone}</p>}
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700 mb-1 block'>Email</label>
                  <input
                    type='email'
                    name='email'
                    value={tourForm.email}
                    onChange={updateTourField}
                    placeholder='Enter your email'
                    className='w-full rounded-lg border border-gray-300 bg-white px-4 py-2'
                    required
                  />
                  {tourFieldErrors.email && <p className='mt-1 text-xs text-red-600'>{tourFieldErrors.email}</p>}
                </div>
              </div>

              <div>
                <label className='text-sm font-medium text-gray-700 mb-1 block'>Message</label>
                <textarea
                  name='message'
                  value={tourForm.message}
                  onChange={updateTourField}
                  rows={4}
                  placeholder='Enter your message'
                  className='w-full rounded-lg border border-gray-300 bg-white px-4 py-2'
                />
                {tourFieldErrors.message && <p className='mt-1 text-xs text-red-600'>{tourFieldErrors.message}</p>}
              </div>

              <div className='flex flex-col sm:flex-row sm:items-center gap-3'>
                <button type='submit' disabled={tourSubmitting || isOffline} className='bg-brand text-white px-8 py-3 rounded-lg font-semibold hover:bg-brand-strong transition disabled:opacity-60'>
                  <span className='inline-flex items-center gap-2'>
                    {tourSubmitting && <span className='h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin' />}
                    {isOffline ? "You're offline" : tourSubmitting ? 'Submitting...' : 'Request Inspection'}
                  </span>
                </button>
                {tourSubmitted && (
                  <p className='text-sm text-green-700 font-medium'>Thanks, your inspection request has been received.</p>
                )}
                {tourError && (
                  <p className='text-sm text-red-600 font-medium'>{tourError}</p>
                )}
              </div>
            </form>
          </div>

          {relatedPosts.length > 0 && (
            <div className='mt-12 rounded-2xl border border-slate-200 bg-white p-6 md:p-8'>
              <div className='mb-5 flex flex-wrap items-end justify-between gap-3'>
                <div>
                  <p className='text-xs font-semibold uppercase tracking-[0.16em] text-brand'>Insights</p>
                  <h2 className='mt-2 text-2xl font-bold text-gray-900'>Related Guides</h2>
                  <p className='mt-1 text-sm text-slate-600'>Helpful reads for this property type and location.</p>
                </div>
                <Link to='/blog' className='text-sm font-semibold text-brand hover:text-brand-strong'>View all articles</Link>
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                {relatedPosts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className='group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md'
                  >
                    {post.coverImage && (
                      <img src={post.coverImage} alt={post.title} className='h-36 w-full object-cover' loading='lazy' />
                    )}
                    <div className='p-4'>
                      <p className='text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500'>{formatBlogDate(post.publishedAt)}</p>
                      <h3 className='mt-2 text-sm font-semibold text-slate-900 group-hover:text-brand'>{post.title}</h3>
                      {post.excerpt && <p className='mt-2 text-xs text-slate-600 line-clamp-3'>{post.excerpt}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}

export default ProjectDetail
