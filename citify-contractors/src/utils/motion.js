import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

export const useMotionSettings = () => {
  const prefersReduced = useReducedMotion()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)')
    const onChange = (event) => setIsMobile(event.matches)
    setIsMobile(media.matches)

    if (media.addEventListener) {
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    }

    media.addListener(onChange)
    return () => media.removeListener(onChange)
  }, [])

  return {
    isMobile,
    prefersReduced,
    duration: prefersReduced ? 0.2 : isMobile ? 0.3 : 0.52,
    stagger: prefersReduced ? 0.03 : isMobile ? 0.06 : 0.1,
    delayChildren: prefersReduced ? 0.02 : isMobile ? 0.03 : 0.08,
    yOffset: prefersReduced ? 8 : isMobile ? 18 : 30,
  }
}

export const makeFadeUp = (settings) => ({
  hidden: { opacity: 0, y: settings.yOffset },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: settings.duration, ease: 'easeOut' },
  },
})

export const makeFadeIn = (settings) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: settings.duration, ease: 'easeOut' },
  },
})

export const makeStaggerContainer = (settings) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: settings.stagger,
      delayChildren: settings.delayChildren,
    },
  },
})

export const viewportOnce = {
  once: true,
  amount: 0.18,
}
