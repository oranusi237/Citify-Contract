import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Camera, MapPin, Search, X } from 'lucide-react'
import LazyImage from '../shared/components/LazyImage'
import { seedProjectsIfEmpty, subscribeToProjects } from '../features/projects/projectsStore'
import { makeFadeUp, makeStaggerContainer, useMotionSettings, viewportOnce } from '../shared/lib/motion'
import { getListingTypeConfig } from '../features/projects/listingTypes'

const Projects = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const motionSettings = useMotionSettings()
  const fadeUp = makeFadeUp(motionSettings)
  makeStaggerContainer(motionSettings)

  const getImages = (project) =>
    Array.isArray(project.images) && project.images.length > 0
      ? project.images
      : project.image
        ? [project.image]
        : []

  const typeOptions = [
    { value: 'all', label: 'All types' },
    { value: 'land', label: 'Land' },
    { value: 'property', label: 'Property' },
    { value: 'shop', label: 'Shopping Complex' },
  ]
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredProjects = projects.filter((project) => {
    const haystack = [project.title, project.location, project.description, project.details, getListingTypeConfig(project.listingType).label]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery)
    const matchesType = selectedType === 'all' || project.listingType === selectedType

    return matchesQuery && matchesType
  })

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
          (err) => {
            console.error('[Projects] Firestore subscription error:', err)
            setLoading(false)
          }
        )
      } catch (err) {
        console.error('[Projects] Firebase init error:', err)
        setLoading(false)
      }
    }

    init()
    return () => unsubscribe()
  }, [])

  return (
    <motion.div
      initial='hidden'
      animate='visible'
      variants={fadeUp}
      className='container mx-auto py-6 px-6 md:px-20 lg:px-32 my-16 w-full overflow-hidden'
      id='Properties'
    >
      <motion.div
        variants={fadeUp}
        viewport={viewportOnce}
        className='relative overflow-hidden rounded-4xl border border-brand/15 bg-[radial-gradient(circle_at_top_left,rgba(5,143,68,0.14),transparent_35%),linear-gradient(180deg,#f7fcf9_0%,#ffffff_62%)] px-6 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:px-8 lg:px-12 lg:py-12'
      >
        <div className='absolute -right-10 top-0 h-32 w-32 rounded-full bg-brand/10 blur-3xl' />
        <div className='absolute bottom-0 left-0 h-28 w-28 rounded-full bg-slate-900/5 blur-3xl' />

        <div className='relative'>
          <div>
            <span className='inline-flex items-center gap-2 rounded-full border border-brand/15 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand shadow-sm'>
              Listings
            </span>
            <h1 className='mt-5 max-w-3xl text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl'>
              Properties <span className='text-brand'>Available</span> for your next smart move
            </h1>
            <p className='mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg'>
              Explore curated listings with verified locations, strong growth potential, and guided inspection support for serious buyers.
            </p>

            <div className='mt-8 w-full max-w-3xl mx-auto rounded-3xl border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-5'>
              <div className='mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(260px,420px)_200px_112px]'>
                <label className='relative block'>
                  <Search size={16} className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
                  <input
                    type='text'
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder='Search by property name'
                    className='w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20'
                  />
                </label>

                <select
                  value={selectedType}
                  onChange={(event) => setSelectedType(event.target.value)}
                  className='rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20'
                >
                  {typeOptions.map((typeOption) => (
                    <option key={typeOption.value} value={typeOption.value}>{typeOption.label}</option>
                  ))}
                </select>

                <button
                  type='button'
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedType('all')
                  }}
                  className='inline-flex w-full sm:w-28 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 lg:w-28'
                >
                  <X size={15} />
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className='mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 items-stretch'>
        {loading && (
          <div className='col-span-full rounded-[1.75rem] border border-dashed border-brand/30 bg-brand/5 px-6 py-14 text-center text-slate-500'>Loading properties...</div>
        )}

        <AnimatePresence mode='popLayout'>
        {!loading && filteredProjects.map((project) => {
          const images = getImages(project)
          const mainImage = images[0] || project.image
          const area = project.specifications?.area || 'Prime parcel'
          const showStartingFrom = project.listingType === 'land' && project.landPlotMode === 'multiple' && Array.isArray(project.plotOptions) && project.plotOptions.length > 0
          const landDetailItems = project.listingType === 'land'
            ? String(project.details || '')
              .split('|')
              .map((item) => item.trim())
              .filter(Boolean)
            : []
          const cardFeatures = Array.isArray(project.features)
            ? project.features.filter(Boolean).slice(0, 4)
            : []
          const extraFeaturesCount = Array.isArray(project.features)
            ? Math.max(project.features.filter(Boolean).length - cardFeatures.length, 0)
            : 0

          return (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <Link
                to={`/property/${project.id}`}
                className='group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]'
              >
                <div className='relative overflow-hidden'>
                  {project.featured && (
                    <div className='absolute left-4 top-4 z-10 inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand shadow-sm'>
                      Featured
                    </div>
                  )}
                  <div className='absolute inset-x-0 bottom-0 z-10 h-28 bg-linear-to-t from-slate-950/70 to-transparent' />
                  <LazyImage
                    src={mainImage}
                    alt={project.title}
                    className='h-64 w-full bg-slate-100 object-cover transition duration-500 group-hover:scale-[1.04]'
                    skeletonClass='h-64 w-full bg-slate-100'
                  />
                  <div className='absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between gap-3'>
                    <div>
                      <p className='text-xs font-medium uppercase tracking-[0.22em] text-white/75'>{showStartingFrom ? 'Starting From' : 'Price'}</p>
                      <p className='mt-1 text-2xl font-semibold text-white'>{project.price}</p>
                    </div>
                    <div className='inline-flex items-center gap-1 rounded-full bg-black/35 px-3 py-1.5 text-xs font-medium text-white backdrop-blur'>
                      <Camera size={14} />
                      {images.length} photos
                    </div>
                  </div>
                </div>

                <div className='flex flex-1 flex-col px-6 pb-6 pt-4'>
                  <div className='flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4'>
                    <div>
                      <h2 className='text-xl sm:text-2xl font-semibold text-slate-900 wrap-break-word'>{project.title}</h2>
                      <div className='mt-2 flex items-center gap-2 text-sm text-slate-500'>
                        <MapPin size={15} className='text-brand' />
                        <span className='wrap-break-word'>{project.location}</span>
                      </div>
                    </div>
                    <span className='shrink-0 whitespace-nowrap rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-brand'>
                      Inspection Ready
                    </span>
                  </div>

                  <div className={`mt-5 flex flex-wrap gap-2 ${project.listingType === 'land' ? 'min-h-13 content-start' : ''}`}>
                    {project.listingType !== 'land' && <span className='rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600'>{area}</span>}
                    {project.listingType === 'land' && landDetailItems.map((detail, idx) => (
                      <span key={`${project.id}-land-detail-${idx}`} className='rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600'>
                        {detail}
                      </span>
                    ))}
                    {cardFeatures.map((feature, idx) => (
                      <span key={`${project.id}-feature-${idx}`} className='rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600'>
                        {feature}
                      </span>
                    ))}
                    {extraFeaturesCount > 0 && (
                      <span className='rounded-full border border-brand/30 bg-brand/5 px-3 py-1 text-xs font-medium text-brand'>
                        +{extraFeaturesCount} more
                      </span>
                    )}
                  </div>

                  {project.listingType === 'land' && (
                    <p className='mt-3 min-h-6 text-xs leading-6 text-slate-500'>
                      {landDetailItems.length > 0
                        ? 'Inspection and due diligence support included.'
                        : 'Verified title documentation available.'}
                    </p>
                  )}

                  {project.listingType !== 'land' && (
                    <p className='mt-5 flex-1 text-[15px] leading-7 text-slate-600'>
                      {project.description || 'A carefully selected land offering with excellent potential and growth opportunities.'}
                    </p>
                  )}

                  <div className='mt-6 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between'>
                    <div>
                      <p className='text-xs font-semibold uppercase tracking-[0.22em] text-slate-400'>Buyer support</p>
                      <p className='mt-1 text-sm font-medium text-slate-700'>Inspection guidance available</p>
                    </div>
                    <span className='inline-flex items-center gap-2 text-sm font-semibold text-slate-900'>
                      View details
                      <ArrowUpRight size={16} className='transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
        </AnimatePresence>

        {!loading && filteredProjects.length === 0 && (
          <div className='col-span-full rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center'>
            <p className='text-sm font-semibold uppercase tracking-[0.24em] text-slate-400'>Inventory update pending</p>
            <p className='mt-3 text-xl font-semibold text-slate-900'>No properties match your search.</p>
            <p className='mt-2 text-slate-500'>Try another keyword or set location back to All locations.</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default Projects