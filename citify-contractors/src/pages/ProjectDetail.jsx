import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import LazyImage from '../components/LazyImage'
import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { toast } from 'react-toastify'
import { seedProjectsIfEmpty, subscribeToProjects } from '../utils/projectsStore'
import { createTourRequest } from '../utils/toursStore'
import { getListingTypeConfig } from '../utils/listingTypes'

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

const formatInspectionDate = (isoDate) => {
  if (!isoDate) return ''
  const dateObj = new Date(`${isoDate}T00:00:00`)
  return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

const ProjectDetail = () => {
  const { id } = useParams()
  const [projects, setProjects] = useState([])
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

  useEffect(() => {
    let unsubscribe = () => {}

    const init = async () => {
      try {
        await seedProjectsIfEmpty()
        unsubscribe = subscribeToProjects(
          (data) => {
            setProjects(data)
            setLoading(false)
          },
          () => {
            setLoading(false)
          }
        )
      } catch {
        setLoading(false)
      }
    }

    init()
    return () => unsubscribe()
  }, [])

  const project = projects.find((p) => p.id === id)
  const galleryImages =
    Array.isArray(project?.images) && project.images.length > 0
      ? project.images
      : project?.image
        ? [project.image]
        : []
  const listingConfig = getListingTypeConfig(project?.listingType)
  const paymentPlanStatus = project?.listingType === 'property'
    ? (project?.paymentPlan || '')
    : (project?.specifications?.floors || '')
  const showPaymentPlanBadge = paymentPlanStatus === 'Available' || paymentPlanStatus === 'Unavailable'
  const paymentPlanBadgeClass = paymentPlanStatus === 'Available'
    ? 'bg-[#058F44]/10 text-[#058F44] border-[#058F44]/20'
    : 'bg-slate-100 text-slate-600 border-slate-200'
  const hasMultipleLandPlots = project?.listingType === 'land' && project?.landPlotMode === 'multiple' && Array.isArray(project?.plotOptions) && project.plotOptions.length > 0
  const specificationEntries = Object.entries(project?.specifications || {}).filter(([key]) => {
    if (project?.listingType === 'property' && key === 'parking') return false
    if (project?.listingType === 'shop' && (key === 'units' || key === 'parking')) return false
    return true
  })

  useEffect(() => {
    if (galleryImages.length > 0) {
      setSelectedImage(galleryImages[0])
    }
  }, [project?.id])

  const updateTourField = (event) => {
    const { name, value } = event.target
    setTourForm((prev) => ({ ...prev, [name]: value }))
    setTourFieldErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validateTourForm = () => {
    const errors = {}
    const today = new Date().toISOString().split('T')[0]
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^[+]?[(]?[0-9\s\-()]{7,20}$/

    if (!tourForm.date) {
      errors.date = 'Please select a date.'
    } else if (tourForm.date < today) {
      errors.date = 'Date cannot be in the past.'
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
        date: formatInspectionDate(tourForm.date),
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
    } catch {
      setTourError('Unable to submit request right now. Please try again.')
      toast.error('Unable to submit request right now. Please try again.')
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
          <Link to="/properties" className='mt-6 bg-[#058F44] text-white px-8 py-2 rounded inline-block cursor-pointer'>
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
          <Link to="/properties" className='flex items-center gap-2 text-[#058F44] hover:text-[#047335] font-medium'>
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
                    className={`shrink-0 w-20 h-20 md:w-full md:h-20 rounded-2xl overflow-hidden border-2 transition-all ${selectedImage === img ? 'border-[#058F44] shadow-[0_0_0_2px_rgba(5,143,68,0.15)]' : 'border-slate-200 hover:border-slate-300'}`}
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
              <LazyImage
                src={selectedImage || galleryImages[0] || project.image}
                alt={project.title}
                className='w-full h-72 sm:h-96 md:h-115 lg:h-130 object-contain rounded-3xl bg-gray-100'
                skeletonClass='w-full h-72 sm:h-96 md:h-115 lg:h-130 rounded-3xl bg-gray-100'
              />
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
                  Payment Plan: {paymentPlanStatus}
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
                <p className='text-xl font-semibold text-[#058F44]'>{project.price}</p>
              </div>
            </div>
          </div>

          {hasMultipleLandPlots && (
            <div className='mb-12'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900'>Available Plot Sizes</h2>
              <div className='overflow-hidden rounded-xl border border-gray-200'>
                <table className='w-full'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500'>Plot Size</th>
                      <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500'>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.plotOptions.map((option, idx) => (
                      <tr key={`plot-price-${idx}`} className='border-t border-gray-100'>
                        <td className='px-4 py-3 text-sm font-medium text-gray-800'>{option.size}</td>
                        <td className='px-4 py-3 text-sm font-semibold text-[#058F44]'>{option.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                    className='flex items-center gap-4 p-4 rounded-lg bg-[#058F44]/10'
                  >
                    <div className='w-3 h-3 rounded-full bg-[#058F44] shrink-0' />
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
                  <p className={`text-2xl font-bold ${key === 'floors' && (value === 'Available' || value === 'Unavailable') ? (value === 'Available' ? 'text-[#058F44]' : 'text-slate-600') : 'text-gray-900'}`}>{value}</p>
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
                  <p className={`text-2xl font-bold ${project.paymentPlan === 'Available' ? 'text-[#058F44]' : 'text-slate-600'}`}>{project.paymentPlan}</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Request Inspection */}
          <div className='rounded-2xl border border-[#058F44]/20 bg-linear-to-r from-[#058F44]/5 to-[#058F44]/10 p-6 md:p-8'>
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
                  <input
                    type='date'
                    name='date'
                    value={tourForm.date}
                    onChange={updateTourField}
                    min={new Date().toISOString().split('T')[0]}
                    onFocus={(event) => event.currentTarget.showPicker?.()}
                    onClick={(event) => event.currentTarget.showPicker?.()}
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
                <button type='submit' disabled={tourSubmitting} className='bg-[#058F44] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#047335] transition disabled:opacity-60'>
                  {tourSubmitting ? 'Submitting...' : 'Request Inspection'}
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
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}

export default ProjectDetail
