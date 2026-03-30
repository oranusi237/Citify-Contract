import React, { useEffect } from 'react'
import { ToastContainer } from 'react-toastify'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetail from './pages/ProjectDetail'
import AdminProjectsPage from './pages/AdminProjectsPage'
import AdminToursPage from './pages/AdminToursPage'
import LoginPage from './pages/LoginPage'
import ContactPage from './pages/ContactPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import { useMotionSettings } from './utils/motion'

const PageShell = ({ children, settings }) => (
  <motion.div
    initial={{ opacity: 0, y: settings.prefersReduced ? 6 : settings.isMobile ? 10 : 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: settings.prefersReduced ? -4 : settings.isMobile ? -8 : -12 }}
    transition={{ duration: settings.duration, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
)

const ScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

const App = () => {
  const location = useLocation()
  const motionSettings = useMotionSettings()

  return (
    <MotionConfig reducedMotion='user'>
      <AuthProvider>
        <div className='w-full overflow-hidden'>
          <ScrollToTop />
          <ToastContainer />
          <AnimatePresence mode='wait'>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageShell settings={motionSettings}><HomePage /></PageShell>} />
              <Route path="/about" element={<PageShell settings={motionSettings}><AboutPage /></PageShell>} />
              <Route path="/properties" element={<PageShell settings={motionSettings}><ProjectsPage /></PageShell>} />
              <Route path="/property/:id" element={<PageShell settings={motionSettings}><ProjectDetail /></PageShell>} />
              <Route path="/admin/login" element={<LoginPage />} />
              <Route path="/admin/properties" element={<ProtectedRoute><AdminProjectsPage /></ProtectedRoute>} />
              <Route path="/admin/tours" element={<ProtectedRoute><AdminToursPage /></ProtectedRoute>} />
              <Route path="/contact" element={<PageShell settings={motionSettings}><ContactPage /></PageShell>} />
              <Route path="/privacy-policy" element={<PageShell settings={motionSettings}><PrivacyPolicyPage /></PageShell>} />
            </Routes>
          </AnimatePresence>
        </div>
      </AuthProvider>
    </MotionConfig>
  )
}

export default App