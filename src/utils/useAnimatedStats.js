import { useEffect, useState } from 'react'

const buildInitialValues = (items) => Object.fromEntries(items.map(({ key }) => [key, 0]))

export const useAnimatedStats = (items, options = {}) => {
  const { duration = 1200, intervalMs = 30, shouldAnimate = true } = options
  const [values, setValues] = useState(() => buildInitialValues(items))

  useEffect(() => {
    let mounted = true

    if (!shouldAnimate) {
      setValues(buildInitialValues(items))
      return () => { mounted = false }
    }

    const steps = Math.ceil(duration / intervalMs)
    setValues(buildInitialValues(items))

    const timers = items.map(({ key, value }) => {
      let count = 0
      const step = Math.ceil(value / steps)

      const timer = setInterval(() => {
        if (!mounted) return

        count += step

        if (count >= value) {
          setValues((prev) => ({ ...prev, [key]: value }))
          clearInterval(timer)
          return
        }

        setValues((prev) => ({ ...prev, [key]: count }))
      }, intervalMs)

      return timer
    })

    return () => {
      mounted = false
      timers.forEach(clearInterval)
    }
  }, [duration, intervalMs, items, shouldAnimate])

  return values
}