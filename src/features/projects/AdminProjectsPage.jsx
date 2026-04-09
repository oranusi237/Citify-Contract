import React, { useEffect, useMemo, useState } from 'react'
import { signOut } from 'firebase/auth'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../../firebase'
import { deleteProject, fetchProjectsPage, seedProjectsIfEmpty, uploadProjectImage, upsertProject } from './projectsStore'
import { getListingTypeConfig, listingTypeOptions, normalizeListingType } from './listingTypes'
import { formatNaira, parseNairaAmount } from './price'

const emptyForm = {
  id: '',
  listingType: 'land',
  featured: false,
  title: '',
  price: '',
  location: '',
  image: '',
  images: [],
  description: '',
  details: '',
  features: [],
  landPlotMode: 'single',
  landOptionStatus: 'available',
  landOptionFeatured: false,
  buildingType: '',
  plotOptions: [{ size: '', price: '', buildingType: '', status: 'available', featured: false }],
  paymentPlan: '',
  area: '',
  units: '',
  floors: '',
  parking: '',
}

const plotStatusOptions = [
  { value: 'available', label: 'Available' },
  { value: 'sold-out', label: 'Sold Out' },
]
const PROJECTS_BATCH_SIZE = 50

const normalizePlotStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase()
  if (['sold-out', 'sold', 'reserved'].includes(normalized)) return 'sold-out'
  return 'available'
}

const normalizePlotOptionRow = (option) => ({
  size: String(option?.size || '').trim(),
  price: formatNaira(option?.price),
  buildingType: String(option?.buildingType || '').trim(),
  status: normalizePlotStatus(option?.status),
  featured: Boolean(option?.featured),
})

const normalizePlotOptionsForSave = (plotOptions) =>
  (Array.isArray(plotOptions) ? plotOptions : [])
    .map(normalizePlotOptionRow)
    .filter((option) => option.size && option.price)

const parseLandDetails = (detailsText) =>
  String(detailsText || '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)

const serializeLandDetails = (items) => items.join(' | ')

const resolveLandPriceFromOptions = (plotOptions) => {
  const minAmount = plotOptions.reduce((min, option) => {
    const amount = parseNairaAmount(option.price)
    if (!amount) return min
    return min === 0 ? amount : Math.min(min, amount)
  }, 0)

  return formatNaira(minAmount)
}

const toForm = (project) => ({
  id: project.id,
  listingType: normalizeListingType(project.listingType),
  featured: Boolean(project.featured),
  title: project.title || '',
  price: formatNaira(project.price),
  location: project.location || '',
  image: project.image || project.images?.[0] || '',
  images: project.images || (project.image ? [project.image] : []),
  description: project.description || '',
  details: project.details || '',
  features: project.features || [],
  landPlotMode: project.landPlotMode === 'multiple' ? 'multiple' : 'single',
  landOptionStatus: normalizePlotStatus(project.landOptionStatus),
  landOptionFeatured: Boolean(project.landOptionFeatured),
  buildingType: project.buildingType || '',
  plotOptions: project.plotOptions?.length
    ? project.plotOptions.map(normalizePlotOptionRow)
    : [{ size: '', price: '', buildingType: '', status: 'available', featured: false }],
  paymentPlan: project.paymentPlan || '',
  area: project.specifications?.area || '',
  units: project.specifications?.units || '',
  floors: project.specifications?.floors || '',
  parking: project.specifications?.parking || '',
})

const toProject = (form, fallbackImage = '', fallbackImages = []) => {
  const finalImages = Array.isArray(form.images) && form.images.length > 0
    ? form.images
    : form.image
      ? [form.image]
      : fallbackImages.length > 0
        ? fallbackImages
        : fallbackImage
          ? [fallbackImage]
          : []

  const listingType = normalizeListingType(form.listingType)
  const isLandMultiPlot = listingType === 'land' && form.landPlotMode === 'multiple'
  const plotOptions = isLandMultiPlot ? normalizePlotOptionsForSave(form.plotOptions) : []
  const price = isLandMultiPlot
    ? resolveLandPriceFromOptions(plotOptions)
    : formatNaira(form.price)
  const isLandListing = listingType === 'land'

  return ({
    id: form.id,
    listingType,
    featured: Boolean(form.featured),
    title: form.title,
    price,
    location: form.location,
    image: finalImages[0] || '',
    images: finalImages,
    description: isLandListing ? '' : form.description,
    details: form.details,
    features: Array.isArray(form.features) ? form.features : [],
    buildingType: isLandListing ? form.buildingType : '',
    landOptionStatus: isLandListing ? normalizePlotStatus(form.landOptionStatus) : 'available',
    landOptionFeatured: isLandListing ? Boolean(form.landOptionFeatured) : false,
    landPlotMode: listingType === 'land' ? form.landPlotMode : 'single',
    plotOptions,
    paymentPlan: form.paymentPlan || '',
    specifications: {
      area: form.area,
      units: form.units,
      floors: form.floors,
      parking: form.parking,
    },
  })
}

const toUploadErrorMessage = (error) => {
  const raw = String(error?.message || error?.error_description || '').trim()
  if (!raw) {
    return 'Upload failed. Please try again.'
  }
  return `Upload failed: ${raw.slice(0, 140)}`
}

const AdminProjectsPage = () => {
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [featureInput, setFeatureInput] = useState('')
  const [landDetailInput, setLandDetailInput] = useState('')
  const [activeSection, setActiveSection] = useState('basic')
  const [listSearch, setListSearch] = useState('')
  const [listFilter, setListFilter] = useState('all')
  const [projectsCursor, setProjectsCursor] = useState(null)
  const [hasMoreProjects, setHasMoreProjects] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const navigate = useNavigate()
  const listingConfig = getListingTypeConfig(form.listingType)

  const onLogout = async () => {
    await signOut(auth)
    navigate('/admin/login')
  }

  useEffect(() => {
    const loadInitialProjects = async () => {
      setLoading(true)
      setError('')

      try {
        await seedProjectsIfEmpty()
        const { projects: firstPage, cursor, hasMore } = await fetchProjectsPage({
          pageSize: PROJECTS_BATCH_SIZE,
        })
        setProjects(firstPage)
        setProjectsCursor(cursor)
        setHasMoreProjects(hasMore)
      } catch {
        setError('Unable to connect to Firebase. Check your Firebase config and Firestore rules.')
      } finally {
        setLoading(false)
      }
    }

    loadInitialProjects()
  }, [])

  const loadMoreProjects = async () => {
    if (isLoadingMore || !hasMoreProjects || !projectsCursor) return

    setIsLoadingMore(true)
    try {
      const { projects: nextPage, cursor, hasMore } = await fetchProjectsPage({
        pageSize: PROJECTS_BATCH_SIZE,
        cursor: projectsCursor,
      })

      setProjects((prev) => {
        const merged = [...prev, ...nextPage]
        const seen = new Set()
        return merged.filter((item) => {
          if (seen.has(item.id)) return false
          seen.add(item.id)
          return true
        })
      })
      setProjectsCursor(cursor)
      setHasMoreProjects(hasMore)
    } catch {
      setError('Unable to load more properties.')
    } finally {
      setIsLoadingMore(false)
    }
  }

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => Number(a.id) - Number(b.id)),
    [projects]
  )

  const filteredProjects = useMemo(() => {
    const query = listSearch.trim().toLowerCase()

    return sortedProjects.filter((project) => {
      const matchesType = listFilter === 'all' ? true : normalizeListingType(project.listingType) === listFilter
      if (!matchesType) return false

      if (!query) return true
      const haystack = `${project.title || ''} ${project.location || ''}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [sortedProjects, listFilter, listSearch])

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((prev) => {
      if (name === 'listingType') {
        const nextType = normalizeListingType(value)
        return {
          ...prev,
          listingType: nextType,
          landPlotMode: nextType === 'land' ? prev.landPlotMode : 'single',
          plotOptions: nextType === 'land' ? prev.plotOptions : [{ size: '', price: '', buildingType: '', status: 'available', featured: false }],
        }
      }

      if (name === 'landPlotMode') {
        return {
          ...prev,
          landPlotMode: value,
          plotOptions: value === 'multiple'
            ? (prev.plotOptions.length ? prev.plotOptions : [{ size: '', price: '', buildingType: '', status: 'available', featured: false }])
            : prev.plotOptions,
        }
      }

      return {
        ...prev,
        [name]: name === 'price'
          ? formatNaira(value)
          : name === 'featured'
            ? event.target.checked
            : value,
      }
    })
    if (name === 'listingType') {
      setFeatureInput('')
      setLandDetailInput('')
    }
    setFormErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const updatePlotOption = (index, key, rawValue) => {
    setForm((prev) => {
      const next = prev.plotOptions.map((option, idx) => {
        if (idx !== index) return option
        return {
          ...option,
          [key]: key === 'price' ? formatNaira(rawValue) : rawValue,
        }
      })

      return {
        ...prev,
        plotOptions: next,
      }
    })
    setFormErrors((prev) => ({ ...prev, plotOptions: '', price: '' }))
  }

  const addPlotOptionRow = () => {
    setForm((prev) => ({
      ...prev,
      plotOptions: [...prev.plotOptions, { size: '', price: '', buildingType: '', status: 'available', featured: false }],
    }))
  }

  const removePlotOptionRow = (index) => {
    setForm((prev) => {
      if (prev.plotOptions.length <= 1) {
        return {
          ...prev,
          plotOptions: [{ size: '', price: '', buildingType: '', status: 'available', featured: false }],
        }
      }

      return {
        ...prev,
        plotOptions: prev.plotOptions.filter((_, idx) => idx !== index),
      }
    })
  }

  const setPlotOptionFeatured = (index) => {
    setForm((prev) => ({
      ...prev,
      plotOptions: prev.plotOptions.map((option, idx) => ({
        ...option,
        featured: idx === index ? !option.featured : false,
      })),
    }))
  }

  const startEdit = (project) => {
    setEditingId(project.id)
    setForm(toForm(project))
    setFeatureInput('')
    setLandDetailInput('')
  }

  const clearForm = () => {
    setEditingId('')
    setForm(emptyForm)
    setFormErrors({})
    setFeatureInput('')
    setLandDetailInput('')
    setUploadError('')
    setActiveSection('basic')
  }

  const validateProjectForm = () => {
    const errors = {}
    const title = form.title.trim()
    const location = form.location.trim()
    const price = form.price.trim()
    const isLandMultiPlot = form.listingType === 'land' && form.landPlotMode === 'multiple'
    const normalizedPlotOptions = normalizePlotOptionsForSave(form.plotOptions)

    if (!title || title.length < 3) {
      errors.title = 'Title must be at least 3 characters.'
    }
    if (!location || location.length < 2) {
      errors.location = 'Location is required.'
    }
    if (!isLandMultiPlot && !price) {
      errors.price = 'Price is required.'
    }
    if (isLandMultiPlot) {
      if (normalizedPlotOptions.length === 0) {
        errors.plotOptions = 'Add at least one plot size with a price.'
      }
      const hasIncompleteRow = form.plotOptions.some((option) => {
        const size = String(option.size || '').trim()
        const rowPrice = String(option.price || '').trim()
        return (size && !rowPrice) || (!size && rowPrice)
      })
      if (hasIncompleteRow) {
        errors.plotOptions = 'Each plot must include both size and price.'
      }
    }
    if (!Array.isArray(form.images) || form.images.length === 0) {
      errors.images = 'Upload at least one property image.'
    }

    return errors
  }

  const addFeature = () => {
    const value = featureInput.trim()
    if (!value) return

    setForm((prev) => {
      const exists = prev.features.some((item) => item.toLowerCase() === value.toLowerCase())
      if (exists) return prev
      return { ...prev, features: [...prev.features, value] }
    })
    setFeatureInput('')
  }

  const removeFeature = (feature) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.filter((item) => item !== feature),
    }))
  }

  const addLandDetail = () => {
    const value = landDetailInput.trim()
    if (!value) return

    setForm((prev) => {
      const currentDetails = parseLandDetails(prev.details)
      const exists = currentDetails.some((item) => item.toLowerCase() === value.toLowerCase())
      if (exists) return prev
      return {
        ...prev,
        details: serializeLandDetails([...currentDetails, value]),
      }
    })
    setLandDetailInput('')
  }

  const removeLandDetail = (detail) => {
    setForm((prev) => {
      const currentDetails = parseLandDetails(prev.details)
      return {
        ...prev,
        details: serializeLandDetails(currentDetails.filter((item) => item !== detail)),
      }
    })
  }

  const onFileChange = async (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    setUploadError('')
    try {
      const urls = await Promise.all(files.map((file) => uploadProjectImage(file)))
      setForm((prev) => {
        const existing = Array.isArray(prev.images) ? prev.images : []
        const deduped = [...existing, ...urls].filter((item, idx, arr) => arr.indexOf(item) === idx)
        return {
          ...prev,
          image: prev.image || deduped[0] || '',
          images: deduped,
        }
      })
    } catch (err) {
      console.error('[Upload] Supabase error:', err)
      setUploadError(toUploadErrorMessage(err))
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const onRemoveImage = (url) => {
    setForm((prev) => {
      const nextImages = prev.images.filter((item) => item !== url)
      return {
        ...prev,
        images: nextImages,
        image: nextImages[0] || '',
      }
    })
  }

  const nextId = () => {
    const max = projects.reduce((acc, item) => Math.max(acc, Number(item.id) || 0), 0)
    return String(max + 1)
  }

  const getErrorSection = (validationErrors) => {
    if (validationErrors.images) return 'media'
    if (validationErrors.title || validationErrors.location || validationErrors.price || validationErrors.plotOptions) {
      return 'basic'
    }
    return 'basic'
  }

  const onSubmit = async (event) => {
    event.preventDefault()

    const validationErrors = validateProjectForm()
    setFormErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      setActiveSection(getErrorSection(validationErrors))
      return
    }

    setSubmitting(true)
    setError('')

    try {
      let savedProject = null
      if (editingId) {
        const current = projects.find((project) => project.id === editingId)
        savedProject = toProject(form, current?.image || '', current?.images || [])
        await upsertProject(savedProject)
      } else {
        const formWithId = { ...form, id: nextId() }
        savedProject = toProject(formWithId)
        await upsertProject(savedProject)
      }

      setProjects((prev) => {
        const next = prev.some((item) => item.id === savedProject.id)
          ? prev.map((item) => (item.id === savedProject.id ? savedProject : item))
          : [savedProject, ...prev]
        return next
      })

      clearForm()
    } catch {
      setError('Failed to save property to Firebase.')
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (id) => {
    setError('')
    try {
      await deleteProject(id)
      setProjects((prev) => prev.filter((project) => project.id !== id))
      if (editingId === id) {
        clearForm()
      }
    } catch {
      setError('Failed to delete property from Firebase.')
    }
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      {/* Admin Header */}
      <header className='fixed top-0 left-0 right-0 z-50 bg-slate-900 shadow-lg'>
        <div className='max-w-7xl mx-auto px-6 h-16 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-lg bg-brand flex items-center justify-center font-bold text-white text-sm select-none'>C</div>
            <span className='font-semibold text-white text-lg tracking-tight'>Citify Admin</span>
          </div>
          <nav className='flex items-center gap-1'>
            <Link to='/admin/properties' className='px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium'>Properties</Link>
            <Link to='/admin/blog' className='px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-medium transition-colors'>Blog</Link>
            <Link to='/admin/tours' className='px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-medium transition-colors'>Inspections</Link>
            <Link to='/admin/contacts' className='px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-medium transition-colors'>Contacts</Link>
            <button onClick={onLogout} className='ml-2 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 text-sm transition-colors'>Log Out</button>
          </nav>
        </div>
      </header>

      <div className='pt-16'>
        {/* Title bar */}
        <div className='bg-white border-b border-slate-200'>
          <div className='max-w-7xl mx-auto px-6 py-6 flex items-center justify-between'>
            <div>
              <h1 className='text-xl font-bold text-slate-900'>Properties</h1>
              <p className='text-slate-500 text-sm mt-0.5'>Manage available land and property listings.</p>
            </div>
            <div className='flex items-center'>
              <span className='text-sm text-slate-500'>{sortedProjects.length} listing{sortedProjects.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <div className='max-w-7xl mx-auto px-6 py-8'>
          {error && (
            <div className='mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium'>{error}</div>
          )}

          <div className='grid grid-cols-1 xl:grid-cols-5 gap-8'>
            {/* Property list */}
            <div className='xl:col-span-3 space-y-3'>
              <div className='rounded-2xl border border-slate-200 bg-white p-4 space-y-3'>
                <div className='relative'>
                  <svg className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z' /></svg>
                  <input
                    value={listSearch}
                    onChange={(event) => setListSearch(event.target.value)}
                    placeholder='Search by property or location'
                    className='w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all'
                  />
                </div>

                <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'land', label: 'Land' },
                    { value: 'property', label: 'Houses' },
                    { value: 'shop', label: 'Commercial' },
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      type='button'
                      onClick={() => setListFilter(tab.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                        listFilter === tab.value
                          ? 'bg-brand text-white border-brand'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <p className='text-xs text-slate-500'>Showing {filteredProjects.length} loaded listing{filteredProjects.length !== 1 ? 's' : ''}</p>
              </div>

              <div className='rounded-2xl border border-slate-200 bg-white overflow-hidden'>
                <div className='hidden md:grid grid-cols-[2.2fr_1fr_1fr_auto] gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50'>
                  <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-500'>Listing</p>
                  <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-500'>Type</p>
                  <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-500'>Price</p>
                  <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-500'>Actions</p>
                </div>

                <div className='max-h-[68vh] overflow-y-auto'>
                  {loading && (
                    <div className='p-10 text-center text-slate-400 text-sm'>Loading properties...</div>
                  )}

                  {!loading && filteredProjects.length === 0 && (
                    <div className='p-10 text-center text-slate-400 text-sm'>No matching listings found.</div>
                  )}

                  {!loading && filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className={`grid grid-cols-1 md:grid-cols-[2.2fr_1fr_1fr_auto] gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0 ${
                        editingId === project.id ? 'bg-brand/5' : 'bg-white'
                      }`}
                    >
                      <div className='flex items-center gap-3 min-w-0'>
                        {(project.images?.[0] || project.image) ? (
                          <img src={project.images?.[0] || project.image} alt={project.title} className='w-12 h-12 rounded-lg object-cover shrink-0 bg-slate-100' />
                        ) : (
                          <div className='w-12 h-12 rounded-lg bg-slate-100 shrink-0' />
                        )}
                        <div className='min-w-0'>
                          <p className='text-xs font-semibold text-slate-800 truncate'>{project.title}</p>
                          <p className='text-[11px] text-slate-500 truncate'>{project.location}</p>
                          <p className='text-[10px] text-brand font-semibold'>#{project.id}</p>
                        </div>
                      </div>

                      <div className='text-xs text-slate-600 flex items-center'>{getListingTypeConfig(project.listingType).label}</div>
                      <div className='text-xs font-semibold text-slate-700 flex items-center'>{project.price}</div>

                      <div className='flex items-center gap-2 md:justify-end'>
                        <button
                          onClick={() => startEdit(project)}
                          className='px-2.5 py-1.5 rounded-lg bg-brand text-white text-[11px] font-medium hover:bg-brand-strong transition-colors'
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(project.id)}
                          className='px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 text-[11px] font-medium hover:bg-red-50 transition-colors'
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                </div>
              </div>

              {hasMoreProjects && (
                <div className='flex items-center justify-center'>
                  <button
                    type='button'
                    onClick={loadMoreProjects}
                    disabled={isLoadingMore}
                    className='px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold'
                  >
                    {isLoadingMore ? 'Loading more...' : 'Load More Properties'}
                  </button>
                </div>
              )}
            </div>

            {/* Form panel */}
            <div className='xl:col-span-2'>
              <div className='bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-20'>
                <div className='px-6 py-4 border-b border-slate-100 flex items-center justify-between'>
                  <h2 className='text-sm font-semibold text-slate-900'>
                    {editingId ? `Editing Property #${editingId}` : 'Add New Property'}
                  </h2>
                  {editingId && (
                    <span className='text-[10px] font-semibold uppercase tracking-wider text-brand bg-brand/10 px-2 py-1 rounded-full'>Editing</span>
                  )}
                </div>

                <form onSubmit={onSubmit} className='p-6 space-y-5'>
                  <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
                    {[
                      { id: 'basic', label: 'Basic' },
                      { id: 'media', label: 'Images' },
                      { id: 'details', label: 'Details' },
                      { id: 'specs', label: 'Specs' },
                    ].map((section) => (
                      <button
                        key={section.id}
                        type='button'
                        onClick={() => setActiveSection(section.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors border ${
                          activeSection === section.id
                            ? 'bg-brand text-white border-brand'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {section.label}
                      </button>
                    ))}
                  </div>

                  {activeSection === 'basic' && (
                    <div className='space-y-3'>
                      <div>
                        <label className='text-xs font-medium text-slate-600 mb-1 block'>Listing Type</label>
                        <select name='listingType' value={form.listingType} onChange={updateField} className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all'>
                          {listingTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className='text-xs font-medium text-slate-600 mb-1 block'>Title</label>
                        <input name='title' value={form.title} onChange={updateField} placeholder='e.g. Citify Heights' className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all' />
                        {formErrors.title && <p className='mt-1 text-xs text-red-600'>{formErrors.title}</p>}
                      </div>
                      <label className='inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700'>
                        <input
                          type='checkbox'
                          name='featured'
                          checked={Boolean(form.featured)}
                          onChange={updateField}
                          className='h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/20'
                        />
                        Mark as Featured Listing
                      </label>
                      <div>
                        <label className='text-xs font-medium text-slate-600 mb-1 block'>Location</label>
                        <input name='location' value={form.location} onChange={updateField} placeholder='e.g. Abuja, Nigeria' className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all' />
                        {formErrors.location && <p className='mt-1 text-xs text-red-600'>{formErrors.location}</p>}
                      </div>
                      {form.listingType === 'land' && (
                        <div>
                          <label className='text-xs font-medium text-slate-600 mb-1 block'>Land Plot Setup</label>
                          <select name='landPlotMode' value={form.landPlotMode} onChange={updateField} className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all'>
                            <option value='single'>Single Plot</option>
                            <option value='multiple'>Multiple Plots</option>
                          </select>
                        </div>
                      )}

                      {form.listingType === 'land' && form.landPlotMode === 'multiple' ? (
                        <div className='rounded-xl border border-slate-200 p-4'>
                          <div className='mb-3 flex items-center justify-between gap-3'>
                            <div>
                              <label className='text-xs font-medium text-slate-600'>Plot Options</label>
                            </div>
                            <button type='button' onClick={addPlotOptionRow} className='text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors'>Add Plot</button>
                          </div>
                          <div className='space-y-3'>
                            {form.plotOptions.map((option, index) => (
                              <div key={`plot-option-${index}`} className='rounded-2xl border border-slate-200 bg-slate-50/70 p-3'>
                                <div className='mb-3 flex items-center justify-between gap-3'>
                                  <div>
                                    <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Plot Option {index + 1}</p>
                                  </div>
                                  <button type='button' onClick={() => removePlotOptionRow(index)} className='rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors'>Remove</button>
                                </div>

                                <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                                  <div>
                                    <label className='mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500'>Plot Size</label>
                                    <input
                                      value={option.size}
                                      onChange={(event) => updatePlotOption(index, 'size', event.target.value)}
                                      placeholder='e.g. 300 sqm'
                                      className='w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all'
                                    />
                                  </div>
                                  <div>
                                    <label className='mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500'>Price</label>
                                    <input
                                      value={option.price}
                                      onChange={(event) => updatePlotOption(index, 'price', event.target.value)}
                                      placeholder='e.g. 25000000'
                                      className='w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all'
                                    />
                                  </div>
                                  <div>
                                    <label className='mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500'>Approved Development</label>
                                    <input
                                      value={option.buildingType}
                                      onChange={(event) => updatePlotOption(index, 'buildingType', event.target.value)}
                                      placeholder='building'
                                      className='w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all'
                                    />
                                  </div>
                                  <div>
                                    <label className='mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500'>Status</label>
                                    <select
                                      value={option.status || 'available'}
                                      onChange={(event) => updatePlotOption(index, 'status', event.target.value)}
                                      className='w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all'
                                    >
                                      {plotStatusOptions.map((statusOption) => (
                                        <option key={statusOption.value} value={statusOption.value}>{statusOption.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                <div className='mt-3'>
                                  <button
                                    type='button'
                                    onClick={() => setPlotOptionFeatured(index)}
                                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${option.featured ? 'border-brand/35 bg-brand/10 text-brand' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                                  >
                                    {option.featured ? 'Best Value Selected' : 'Mark as Best Value'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                          {formErrors.plotOptions && <p className='mt-1 text-xs text-red-600'>{formErrors.plotOptions}</p>}
                        </div>
                      ) : (
                        <div className='space-y-3'>
                          <div>
                            <label className='text-xs font-medium text-slate-600 mb-1 block'>Price</label>
                            <input name='price' value={form.price} onChange={updateField} placeholder='Enter your Price' className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all' />
                            {formErrors.price && <p className='mt-1 text-xs text-red-600'>{formErrors.price}</p>}
                          </div>
                          {form.listingType === 'land' && (
                            <>
                              <div>
                                <label className='text-xs font-medium text-slate-600 mb-1 block'>Building Type</label>
                                <input name='buildingType' value={form.buildingType} onChange={updateField} placeholder='building' className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all' />
                              </div>
                              <div className='grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center'>
                                <div>
                                  <label className='text-xs font-medium text-slate-600 mb-1 block'>Availability Status</label>
                                  <select name='landOptionStatus' value={form.landOptionStatus} onChange={updateField} className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all'>
                                    {plotStatusOptions.map((statusOption) => (
                                      <option key={statusOption.value} value={statusOption.value}>{statusOption.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <label className='inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 sm:mt-6'>
                                  <input
                                    type='checkbox'
                                    checked={Boolean(form.landOptionFeatured)}
                                    onChange={(event) => setForm((prev) => ({ ...prev, landOptionFeatured: event.target.checked }))}
                                    className='h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/20'
                                  />
                                  Mark as Best Value
                                </label>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {activeSection === 'media' && (
                    <div>
                      <label className='flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-5 cursor-pointer hover:border-brand hover:bg-brand/5 transition-colors'>
                        <svg className='w-6 h-6 text-slate-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' /></svg>
                        <span className='text-xs text-slate-500 font-medium'>{uploading ? 'Uploading...' : 'Click to upload images'}</span>
                        <input type='file' accept='image/*' multiple onChange={onFileChange} disabled={uploading} className='hidden' />
                      </label>
                      {uploadError && <p className='mt-2 text-xs text-red-600'>{uploadError}</p>}
                      {formErrors.images && <p className='mt-2 text-xs text-red-600'>{formErrors.images}</p>}
                      {!uploading && form.images.length > 0 && (
                        <div className='mt-3 grid grid-cols-3 gap-2'>
                          {form.images.map((img, idx) => (
                            <div key={`preview-${idx}`} className='relative group rounded-xl overflow-hidden aspect-square'>
                              <img src={img} alt={`preview ${idx + 1}`} className='h-full w-full object-cover' />
                              {idx === 0 && (
                                <span className='absolute top-1 left-1 text-[9px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded-md bg-brand text-white'>Cover</span>
                              )}
                              <button
                                type='button'
                                onClick={() => onRemoveImage(img)}
                                className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity'
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeSection === 'details' && (
                    <div className='space-y-4'>
                      {form.listingType !== 'land' && (
                        <div>
                          <label className='text-xs font-medium text-slate-600 mb-1 block'>Short description</label>
                          <input name='description' value={form.description} onChange={updateField} placeholder='Brief tagline or summary' className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all' />
                        </div>
                      )}

                      {form.listingType === 'land' ? (
                        <div>
                          <label className='text-xs font-medium text-slate-600 mb-1 block'>Property Details</label>
                          <div className='flex gap-2'>
                            <input
                              value={landDetailInput}
                              onChange={(event) => setLandDetailInput(event.target.value)}
                              onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addLandDetail() } }}
                              placeholder='Details'
                              className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all'
                            />
                            <button type='button' onClick={addLandDetail} className='px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm shrink-0 transition-colors'>Add</button>
                          </div>
                          {parseLandDetails(form.details).length > 0 && (
                            <div className='mt-3 flex flex-wrap gap-1.5'>
                              {parseLandDetails(form.details).map((detail) => (
                                <span key={detail} className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-medium border border-brand/20'>
                                  {detail}
                                  <button type='button' onClick={() => removeLandDetail(detail)} className='hover:text-brand-strong text-base leading-none mt-px'>×</button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <label className='text-xs font-medium text-slate-600 mb-1 block'>Full details</label>
                          <textarea name='details' value={form.details} onChange={updateField} placeholder='Detailed description...' rows={5} className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 resize-none transition-all' />
                        </div>
                      )}

                      {form.listingType !== 'land' && (
                        <div>
                          <label className='text-xs font-medium text-slate-600 mb-1 block'>Features</label>
                          <div className='flex gap-2'>
                            <input
                              value={featureInput}
                              onChange={(event) => setFeatureInput(event.target.value)}
                              onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addFeature() } }}
                              placeholder='Add feature, press Enter'
                              className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all'
                            />
                            <button type='button' onClick={addFeature} className='px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm shrink-0 transition-colors'>Add</button>
                          </div>
                          {form.features.length > 0 && (
                            <div className='mt-3 flex flex-wrap gap-1.5'>
                              {form.features.map((feature) => (
                                <span key={feature} className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-medium border border-brand/20'>
                                  {feature}
                                  <button type='button' onClick={() => removeFeature(feature)} className='hover:text-brand-strong text-base leading-none mt-px'>×</button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {activeSection === 'specs' && (
                    <div className='space-y-4'>
                      <div className='grid grid-cols-2 gap-3'>
                        <div>
                          <label className='text-xs font-medium text-slate-600 mb-1 block'>{listingConfig.specificationLabels.area}</label>
                          <input name='area' value={form.area} onChange={updateField} placeholder={listingConfig.specificationPlaceholders.area} className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all' />
                        </div>
                        {form.listingType !== 'shop' && (
                          <div>
                            <label className='text-xs font-medium text-slate-600 mb-1 block'>{listingConfig.specificationLabels.units}</label>
                            <input name='units' value={form.units} onChange={updateField} placeholder={listingConfig.specificationPlaceholders.units} className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all' />
                          </div>
                        )}
                        <div>
                          <label className='text-xs font-medium text-slate-600 mb-1 block'>{listingConfig.specificationLabels.floors}</label>
                          {(form.listingType === 'shop' || form.listingType === 'land') ? (
                            <select name='floors' value={form.floors} onChange={updateField} className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all'>
                              <option value=''>Select payment plan</option>
                              <option value='Available'>Available</option>
                              <option value='Unavailable'>Unavailable</option>
                            </select>
                          ) : (
                            <input name='floors' value={form.floors} onChange={updateField} placeholder={listingConfig.specificationPlaceholders.floors} className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all' />
                          )}
                        </div>
                        {form.listingType === 'land' && (
                          <div>
                            <label className='text-xs font-medium text-slate-600 mb-1 block'>{listingConfig.specificationLabels.parking}</label>
                            <input name='parking' value={form.parking} onChange={updateField} placeholder={listingConfig.specificationPlaceholders.parking} className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all' />
                          </div>
                        )}
                      </div>

                      {form.listingType === 'property' && (
                        <div>
                          <label className='text-xs font-medium text-slate-600 mb-1 block'>Payment Plan Availability</label>
                          <select name='paymentPlan' value={form.paymentPlan} onChange={updateField} className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all'>
                            <option value=''>Select option</option>
                            <option value='Available'>Available</option>
                            <option value='Unavailable'>Unavailable</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  <div className='flex gap-3 pt-2 border-t border-slate-100'>
                    <button
                      type='submit'
                      disabled={submitting}
                      className='flex-1 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-strong disabled:opacity-60 transition-colors'
                    >
                      {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Add Property'}
                    </button>
                    <button type='button' onClick={clearForm} className='px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors'>Clear</button>
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

export default AdminProjectsPage
