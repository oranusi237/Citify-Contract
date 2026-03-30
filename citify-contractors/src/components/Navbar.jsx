import React, { useEffect } from 'react'
import { assets } from '../assets/index'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);

  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
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
      if (window.innerWidth >= 768) setShowMobileMenu(false)
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className='fixed top-0 left-0 w-full z-60 bg-[#058F44]/85 backdrop-blur-md text-white'>
        <div className='container mx-auto flex justify-between items-center px-4 py-6 md:px-20 lg:px-32'>
           <Link to="/"><img src={assets.logo} alt="" /></Link>
            <ul className='hidden md:flex gap-7 text-white'>
                <Link to="/" className='cursor-pointer hover:text-gray-400'>Home</Link>
                <Link to="/about" className='cursor-pointer hover:text-gray-400'>About</Link>
                <Link to="/properties" className='cursor-pointer hover:text-gray-400'>Properties</Link>
                <Link to="/contact" className='cursor-pointer hover:text-gray-400'>Contact</Link>
              {user && <Link to="/admin/properties" className='cursor-pointer hover:text-gray-400'>Admin</Link>}
            </ul>
             <Link to='/contact' className='hidden md:block bg-[#058F44] cursor-pointer text-white px-8 py-2 rounded-full'>Book an Appointment</Link>
             <button
               type='button'
               onClick={() => setShowMobileMenu(true)}
               className='md:hidden p-1 rounded focus:outline-none focus:ring-2 focus:ring-white/70'
               aria-label='Open navigation menu'
               aria-expanded={showMobileMenu}
             >
               <img src={assets.menu_icon} className='w-7 cursor-pointer' alt='Open menu' />
             </button>
        </div>
        {/* -------------------mobile menu popup------------------- */}
        <div
          className={`md:hidden fixed inset-0 z-50 transition-opacity duration-200 ${showMobileMenu ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          aria-hidden={!showMobileMenu}
        >
          <button
            type='button'
            className='absolute inset-0 z-0 bg-black/35'
            onClick={() => setShowMobileMenu(false)}
            aria-label='Close menu overlay'
          />

          <div className={`absolute top-0 right-0 z-10 h-dvh w-full bg-white text-slate-800 shadow-2xl transform transition-transform duration-250 ease-out ${showMobileMenu ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className='flex justify-end p-5 border-b border-slate-200'>
              <button
                type='button'
                onClick={() => setShowMobileMenu(false)}
                className='p-1 rounded focus:outline-none focus:ring-2 focus:ring-[#058F44]/40'
                aria-label='Close navigation menu'
              >
                <img src={assets.cross_icon} className='w-6 cursor-pointer' alt='Close menu' />
              </button>
            </div>

            <ul className='flex flex-col gap-2 px-5 py-5'>
              <li>
                <Link onClick={() => setShowMobileMenu(false)} to='/' className='block w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 active:bg-slate-200'>Home</Link>
              </li>
              <li>
                <Link onClick={() => setShowMobileMenu(false)} to='/about' className='block w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 active:bg-slate-200'>About</Link>
              </li>
              <li>
                <Link onClick={() => setShowMobileMenu(false)} to='/properties' className='block w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 active:bg-slate-200'>Properties</Link>
              </li>
              <li>
                <Link onClick={() => setShowMobileMenu(false)} to='/contact' className='block w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 active:bg-slate-200'>Contact</Link>
              </li>
              {user && (
                <li>
                  <Link onClick={() => setShowMobileMenu(false)} to='/admin/properties' className='block w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 active:bg-slate-200'>Admin</Link>
                </li>
              )}
            </ul>

            <div className='px-5 pt-2'>
              <Link
                onClick={() => setShowMobileMenu(false)}
                to='/contact'
                className='block w-full text-center bg-[#058F44] text-white px-4 py-3 rounded-xl font-medium'
              >
                Book an Appointment
              </Link>
            </div>
          </div>
        </div>
    </div>
  )
}

export default Navbar