import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { COMPANY } from '../shared/config/siteConfig'
import SitePageLayout from '../shared/components/SitePageLayout'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const EventsPage = () => {
  return (
    <SitePageLayout className='w-full overflow-hidden bg-[#f6fbf8] text-slate-900' contentAs='main'>
        <section className='relative overflow-hidden bg-[linear-gradient(135deg,var(--color-brand-ink)_0%,var(--color-brand-deep)_55%,var(--color-brand)_100%)] text-white'>
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(109,255,178,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.1),transparent_24%)]' />
          <motion.div
            className='relative mx-auto max-w-7xl px-6 py-24 text-center md:px-12 lg:px-20 lg:py-32'
            variants={containerVariants}
            initial='hidden'
            animate='visible'
          >
            <motion.p variants={itemVariants} className='mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-brand-accent'>Events</motion.p>
            <motion.h1 variants={itemVariants} className='mx-auto max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl'>Coming Soon</motion.h1>
            <motion.p variants={itemVariants} className='mx-auto mt-6 max-w-2xl text-base leading-7 text-white/80 sm:text-lg'>We are preparing a calendar of site tours, investor sessions, and brand events. Check back soon to see what is next from {COMPANY.shortName}.</motion.p>
            <motion.div variants={itemVariants} className='mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row'>
              <Link to='/contact' className='inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-deep transition-colors hover:bg-[#eafff2]'>Contact Us</Link>
              <Link to='/properties' className='inline-flex items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10'>View Properties</Link>
            </motion.div>
          </motion.div>
        </section>
    </SitePageLayout>
  )
}

export default EventsPage