import React, { useEffect, useState } from 'react'
import { assets } from '../../assets'
import { motion } from "framer-motion";

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
}

const statVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
}

const textVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
}

const About = () => {
  const [years, setYears] = useState(0)
  const [projects, setProjects] = useState(0)
  const [sqft, setSqft] = useState(0)
  const [ongoing, setOngoing] = useState(0)

  useEffect(() => {
    const duration = 1200
    const intervalMs = 30
    const steps = Math.ceil(duration / intervalMs)

    const animate = (target, setFn) => {
      let count = 0
      const step = Math.ceil(target / steps)
      const timer = setInterval(() => {
        count += step
        if (count >= target) {
          setFn(target)
          clearInterval(timer)
        } else {
          setFn(count)
        }
      }, intervalMs)
      return timer
    }

    const timers = [
      animate(10, setYears),
      animate(15, setProjects),
      animate(12, setSqft),
      animate(25, setOngoing)
    ]

    return () => timers.forEach(clearInterval)
  }, [])


  return (
    <div className='w-full overflow-hidden'>
      <div className='flex flex-col items-center container mx-auto p-14 md:px-20 lg:px-32 w-full bg-white text-black' id='About'>
        <h1 className='text-2xl sm:text-4xl font-bold mb-2'>About <span className='underline underline-offset-4 decoration-1 font-light'>Citify</span></h1>
        <p className='text-gray-500 max-w-80 text-center mb-8'>Passionate about connecting investors and families with premium properties, delivering exceptional real estate solutions that exceed expectations and create lasting value.</p>
        <div className='flex flex-col md:flex-row items-center md:items-start md:gap-20 w-full'>
          <img src={assets.brand_img} alt='Brand' className='w-full sm:w-1/2 max-w-lg rounded-lg shadow-xl' />

          <div className='flex flex-col items-center md:items-start mt-10 text-gray-700 w-full'>
            <div className='grid grid-cols-2 gap-6 md:gap-10 w-full 2xl:pr-28'>
              <div>
                <p className='text-4xl font-bold text-[#058F44]'>{years > 0 ? years : 0}+</p>
                <p className='text-sm font-medium'>Years of Experience</p>
              </div>
              <div>
                <p className='text-4xl font-bold text-[#058F44]'>{projects > 0 ? projects : 0}+</p>
                  <p className='text-sm font-medium'>Properties Sold</p>
              </div>
              <div>
                <p className='text-4xl font-bold text-[#058F44]'>{sqft > 0 ? sqft : 0}+</p>
                <p className='text-sm font-medium'>Acres Developed</p>
              </div>
              <div>
                <p className='text-4xl font-bold text-[#058F44]'>{ongoing > 0 ? ongoing : 0}+</p>
                <p className='text-sm font-medium'>Ongoing Developments</p>
              </div>
            </div>
            <p className='mt-8 max-w-xl text-gray-600'>Our core purpose is to restore balance and reliability to the industry by operating with uncompromising integrity and transparency. At Citify, we firmly believe in a client-first philosophy, prioritizing your peace of mind and long-term success over short-term profit maximization.</p>
          </div>
        </div>
      </div>

    </div>
  )
}

export default About