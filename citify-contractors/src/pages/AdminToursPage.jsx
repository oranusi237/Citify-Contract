import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { deleteTourRequest, subscribeToTours, updateTourStatus } from '../utils/toursStore'

const statusOptions = ['new', 'contacted', 'scheduled', 'closed']
const TOURS_PER_PAGE = 10
const statusLabelMap = {
  new: 'New',
  contacted: 'Contact',
  scheduled: 'Schedule',
  closed: 'Close',
}

const formatReadableDate = (value) => {
  if (!value) return 'N/A'

  let parsedDate = null

  if (value instanceof Date) {
    parsedDate = value
  } else if (typeof value?.toDate === 'function') {
    parsedDate = value.toDate()
  } else if (typeof value === 'number') {
    parsedDate = new Date(value)
  } else if (typeof value === 'string') {
    const trimmed = value.trim()
    const asDate = new Date(trimmed)
    if (!Number.isNaN(asDate.getTime())) {
      parsedDate = asDate
    } else {
      return value
    }
  }

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate)
}

const normalizeTourTypeKey = (tourType) => {
  const raw = String(tourType || '').trim().toLowerCase().replace(/\s+/g, '_')
  if (raw === 'video_chat' || raw === 'video-chat') return 'video'
  if (raw === 'virtual') return 'video'
  if (raw === 'in-person' || raw === 'in_person') return 'in_person'
  return raw
}

const parseTourDate = (value) => {
  if (!value) return null

  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value?.toDate === 'function') {
    const converted = value.toDate()
    return Number.isNaN(converted.getTime()) ? null : converted
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const getTourOrderValue = (tour) => {
  const createdAt = tour?.createdAt

  if (createdAt instanceof Date) return Number.isNaN(createdAt.getTime()) ? 0 : createdAt.getTime()
  if (typeof createdAt?.toDate === 'function') {
    const converted = createdAt.toDate()
    return Number.isNaN(converted.getTime()) ? 0 : converted.getTime()
  }
  if (typeof createdAt?.seconds === 'number') return createdAt.seconds * 1000
  if (typeof createdAt === 'number') return createdAt
  if (typeof createdAt === 'string') {
    const parsedCreatedAt = new Date(createdAt)
    if (!Number.isNaN(parsedCreatedAt.getTime())) return parsedCreatedAt.getTime()
  }

  const fallbackTourDate = parseTourDate(tour?.date)
  return fallbackTourDate ? fallbackTourDate.getTime() : 0
}

const AdminToursPage = () => {
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTour, setSelectedTour] = useState(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = subscribeToTours(
      (data) => {
        setTours(data)
        setLoading(false)
      },
      () => {
        setError('Unable to load inspection requests.')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const onChangeStatus = async (id, status) => {
    try {
      await updateTourStatus(id, status)
      setSelectedTour((prev) => (prev && prev.id === id ? { ...prev, status } : prev))
    } catch {
      setError('Failed to update status.')
    }
  }

  const onDeleteTour = async (tour) => {
    if (!tour?.id) return

    try {
      await deleteTourRequest(tour.id)
      setIsPanelOpen(false)
      setSelectedTour(null)
      setIsDeleteConfirmVisible(false)
    } catch {
      setError('Failed to delete inspection request.')
    }
  }

  const onLogout = async () => {
    await signOut(auth)
    navigate('/admin/login')
  }

  const statusStyles = {
    new: 'bg-[#058F44]/10 text-[#058F44] border-[#058F44]/20',
    contacted: 'bg-amber-50 text-amber-700 border-amber-200',
    scheduled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    closed: 'bg-slate-100 text-slate-500 border-slate-200',
  }

  const rowToneStyles = {
    new: 'border-l-[#058F44]/50 bg-[#058F44]/[0.02]',
    contacted: 'border-l-amber-300/70 bg-amber-50/35',
    scheduled: 'border-l-emerald-300/70 bg-emerald-50/35',
    closed: 'border-l-slate-200 bg-slate-50/40',
  }

  const statusDotStyles = {
    new: 'bg-[#058F44]/80',
    contacted: 'bg-amber-400/80',
    scheduled: 'bg-emerald-400/80',
    closed: 'bg-slate-300',
  }

  const statusActionMap = {
    new: {
      nextStatus: 'contacted',
      label: 'Contact',
      className: 'border-amber-200 text-amber-700 hover:bg-amber-50',
    },
    contacted: {
      nextStatus: 'scheduled',
      label: 'Schedule',
      className: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
    },
    scheduled: {
      nextStatus: 'closed',
      label: 'Close',
      className: 'border-slate-300 text-slate-600 hover:bg-slate-100',
    },
  }

  const typeStyles = {
    in_person: 'bg-sky-50 text-sky-700 border-sky-200',
    'in-person': 'bg-sky-50 text-sky-700 border-sky-200',
    video: 'bg-violet-50 text-violet-700 border-violet-200',
  }

  const getTypeMeta = (tourType) => {
    const raw = String(tourType || '').trim().toLowerCase()
    const normalized = raw.replace(/\s+/g, '_')
    const labelMap = {
      video: 'Video-Chat',
      video_chat: 'Video-Chat',
      'video-chat': 'Video-Chat',
      virtual: 'Video-Chat',
      in_person: 'In-Person',
      'in-person': 'In-Person',
    }
    const label = labelMap[normalized] || (raw
      ? raw
          .replace(/[_-]+/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase())
      : 'General')

    return {
      label,
      className: typeStyles[normalized] || typeStyles[raw] || 'bg-slate-100 text-slate-600 border-slate-200',
    }
  }

  const filteredTours = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const filtered = tours.filter((tour) => {
      const matchesStatus = statusFilter === 'all' ? true : tour.status === statusFilter
      if (!matchesStatus) return false

      const normalizedType = normalizeTourTypeKey(tour.tourType)
      const matchesType = typeFilter === 'all' ? true : normalizedType === typeFilter
      if (!matchesType) return false

      const parsedTourDate = parseTourDate(tour.date)
      const tourStart = parsedTourDate
        ? new Date(parsedTourDate.getFullYear(), parsedTourDate.getMonth(), parsedTourDate.getDate())
        : null

      const matchesDate = dateFilter === 'all'
        ? true
        : dateFilter === 'today'
          ? !!tourStart && tourStart.getTime() === todayStart.getTime()
          : !!tourStart && tourStart.getTime() > todayStart.getTime()
      if (!matchesDate) return false

      if (!query) return true
      const haystack = `${tour.projectTitle || ''} ${tour.name || ''}`.toLowerCase()
      return haystack.includes(query)
    })

    return filtered.sort((a, b) => getTourOrderValue(b) - getTourOrderValue(a))
  }, [tours, searchQuery, statusFilter, typeFilter, dateFilter])

  const totalPages = Math.max(1, Math.ceil(filteredTours.length / TOURS_PER_PAGE))

  const paginatedTours = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages)
    const startIndex = (safePage - 1) * TOURS_PER_PAGE
    return filteredTours.slice(startIndex, startIndex + TOURS_PER_PAGE)
  }, [filteredTours, currentPage, totalPages])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, typeFilter, dateFilter])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const openDetailsPanel = (tour) => {
    setSelectedTour(tour)
    setIsDeleteConfirmVisible(false)
    setIsPanelOpen(true)
  }

  const closeDetailsPanel = () => {
    setIsPanelOpen(false)
    setIsDeleteConfirmVisible(false)
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      {/* Admin Header */}
      <header className='fixed top-0 left-0 right-0 z-50 bg-slate-900 shadow-lg'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 py-3 md:py-0 md:h-16 flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-lg bg-[#058F44] flex items-center justify-center font-bold text-white text-sm select-none'>C</div>
            <span className='font-semibold text-white text-lg tracking-tight'>Citify Admin</span>
          </div>
          <nav className='w-full md:w-auto flex items-center gap-1 overflow-x-auto pb-1 md:pb-0'>
            <Link to='/admin/properties' className='px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-medium transition-colors whitespace-nowrap'>Properties</Link>
            <Link to='/admin/tours' className='px-3 py-2 rounded-lg bg-[#058F44] text-white text-sm font-medium whitespace-nowrap'>Inspections</Link>
            <button onClick={onLogout} className='ml-auto md:ml-2 px-3 py-2 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 text-sm transition-colors whitespace-nowrap'>Log Out</button>
          </nav>
        </div>
      </header>

      <div className='pt-28 md:pt-16'>
        {/* Page title bar */}
        <div className='bg-white border-b border-slate-200'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 py-5 md:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div>
              <h1 className='text-xl font-bold text-slate-900'>Inspection Requests</h1>
              <p className='text-slate-500 text-sm mt-0.5'>Manage all in-person and video inspection inquiries.</p>
            </div>
            {!loading && (
              <div className='grid grid-cols-4 gap-2 md:flex md:gap-3 w-full md:w-auto'>
                {statusOptions.map((s) => (
                  <div key={s} className='text-center rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 md:border-0 md:bg-transparent md:px-0 md:py-0'>
                    <p className='text-base md:text-lg font-bold text-slate-800 leading-none'>{tours.filter((t) => t.status === s).length}</p>
                    <p className='text-[10px] font-semibold text-slate-400 uppercase tracking-wider'>{s}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8'>
          {error && (
            <div className='mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium'>{error}</div>
          )}

          {loading && (
            <div className='rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400 text-sm'>Loading inspection requests...</div>
          )}

          {!loading && tours.length === 0 && (
            <div className='rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400 text-sm'>No inspection requests yet.</div>
          )}

          {!loading && tours.length > 0 && (
            <div className='space-y-4'>
              <div className='rounded-2xl border border-slate-200 bg-white p-3 md:p-4 space-y-3'>
                <div className='grid gap-2 md:gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]'>
                  <div className='relative'>
                    <svg className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z' /></svg>
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder='Search by property or name'
                      className='w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#058F44] focus:ring-2 focus:ring-[#058F44]/10 transition-all'
                    />
                  </div>

                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                    className='w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#058F44] focus:ring-2 focus:ring-[#058F44]/10 transition-all cursor-pointer'
                  >
                    <option value='all'>All Types</option>
                    <option value='in_person'>In-Person</option>
                    <option value='video'>Video-Chat</option>
                  </select>

                  <select
                    value={dateFilter}
                    onChange={(event) => setDateFilter(event.target.value)}
                    className='w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#058F44] focus:ring-2 focus:ring-[#058F44]/10 transition-all cursor-pointer'
                  >
                    <option value='all'>All Dates</option>
                    <option value='today'>Today</option>
                    <option value='upcoming'>Upcoming</option>
                  </select>
                </div>

                <div className='flex md:grid md:grid-cols-5 gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0'>
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'new', label: 'New' },
                    { value: 'contacted', label: 'Contacted' },
                    { value: 'scheduled', label: 'Scheduled' },
                    { value: 'closed', label: 'Closed' },
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      type='button'
                      onClick={() => setStatusFilter(tab.value)}
                      className={`shrink-0 md:shrink px-3 py-2 rounded-xl text-xs font-semibold border whitespace-nowrap transition-colors ${
                        statusFilter === tab.value
                          ? 'bg-[#058F44] text-white border-[#058F44]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <p className='text-xs text-slate-500'>Showing {paginatedTours.length} of {filteredTours.length} request{filteredTours.length !== 1 ? 's' : ''}</p>
              </div>

              <div className='rounded-2xl border border-slate-200 bg-white overflow-hidden'>
                <div className='hidden md:grid grid-cols-[1.1fr_1.5fr_1fr_0.9fr_0.9fr_1.6fr] gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50'>
                  <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-500'>Name</p>
                  <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-500'>Property</p>
                  <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-500'>Date</p>
                  <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-500'>Type</p>
                  <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-500'>Status</p>
                  <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-500'>Actions</p>
                </div>

                <div className='max-h-none md:max-h-[68vh] overflow-y-visible md:overflow-y-auto'>
                  {filteredTours.length === 0 && (
                    <div className='p-10 text-center text-slate-400 text-sm'>No matching inspection requests.</div>
                  )}

                  {paginatedTours.map((tour) => {
                    const typeMeta = getTypeMeta(tour.tourType)
                    const quickAction = statusActionMap[tour.status]
                    const rowToneClass = rowToneStyles[tour.status] || rowToneStyles.closed
                    const statusDotClass = statusDotStyles[tour.status] || statusDotStyles.closed

                    return (
                      <React.Fragment key={tour.id}>
                        <div
                          onClick={() => openDetailsPanel(tour)}
                          className={`md:hidden border-b border-l-2 border-slate-100 last:border-b-0 px-3 py-3 cursor-pointer transition-colors ${rowToneClass}`}
                        >
                          <div className='flex items-start justify-between gap-3'>
                            <div className='min-w-0'>
                              <p className='font-semibold text-sm text-slate-800 flex items-center gap-2'>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass}`} />
                                <span className='truncate'>{tour.name}</span>
                              </p>
                              <p className='text-xs text-slate-500 truncate mt-0.5'>{tour.phone}</p>
                            </div>
                            <span className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${statusStyles[tour.status] || statusStyles.closed}`}>
                              {tour.status}
                            </span>
                          </div>

                          <div className='mt-2 space-y-1'>
                            <p className='text-xs font-semibold text-slate-800 truncate'>{tour.projectTitle || 'Unknown Project'}</p>
                            <p className='text-xs text-slate-500 truncate'>{tour.projectLocation}</p>
                            <div className='flex items-center gap-2 text-xs text-slate-600'>
                              <span>{formatReadableDate(tour.date)}</span>
                              <span className='text-slate-300'>•</span>
                              <span>{tour.time || 'N/A'}</span>
                              <span className={`ml-auto text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${typeMeta.className}`}>
                                {typeMeta.label}
                              </span>
                            </div>
                          </div>

                          <div className='mt-3'>
                            {quickAction ? (
                              <button
                                type='button'
                                onClick={(event) => {
                                  event.stopPropagation()
                                  onChangeStatus(tour.id, quickAction.nextStatus)
                                }}
                                className={`w-full px-2.5 py-2 rounded-lg border text-xs font-semibold transition-colors ${quickAction.className}`}
                              >
                                {quickAction.label}
                              </button>
                            ) : (
                              <p className='text-xs font-medium text-slate-400'>No quick action</p>
                            )}
                          </div>
                        </div>

                        <div
                          onClick={() => openDetailsPanel(tour)}
                          className={`hidden md:grid grid-cols-[1.1fr_1.5fr_1fr_0.9fr_0.9fr_1.6fr] gap-3 px-4 py-3 border-b border-l-2 border-slate-100 last:border-b-0 hover:bg-slate-50/80 cursor-pointer transition-colors ${rowToneClass}`}
                        >
                          <div className='text-xs text-slate-600'>
                            <p className='font-semibold text-slate-800 flex items-center gap-2'>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass}`} />
                              {tour.name}
                            </p>
                            <p className='truncate'>{tour.phone}</p>
                          </div>

                          <div className='text-xs text-slate-600'>
                            <p className='font-semibold text-slate-800 truncate'>{tour.projectTitle || 'Unknown Project'}</p>
                            <p className='truncate'>{tour.projectLocation}</p>
                          </div>

                          <div className='text-xs text-slate-600'>
                            <p>{formatReadableDate(tour.date)}</p>
                            <p className='font-medium text-slate-700'>{tour.time}</p>
                          </div>

                          <div className='flex items-center'>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${typeMeta.className}`}>
                              {typeMeta.label}
                            </span>
                          </div>

                          <div className='flex items-center'>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${statusStyles[tour.status] || statusStyles.closed}`}>
                              {tour.status}
                            </span>
                          </div>

                          <div className='flex flex-wrap items-center gap-1.5'>
                            {quickAction ? (
                              <button
                                type='button'
                                onClick={(event) => {
                                  event.stopPropagation()
                                  onChangeStatus(tour.id, quickAction.nextStatus)
                                }}
                                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${quickAction.className}`}
                              >
                                {quickAction.label}
                              </button>
                            ) : (
                              <span className='text-[11px] font-medium text-slate-400'>No quick action</span>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    )
                  })}
                </div>

                {filteredTours.length > 0 && (
                  <div className='flex items-center justify-between gap-3 px-3 md:px-4 py-3 border-t border-slate-100 bg-white'>
                    <p className='text-xs text-slate-500'>Page {currentPage} of {totalPages}</p>
                    <div className='flex items-center gap-2'>
                      <button
                        type='button'
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className='px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                      >
                        Previous
                      </button>
                      <button
                        type='button'
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className='px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details panel */}
      <div className={`fixed inset-0 z-70 transition-all duration-300 ${isPanelOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-slate-900/40 transition-opacity duration-300 ${isPanelOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeDetailsPanel}
        />
        <aside className={`absolute inset-x-0 bottom-0 h-[88vh] w-full bg-white shadow-2xl border-t border-slate-200 rounded-t-3xl transition-transform duration-300 ${isPanelOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full'} md:inset-y-0 md:left-auto md:right-0 md:h-full md:max-w-md md:rounded-none md:border-t-0 md:border-l`}>
          <div className='md:hidden pt-2 pb-1'>
            <div className='w-10 h-1 rounded-full bg-slate-300 mx-auto' />
          </div>

          <div className='px-4 md:px-5 py-3 md:py-4 border-b border-slate-100 flex items-center justify-between'>
            <h2 className='text-sm font-semibold text-slate-900'>Inspection Details</h2>
            <button
              type='button'
              onClick={closeDetailsPanel}
              className='w-9 h-9 md:w-8 md:h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors'
            >
              ×
            </button>
          </div>

          {selectedTour ? (
            <div className='p-4 md:p-5 pb-8 space-y-4 overflow-y-auto h-[calc(100%-4.5rem)] md:h-[calc(100%-4rem)]'>
              {(() => {
                const typeMeta = getTypeMeta(selectedTour.tourType)

                return (
                  <>
              <div>
                <p className='text-[10px] font-semibold uppercase tracking-wider text-slate-400'>Name</p>
                <p className='text-sm font-semibold text-slate-900 mt-1'>{selectedTour.name}</p>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <p className='text-[10px] font-semibold uppercase tracking-wider text-slate-400'>Phone</p>
                  <p className='text-sm text-slate-700 mt-1'>{selectedTour.phone}</p>
                </div>
                <div>
                  <p className='text-[10px] font-semibold uppercase tracking-wider text-slate-400'>Email</p>
                  <p className='text-sm text-slate-700 mt-1 break-all'>{selectedTour.email}</p>
                </div>
              </div>

              <div>
                <p className='text-[10px] font-semibold uppercase tracking-wider text-slate-400'>Property</p>
                <p className='text-sm font-semibold text-slate-900 mt-1'>{selectedTour.projectTitle || 'Unknown Project'}</p>
                <p className='text-xs text-slate-500 mt-1'>{selectedTour.projectLocation}</p>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <p className='text-[10px] font-semibold uppercase tracking-wider text-slate-400'>Date</p>
                  <p className='text-sm text-slate-700 mt-1'>{formatReadableDate(selectedTour.date)}</p>
                </div>
                <div>
                  <p className='text-[10px] font-semibold uppercase tracking-wider text-slate-400'>Time</p>
                  <p className='text-sm text-slate-700 mt-1'>{selectedTour.time}</p>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <p className='text-[10px] font-semibold uppercase tracking-wider text-slate-400'>Type</p>
                  <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${typeMeta.className}`}>
                    {typeMeta.label}
                  </span>
                </div>
                <div>
                  <p className='text-[10px] font-semibold uppercase tracking-wider text-slate-400'>Status</p>
                  <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${statusStyles[selectedTour.status] || statusStyles.closed}`}>
                    {selectedTour.status}
                  </span>
                </div>
              </div>

              {selectedTour.message && (
                <div>
                  <p className='text-[10px] font-semibold uppercase tracking-wider text-slate-400'>Message</p>
                  <p className='text-sm text-slate-700 mt-1 p-3 rounded-xl border border-slate-200 bg-slate-50'>"{selectedTour.message}"</p>
                </div>
              )}

              <div>
                <label className='text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-2'>Update Status</label>
                <select
                  value={selectedTour.status}
                  onChange={(event) => onChangeStatus(selectedTour.id, event.target.value)}
                  className='w-full rounded-xl border border-slate-200 px-3 py-2 bg-white text-sm text-slate-700 focus:outline-none focus:border-[#058F44] focus:ring-2 focus:ring-[#058F44]/10 transition-all cursor-pointer'
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{statusLabelMap[status] || status}</option>
                  ))}
                </select>
              </div>

              <div className='pt-2 border-t border-slate-100'>
                {!isDeleteConfirmVisible ? (
                  <button
                    type='button'
                    onClick={() => setIsDeleteConfirmVisible(true)}
                    className='w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors'
                  >
                    Delete Inspection Request
                  </button>
                ) : (
                  <div className='rounded-xl border border-red-200 bg-red-50 p-3 space-y-3'>
                    <p className='text-xs font-medium text-red-700'>Delete this inspection request permanently?</p>
                    <div className='grid grid-cols-2 gap-2'>
                      <button
                        type='button'
                        onClick={() => setIsDeleteConfirmVisible(false)}
                        className='rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors'
                      >
                        Cancel
                      </button>
                      <button
                        type='button'
                        onClick={() => onDeleteTour(selectedTour)}
                        className='rounded-lg border border-red-300 bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors'
                      >
                        Yes, Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
                  </>
                )
              })()}
            </div>
          ) : (
            <div className='p-6 text-sm text-slate-500'>Select an inspection to view details.</div>
          )}
        </aside>
      </div>
    </div>
  )
}

export default AdminToursPage
