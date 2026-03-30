import React from 'react'
import { assets } from '../assets'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter } from 'react-icons/fa'
import { makeFadeUp, makeStaggerContainer, useMotionSettings, viewportOnce } from '../utils/motion'

const Footer = () => {
  const motionSettings = useMotionSettings()
  const fadeUp = makeFadeUp(motionSettings)
  const staggerContainer = makeStaggerContainer(motionSettings)
  const socialLinks = [
    { name: 'Facebook', href: 'https://www.facebook.com/citifycontractors', icon: <FaFacebookF /> },
    { name: 'Instagram', href: 'https://www.instagram.com/citifycontractors/', icon: <FaInstagram /> },
    { name: 'LinkedIn', href: 'https://www.linkedin.com/company/citify-contractors', icon: <FaLinkedinIn /> },
    { name: 'X (Twitter)', href: 'https://twitter.com/citifycontractors', icon: <FaTwitter /> },
  ]

  return (
    <footer className='w-full bg-slate-900 text-slate-300 border-t border-slate-800' id='Footer'>
      <motion.div
        className='max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-12'
        initial='hidden'
        whileInView='visible'
        viewport={viewportOnce}
        variants={staggerContainer}
      >
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10'>
          <motion.div variants={fadeUp}>
            <img src={assets.logo_dark} alt='Citify Contractors logo' className='h-10 w-auto' />
            <p className='mt-4 text-sm leading-relaxed text-slate-400'>
              We design and deliver modern real-estate developments with quality craftsmanship,
              transparent execution, and long-term value.
            </p>
          </motion.div>

          <motion.div variants={fadeUp}>
            <h3 className='text-white text-base font-semibold mb-4'>Explore</h3>
            <ul className='space-y-2 text-sm'>
              <li><Link to='/' className='hover:text-white transition-colors'>Home</Link></li>
              <li><Link to='/about' className='hover:text-white transition-colors'>About</Link></li>
              <li><Link to='/properties' className='hover:text-white transition-colors'>Properties</Link></li>
              <li><Link to='/contact' className='hover:text-white transition-colors'>Contact</Link></li>
            </ul>
          </motion.div>

          <motion.div variants={fadeUp}>
            <h3 className='text-white text-base font-semibold mb-4'>Contact</h3>
            <ul className='space-y-2 text-sm text-slate-400'>
              <li>Abuja, Nigeria</li>
              <li>+234 000 000 0000</li>
              <li>hello@citifycontractors.com</li>
              <li>Mon - Fri, 10:00 AM - 5:00 PM</li>
            </ul>
          </motion.div>

          <motion.div variants={fadeUp}>
            <h3 className='text-white text-base font-semibold mb-4'>Social</h3>
            <p className='text-sm text-slate-400 mb-4'>Follow our latest land developments and behind-the-scenes progress.</p>
            <motion.div className='flex items-center gap-3' variants={staggerContainer}>
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label={social.name}
                  variants={fadeUp}
                  className='h-10 w-10 rounded-full bg-white/10 border border-white/15 text-slate-300 hover:text-white hover:border-[#058F44] hover:bg-[#058F44]/20 transition-all grid place-items-center'
                >
                  {social.icon}
                </motion.a>
              ))}
            </motion.div>
          </motion.div>
        </div>

        <div className='mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500'>
          <p>© {new Date().getFullYear()} Citify Contractors. All rights reserved.</p>
          <div className='flex items-center gap-4'>
            <Link to='/privacy-policy' className='hover:text-white transition-colors'>Privacy Policy</Link>
            <span className='text-slate-700'>|</span>
            <Link to='/contact' className='hover:text-white transition-colors'>Book a Consultation</Link>
            <span className='text-slate-700'>|</span>
            <span>Built for modern real estate delivery</span>
          </div>
        </div>
      </motion.div>
    </footer>
  )
}

export default Footer