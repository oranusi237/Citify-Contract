import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingPage from './LoadingPage'

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()

  if (user === undefined) return <LoadingPage />

  if (!user) return <Navigate to='/admin/login' replace />

  return children
}

export default ProtectedRoute
