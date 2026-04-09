import React, { useEffect } from 'react'
import { assets } from '../../assets/index'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

const Navbar = () => {
  const location = useLocation()
  const [showMobileMenu, setShowMobileMenu] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)

  const navItems = [
    { label: 'Home', to: '/', match: (path) => path === '/' },
    { label: 'About Us', to: '/about', match: (path) => path.startsWith('/about') },
    { label: 'Properties', to: '/properties', match: (path) => path.startsWith('/properties') || path.startsWith('/property/') },
    { label: 'Events', to: '/events', match: (path) => path.startsWith('/events') },
    { label: 'Blog', to: '/blog', match: (path) => path.startsWith('/blog') },
    { label: 'Contact', to: '/contact', match: (path) => path.startsWith('/contact') },
  ]

  const activeClasses = 'text-brand-accent before:absolute before:-bottom-2 before:left-0 before:h-[2px] before:w-full before:rounded-full before:bg-brand'
  const inactiveClasses = 'text-white/90 hover:text-white'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showMobileMenu])

  useEffect(() => {
    const onEscape = (event) => {
      if (event.key === 'Escape') setShowMobileMenu(false)
    }

    if (showMobileMenu) {
      window.addEventListener('keydown', onEscape)
    }

    return () => window.removeEventListener('keydown', onEscape)
  }, [showMobileMenu])

  useEffect(() => {
    setShowMobileMenu(false)
  }, [location.pathname])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) {
        setShowMobileMenu(false)
      }
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className='fixed top-0 left-0 w-full z-60 text-white'>
      <div className={`border-b backdrop-blur-md transition-all duration-300 ${scrolled ? 'border-brand/35 bg-[#022612]/95 shadow-[0_1px_20px_rgba(0,0,0,0.35)]' : 'border-brand/20 bg-[#022612]/72'}`}>
        <div className='container mx-auto flex items-center justify-between px-4 py-4 md:px-10 lg:px-20'>
          <Link to='/' className='shrink-0'>
            <img src={assets.logo} alt='Citify logo' className='h-11 w-auto sm:h-12' />
          </Link>

          <ul className='hidden md:flex items-center gap-8 lg:gap-11'>
            {navItems.map((item) => {
              const isActive = item.match(location.pathname)
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`relative text-[18px] font-semibold tracking-[0.01em] transition-colors duration-200 ${isActive ? activeClasses : inactiveClasses}`}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className='flex items-center gap-3'>
            <Link
              to='/contact'
              className='hidden md:inline-flex items-center rounded-full border border-brand-accent/35 bg-brand/85 px-6 py-2.5 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-brand-strong'
            >
              Book an Appointment
            </Link>

            <button
              type='button'
              onClick={() => setShowMobileMenu(true)}
              className='md:hidden inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-accent/35 bg-brand/35 focus:outline-none focus:ring-2 focus:ring-brand-accent/80'
              aria-label='Open navigation menu'
              aria-expanded={showMobileMenu}
            >
              <img src={assets.menu_icon} className='w-6' alt='Open menu' />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            className='md:hidden fixed inset-0 z-50'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type='button'
              className='absolute inset-0 z-0 bg-slate-950/55'
              onClick={() => setShowMobileMenu(false)}
              aria-label='Close menu overlay'
            />

            <motion.div
              className='absolute top-0 right-0 z-10 h-dvh w-[87%] max-w-sm bg-linear-to-b from-[#03331a] to-[#02150b] text-white shadow-2xl'
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
            >
              <div className='flex items-center justify-between px-5 py-5 border-b border-brand-accent/20'>
                <p className='text-sm tracking-[0.22em] uppercase text-white/70'>Menu</p>
                <button
                  type='button'
                  onClick={() => setShowMobileMenu(false)}
                  className='p-1 rounded focus:outline-none focus:ring-2 focus:ring-white/40'
                  aria-label='Close navigation menu'
                >
                  <img src={assets.cross_icon} className='w-6' alt='Close menu' />
                </button>
              </div>

              <ul className='flex flex-col gap-1 px-4 py-6'>
                {navItems.map((item) => {
                  const isActive = item.match(location.pathname)
                  return (
                    <li key={item.to}>
                      <Link
                        onClick={() => setShowMobileMenu(false)}
                        to={item.to}
                        className={`block w-full rounded-xl px-4 py-3 text-left text-base font-medium transition-colors ${isActive ? 'bg-brand/35 text-brand-accent' : 'text-white/90 hover:bg-white/10 hover:text-white'}`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>

              <div className='px-4 pt-2'>
                <Link
                  onClick={() => setShowMobileMenu(false)}
                  to='/contact'
                  className='block w-full rounded-xl bg-brand px-4 py-3 text-center text-sm font-semibold tracking-wide text-white transition-colors hover:bg-brand-strong'
                >
                  Book an Appointment
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Navbar
