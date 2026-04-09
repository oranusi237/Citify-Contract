import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase'
import { deleteContactRequest, fetchContactRequestsPage, updateContactStatus } from './contactStore'

const statusOptions = ['new', 'contacted', 'closed']
const CONTACTS_BATCH_SIZE = 50

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
    const asDate = new Date(value)
    if (!Number.isNaN(asDate.getTime())) {
      parsedDate = asDate
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

const getCreatedAtMs = (value) => {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  if (typeof value?.toDate === 'function') return value.toDate().getTime()
  if (typeof value?.seconds === 'number') return value.seconds * 1000
  if (typeof value === 'number') return value
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
}

const AdminContactsPage = () => {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedContact, setSelectedContact] = useState(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false)
  const [contactsCursor, setContactsCursor] = useState(null)
  const [hasMoreContacts, setHasMoreContacts] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const loadInitialContacts = async () => {
      setLoading(true)
      setError('')

      try {
        const { contacts: firstPage, cursor, hasMore } = await fetchContactRequestsPage({
          pageSize: CONTACTS_BATCH_SIZE,
        })
        setContacts(firstPage)
        setContactsCursor(cursor)
        setHasMoreContacts(hasMore)
      } catch {
        setError('Unable to load contact requests.')
      } finally {
        setLoading(false)
      }
    }

    loadInitialContacts()
  }, [])

  const loadMoreContacts = async () => {
    if (isLoadingMore || !hasMoreContacts || !contactsCursor) return

    setIsLoadingMore(true)
    try {
      const { contacts: nextPage, cursor, hasMore } = await fetchContactRequestsPage({
        pageSize: CONTACTS_BATCH_SIZE,
        cursor: contactsCursor,
      })

      setContacts((prev) => {
        const merged = [...prev, ...nextPage]
        const seen = new Set()
        return merged.filter((item) => {
          if (seen.has(item.id)) return false
          seen.add(item.id)
          return true
        })
      })
      setContactsCursor(cursor)
      setHasMoreContacts(hasMore)
    } catch {
      setError('Unable to load more contact requests.')
    } finally {
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    if (!selectedContact?.id) return

    const latest = contacts.find((contact) => contact.id === selectedContact.id)
    if (!latest) {
      setSelectedContact(null)
      setIsPanelOpen(false)
      setIsDeleteConfirmVisible(false)
      return
    }

    setSelectedContact((prev) => {
      if (!prev || prev.id !== latest.id) return prev
      return latest
    })
  }, [contacts, selectedContact?.id])

  const onLogout = async () => {
    await signOut(auth)
    navigate('/admin/login')
  }

  const onChangeStatus = async (id, status) => {
    try {
      await updateContactStatus(id, status)
      setContacts((prev) => prev.map((contact) => (
        contact.id === id ? { ...contact, status } : contact
      )))
      setSelectedContact((prev) => (prev && prev.id === id ? { ...prev, status } : prev))
    } catch {
      setError('Failed to update contact status.')
    }
  }

  const onDeleteContact = async (contact) => {
    if (!contact?.id) return

    try {
      await deleteContactRequest(contact.id)
      setContacts((prev) => prev.filter((item) => item.id !== contact.id))
      setIsDeleteConfirmVisible(false)
      setIsPanelOpen(false)
      setSelectedContact(null)
    } catch {
      setError('Failed to delete contact request.')
    }
  }

  const statusStyles = {
    new: 'bg-brand/10 text-brand border-brand/20',
    contacted: 'bg-amber-50 text-amber-700 border-amber-200',
    closed: 'bg-slate-100 text-slate-500 border-slate-200',
  }

  const rowToneStyles = {
    new: 'border-l-brand/50 bg-brand/[0.02]',
    contacted: 'border-l-amber-300/70 bg-amber-50/35',
    closed: 'border-l-slate-200 bg-slate-50/40',
  }

  const statusActionMap = {
    new: {
      nextStatus: 'contacted',
      label: 'Mark Contacted',
      className: 'border-amber-200 text-amber-700 hover:bg-amber-50',
    },
    contacted: {
      nextStatus: 'closed',
      label: 'Close',
      className: 'border-slate-300 text-slate-600 hover:bg-slate-100',
    },
  }

  const filteredContacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const list = contacts.filter((contact) => {
      const matchesStatus = statusFilter === 'all' ? true : contact.status === statusFilter
      if (!matchesStatus) return false

      if (!query) return true
      const haystack = `${contact.name || ''} ${contact.email || ''} ${contact.mobile || ''} ${contact.subject || ''} ${contact.message || ''}`.toLowerCase()
      return haystack.includes(query)
    })

    return list.sort((a, b) => getCreatedAtMs(b.createdAt) - getCreatedAtMs(a.createdAt))
  }, [contacts, searchQuery, statusFilter])

  const openDetailsPanel = (contact) => {
    setSelectedContact(contact)
    setIsDeleteConfirmVisible(false)
    setIsPanelOpen(true)
  }

  const closeDetailsPanel = () => {
    setIsPanelOpen(false)
    setIsDeleteConfirmVisible(false)
  }

  const onRowKeyDown = (event, contact) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openDetailsPanel(contact)
    }
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      <header className='fixed top-0 left-0 right-0 z-50 bg-slate-900 shadow-lg'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 py-3 md:py-0 md:h-16 flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-lg bg-brand flex items-center justify-center font-bold text-white text-sm select-none'>C</div>
            <span className='font-semibold text-white text-lg tracking-tight'>Citify Admin</span>
          </div>
          <nav className='w-full md:w-auto flex items-center gap-1 overflow-x-auto pb-1 md:pb-0'>
            <Link to='/admin/properties' className='px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-medium transition-colors whitespace-nowrap'>Properties</Link>
            <Link to='/admin/blog' className='px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-medium transition-colors whitespace-nowrap'>Blog</Link>
            <Link to='/admin/tours' className='px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-medium transition-colors whitespace-nowrap'>Inspections</Link>
            <Link to='/admin/contacts' className='px-3 py-2 rounded-lg bg-brand text-white text-sm font-medium whitespace-nowrap'>Contacts</Link>
            <button onClick={onLogout} className='ml-auto md:ml-2 px-3 py-2 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 text-sm transition-colors whitespace-nowrap'>Log Out</button>
          </nav>
        </div>
      </header>

      <div className='pt-28 md:pt-16'>
        <div className='bg-white border-b border-slate-200'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 py-5 md:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div>
              <h1 className='text-xl font-bold text-slate-900'>Contact Requests</h1>
              <p className='text-slate-500 text-sm mt-0.5'>Review and manage website contact form submissions.</p>
            </div>
            {!loading && (
              <div className='grid grid-cols-3 gap-2 md:flex md:gap-3 w-full md:w-auto'>
                {statusOptions.map((status) => (
                  <div key={status} className='text-center rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 md:border-0 md:bg-transparent md:px-0 md:py-0'>
                    <p className='text-base md:text-lg font-bold text-slate-800 leading-none'>{contacts.filter((item) => item.status === status).length}</p>
                    <p className='text-[10px] font-semibold text-slate-400 uppercase tracking-wider'>{status}</p>
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
            <div className='rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400 text-sm'>Loading contact requests...</div>
          )}

          {!loading && contacts.length === 0 && (
            <div className='rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400 text-sm'>No contact requests yet.</div>
          )}

          {!loading && contacts.length > 0 && (
            <div className='space-y-4'>
              <div className='rounded-2xl border border-slate-200 bg-white p-3 md:p-4 space-y-3'>
                <div className='grid gap-2 md:gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
                  <div className='relative'>
                    <svg className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z' /></svg>
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder='Search by name, email, subject, or message'
                      className='w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all'
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className='w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all cursor-pointer'
                  >
                    <option value='all'>All Status</option>
                    <option value='new'>New</option>
                    <option value='contacted'>Contacted</option>
                    <option value='closed'>Closed</option>
                  </select>
                </div>

                <p className='text-xs text-slate-500'>Showing {filteredContacts.length} loaded request{filteredContacts.length !== 1 ? 's' : ''}</p>
              </div>

              <div className='rounded-2xl border border-slate-200 bg-white overflow-hidden'>
                <div className='hidden md:grid grid-cols-[1.1fr_1.2fr_1fr_1.8fr_0.8fr_1.2fr] gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50'>
                  <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-500'>Name</p>
                  <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-500'>Email</p>
                  <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-500'>Subject</p>
                  <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-500'>Message</p>
                  <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-500'>Status</p>
                  <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-500'>Actions</p>
                </div>

                <div className='max-h-none md:max-h-[68vh] overflow-y-visible md:overflow-y-auto'>
                  {filteredContacts.length === 0 && (
                    <div className='p-10 text-center text-slate-400 text-sm'>No matching contact requests.</div>
                  )}

                  {filteredContacts.map((contact) => {
                    const statusClass = statusStyles[contact.status] || statusStyles.closed
                    const rowToneClass = rowToneStyles[contact.status] || rowToneStyles.closed
                    const quickAction = statusActionMap[contact.status]

                    return (
                      <React.Fragment key={contact.id}>
                        <div
                          onClick={() => openDetailsPanel(contact)}
                          onKeyDown={(event) => onRowKeyDown(event, contact)}
                          role='button'
                          tabIndex={0}
                          aria-label={`Open contact request from ${contact.name || 'Unknown'}`}
                          className={`md:hidden border-b border-l-2 border-slate-100 last:border-b-0 px-3 py-3 cursor-pointer transition-colors ${rowToneClass}`}
                        >
                          <div className='flex items-start justify-between gap-3'>
                            <div className='min-w-0'>
                              <p className='font-semibold text-sm text-slate-800 truncate'>{contact.name || 'Unknown'}</p>
                              <p className='text-xs text-slate-500 truncate mt-0.5'>{contact.email || 'N/A'}</p>
                            </div>
                            <span className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${statusClass}`}>
                              {contact.status}
                            </span>
                          </div>
                          <p className='mt-2 text-xs text-slate-600 line-clamp-2'>{contact.message || 'No message provided.'}</p>
                          {contact.subject && <p className='mt-1 text-[11px] text-slate-500'>Subject: {contact.subject}</p>}
                          <p className='mt-2 text-[11px] text-slate-400'>{formatReadableDate(contact.createdAt)}</p>
                        </div>

                        <div
                          onClick={() => openDetailsPanel(contact)}
                          onKeyDown={(event) => onRowKeyDown(event, contact)}
                          role='button'
                          tabIndex={0}
                          aria-label={`Open contact request from ${contact.name || 'Unknown'}`}
                          className={`hidden md:grid grid-cols-[1.1fr_1.2fr_1fr_1.8fr_0.8fr_1.2fr] gap-3 px-4 py-3 border-b border-l-2 border-slate-100 last:border-b-0 hover:bg-slate-50/80 cursor-pointer transition-colors ${rowToneClass}`}
                        >
                          <div className='min-w-0'>
                            <p className='font-semibold text-sm text-slate-800 truncate'>{contact.name || 'Unknown'}</p>
                            <p className='text-xs text-slate-500 mt-0.5'>{formatReadableDate(contact.createdAt)}</p>
                          </div>

                          <div className='min-w-0'>
                            <p className='text-sm text-slate-700 truncate'>{contact.email || 'N/A'}</p>
                          </div>

                          <div className='min-w-0'>
                            <p className='text-sm text-slate-700 truncate'>{contact.subject || 'General enquiry'}</p>
                          </div>

                          <div className='min-w-0'>
                            <p className='text-sm text-slate-600 line-clamp-2'>{contact.message || 'No message provided.'}</p>
                          </div>

                          <div>
                            <span className={`inline-flex text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${statusClass}`}>
                              {contact.status}
                            </span>
                          </div>

                          <div className='flex flex-wrap items-center gap-2' onClick={(event) => event.stopPropagation()}>
                            {quickAction ? (
                              <button
                                type='button'
                                onClick={() => onChangeStatus(contact.id, quickAction.nextStatus)}
                                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors ${quickAction.className}`}
                              >
                                {quickAction.label}
                              </button>
                            ) : (
                              <span className='text-xs text-slate-400'>No quick action</span>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>

              {hasMoreContacts && (
                <div className='flex items-center justify-center'>
                  <button
                    type='button'
                    onClick={loadMoreContacts}
                    disabled={isLoadingMore}
                    className='px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold'
                  >
                    {isLoadingMore ? 'Loading more...' : 'Load More Contacts'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isPanelOpen && selectedContact && (
        <div className='fixed inset-0 z-70'>
          <button
            type='button'
            className='absolute inset-0 bg-slate-950/50'
            onClick={closeDetailsPanel}
            aria-label='Close details panel'
          />

          <aside className='absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl border-l border-slate-200 overflow-y-auto'>
            <div className='p-5 border-b border-slate-200 flex items-center justify-between'>
              <h2 className='text-lg font-semibold text-slate-900'>Contact Details</h2>
              <button
                type='button'
                onClick={closeDetailsPanel}
                className='p-1 rounded hover:bg-slate-100 text-slate-500'
                aria-label='Close details panel'
              >
                ✕
              </button>
            </div>

            <div className='p-5 space-y-4 text-sm'>
              <div>
                <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-400'>Name</p>
                <p className='mt-1 text-slate-800 font-medium'>{selectedContact.name || 'Unknown'}</p>
              </div>

              <div>
                <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-400'>Email</p>
                <p className='mt-1 text-slate-700 break-all'>{selectedContact.email || 'N/A'}</p>
              </div>

              {selectedContact.mobile && (
                <div>
                  <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-400'>Mobile</p>
                  <p className='mt-1 text-slate-700'>{selectedContact.mobile}</p>
                </div>
              )}

              <div>
                <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-400'>Date</p>
                <p className='mt-1 text-slate-700'>{formatReadableDate(selectedContact.createdAt)}</p>
              </div>

              <div>
                <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-400'>Subject</p>
                <p className='mt-1 text-slate-700'>{selectedContact.subject || 'General enquiry'}</p>
              </div>

              <div>
                <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-400'>Message</p>
                <p className='mt-1 text-slate-700 whitespace-pre-wrap'>{selectedContact.message || 'No message provided.'}</p>
              </div>

              <div>
                <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-400'>Status</p>
                <div className='mt-2 flex items-center gap-2'>
                  {['new', 'contacted', 'closed'].map((status) => (
                    <button
                      key={status}
                      type='button'
                      onClick={() => onChangeStatus(selectedContact.id, status)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${selectedContact.status === status
                        ? 'bg-brand text-white border-brand'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className='pt-2'>
                <button
                  type='button'
                  onClick={() => setIsDeleteConfirmVisible((prev) => !prev)}
                  className='w-full px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold transition-colors'
                >
                  {isDeleteConfirmVisible ? 'Cancel Delete' : 'Delete Request'}
                </button>
              </div>

              {isDeleteConfirmVisible && (
                <div className='rounded-xl border border-red-200 bg-red-50 p-3 space-y-2'>
                  <p className='text-sm text-red-700 font-medium'>Delete this request permanently?</p>
                  <button
                    type='button'
                    onClick={() => onDeleteContact(selectedContact)}
                    className='w-full px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-semibold transition-colors'
                  >
                    Confirm Delete
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export default AdminContactsPage
