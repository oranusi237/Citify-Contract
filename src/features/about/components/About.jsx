import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { assets } from '../../../assets'
import LazyImage from '../../../shared/components/LazyImage'
import { COMPANY, COMPANY_STATS } from '../../../shared/config/siteConfig'
import { makeFadeUp, makeStaggerContainer, useMotionSettings, viewportOnce } from '../../../shared/lib/motion'
import { useAnimatedStats } from '../../../utils/useAnimatedStats'

const About = () => {
  const motionSettings = useMotionSettings()
  const fadeUp = makeFadeUp(motionSettings)
  const staggerContainer = makeStaggerContainer(motionSettings)
  const statsRef = useRef(null)
  const [statsInView, setStatsInView] = useState(false)
  const animatedStats = useAnimatedStats(COMPANY_STATS, { shouldAnimate: statsInView })

  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <motion.div
      initial='hidden'
      whileInView='visible'
      viewport={viewportOnce}
      variants={staggerContainer}
      className='w-full overflow-hidden'
    >
      <motion.div variants={fadeUp} className='flex flex-col items-center container mx-auto p-8 sm:p-14 md:px-20 lg:px-32 w-full bg-white text-black' id='About'>
        <h1 className='text-2xl sm:text-4xl font-bold mb-2'>About <span className='underline underline-offset-4 decoration-1 font-light'>{COMPANY.shortName}</span></h1>
        <p className='text-gray-500 max-w-80 text-center mb-8'>Passionate about connecting investors and families with premium properties, delivering exceptional real estate solutions that exceed expectations and create lasting value.</p>
        <div className='flex flex-col md:flex-row items-center md:items-start md:gap-20'>
          <LazyImage
            src={assets.brand_img}
            alt={`${COMPANY.shortName} overview`}
            skeletonClass='w-full sm:w-1/2 max-w-lg'
            className='block w-full h-auto'
            sizes='(max-width: 768px) 100vw, 50vw'
          />
          <div className='flex flex-col items-center md:items-start mt-10 text-gray-600'>
            <div ref={statsRef} className='grid grid-cols-2 gap-6 md:gap-10 w-full 2xl:pr-28'>
              {COMPANY_STATS.map((stat) => (
                <div key={stat.key}>
                  <p className='text-4xl font-medium text-gray-800'>{animatedStats[stat.key]}+</p>
                  <p>{stat.label}</p>
                </div>
              ))}
            </div>
            <p className='my-10 max-w-lg'>Our core purpose is to restore balance and reliability to the industry by operating with uncompromising integrity and transparency. At Citify, we firmly believe in a client-first philosophy, prioritizing your peace of mind and long-term success over short-term profit maximization.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default About