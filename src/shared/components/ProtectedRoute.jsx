import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingPage from './LoadingPage'
import ErrorBoundary from './ErrorBoundary'
import { resolveProtectedRouteState } from './protectedRouteState'

const ProtectedRouteInner = ({ children }) => {
  const { user, isAdmin, authLoading } = useAuth()
  const state = resolveProtectedRouteState({ user, isAdmin, authLoading })

  if (state === 'loading') return <LoadingPage />
  if (state === 'redirect') return <Navigate to='/admin/login' replace />

  return children
}

const ProtectedRoute = ({ children }) => (
  <ErrorBoundary fallback={
    <div className='min-h-screen flex items-center justify-center text-center px-4'>
      <div>
        <p className='text-slate-700 font-semibold text-lg'>Unable to verify your session.</p>
        <a href='/admin/login' className='mt-4 inline-block px-6 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-strong transition-colors'>Back to Login</a>
      </div>
    </div>
  }>
    <ProtectedRouteInner>{children}</ProtectedRouteInner>
  </ErrorBoundary>
)

export default ProtectedRoute
