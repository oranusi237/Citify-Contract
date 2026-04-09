import React, { useEffect, useRef, useState } from 'react'
import Navbar from '../shared/components/Navbar'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { assets, testimonialsData } from '../assets/index'
import { seedProjectsIfEmpty, subscribeToProjects } from '../features/projects/projectsStore'
import { makeFadeUp, makeStaggerContainer, useMotionSettings, viewportOnce } from '../shared/lib/motion'
import LazyImage from '../shared/components/LazyImage'
import { COMPANY, COMPANY_STATS } from '../shared/config/siteConfig'
import { useContactRequestForm } from '../features/contacts/hooks/useContactRequestForm'
import { useAnimatedStats } from '../utils/useAnimatedStats'

const faqItems = [
  {
    question: 'How do I schedule an inspection?',
    answer: 'Open any property listing, click Request Inspection, choose your preferred date and time, and submit your details. Our team will confirm your slot shortly.',
  },
  {
    question: 'Are your property listings verified?',
    answer: 'Yes. We focus on vetted opportunities and transparent listing details so you can make informed decisions with confidence.',
  },
  {
    question: 'Can I get support before making a purchase?',
    answer: 'Absolutely. Share your goals through our contact form and our team will guide you through options, pricing, and the next steps.',
  },
  {
    question: 'What response time should I expect?',
    answer: 'Most enquiries receive a response within one business day, often sooner during business hours.',
  },
]

const Header = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsToShow, setCardsToShow] = useState(1);
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [propertyOffsets, setPropertyOffsets] = useState([])
  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const [testimonialCardsToShow, setTestimonialCardsToShow] = useState(1)
  const [testimonialOffsets, setTestimonialOffsets] = useState([])
  const [openFaqIndex, setOpenFaqIndex] = useState(0)
  const propertyCardRefs = useRef(new Map())
  const testimonialCardRefs = useRef(new Map())
  const statsRef = useRef(null)
  const [statsInView, setStatsInView] = useState(false)
  const motionSettings = useMotionSettings()
  const fadeUp = makeFadeUp(motionSettings)
  const staggerContainer = makeStaggerContainer(motionSettings)
  const animatedStats = useAnimatedStats(COMPANY_STATS, { shouldAnimate: statsInView })
  const {
    consent,
    contactError,
    handleConsentChange,
    handleSubmit,
    isOffline,
    isSubmitting,
    statusText,
  } = useContactRequestForm({ source: 'header' })
  const featuredProjectsVisible = featuredProjects.slice(0, 8)

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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setCardsToShow(3);
      } else {
        setCardsToShow(1);
      }

      if (window.innerWidth >= 1280) {
        setTestimonialCardsToShow(3)
      } else if (window.innerWidth >= 768) {
        setTestimonialCardsToShow(3)
      } else {
        setTestimonialCardsToShow(1)
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const maxIndex = Math.max(featuredProjectsVisible.length - cardsToShow, 0);
    setCurrentIndex((prevIndex) => Math.min(prevIndex, maxIndex));
  }, [cardsToShow, featuredProjectsVisible.length]);

  useEffect(() => {
    const measureOffsets = () => {
      setPropertyOffsets(
        featuredProjectsVisible.map((p) => {
          const card = propertyCardRefs.current.get(p.id)
          return card ? card.offsetLeft : 0
        })
      )
    }

    const frameId = window.requestAnimationFrame(measureOffsets)
    window.addEventListener('resize', measureOffsets)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', measureOffsets)
    }
  }, [cardsToShow, featuredProjectsVisible])

  useEffect(() => {
    const maxIndex = Math.max(featuredProjectsVisible.length - cardsToShow, 0)
    if (maxIndex === 0) return () => {}

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex >= maxIndex ? 0 : prevIndex + 1))
    }, 4500)

    return () => clearInterval(timer)
  }, [cardsToShow, featuredProjectsVisible.length])

  useEffect(() => {
    const maxIndex = Math.max(testimonialsData.length - testimonialCardsToShow, 0)
    setTestimonialIndex((prevIndex) => Math.min(prevIndex, maxIndex))
  }, [testimonialCardsToShow])

  useEffect(() => {
    const maxIndex = Math.max(testimonialsData.length - testimonialCardsToShow, 0)
    if (maxIndex === 0) return () => {}

    const timer = setInterval(() => {
      setTestimonialIndex((prevIndex) => (prevIndex >= maxIndex ? 0 : prevIndex + 1))
    }, 4500)

    return () => clearInterval(timer)
  }, [testimonialCardsToShow])

  useEffect(() => {
    const measureOffsets = () => {
      setTestimonialOffsets(
        testimonialsData.map((t, i) => {
          const card = testimonialCardRefs.current.get(`${t.name}-${i}`)
          return card ? card.offsetLeft : 0
        })
      )
    }

    const frameId = window.requestAnimationFrame(measureOffsets)
    window.addEventListener('resize', measureOffsets)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', measureOffsets)
    }
  }, [testimonialCardsToShow])

  useEffect(() => {
    let unsubscribe = () => {};

    const init = async () => {
      await seedProjectsIfEmpty();
      unsubscribe = subscribeToProjects(
        (data) => setFeaturedProjects(data),
        (err) => console.error('[Header] Firestore subscription error:', err)
      );
    };

    init();
    return () => unsubscribe();
  }, []);

  const nextProject = () => {
    const maxIndex = Math.max(featuredProjectsVisible.length - cardsToShow, 0);
    setCurrentIndex((prevIndex) => (prevIndex >= maxIndex ? 0 : prevIndex + 1));
  };

  const previousProject = () => {
    const maxIndex = Math.max(featuredProjectsVisible.length - cardsToShow, 0);
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? maxIndex : prevIndex - 1));
  };

  const testimonialMaxIndex = Math.max(testimonialsData.length - testimonialCardsToShow, 0)
  const testimonialPageCount = testimonialMaxIndex + 1

  return (
    <>
      {/* Hero Section */}
        <motion.div
          initial='hidden'
          animate='visible'
          variants={fadeUp}
          className='min-h-screen mb-4 bg-cover bg-center flex items-center w-full overflow-hidden'
          style={{backgroundImage: "url('/header_img.png')"}}
          id='Header'
        >
          <Navbar />
          <div className='container text-center mx-auto py-4 px-6 md:px-20 lg:px-32 text-white '>
            <motion.h2 variants={fadeUp} className='text-4xl sm:text-6xl md:text-[82px] inline-block max-w-3xl font-semibold leading-tight sm:leading-[1.03] pt-20'>Your Gateway to Premium Real Estate</motion.h2>
            <motion.div variants={fadeUp} className='mt-4 flex flex-col items-center gap-3 sm:mt-2 sm:flex-row sm:justify-center sm:gap-6'>
                  <Link to="/properties" className=' border border-white px-8 py-3 rounded inline-block'>Properties</Link>
                  <Link to="/contact" className=' bg-brand px-8 py-3 rounded inline-block text-white'>Contact Us</Link>
            </motion.div>
          </div>
        </motion.div>

      {/* About Section  */}
        <motion.div
          initial='hidden'
          whileInView='visible'
          viewport={viewportOnce}
          variants={fadeUp}
          className='flex flex-col items-center container mx-auto p-8 sm:p-14 md:px-20 lg:px-32 w-full overflow-hidden'
          id='About'
        >
          <h1 className='text-2xl sm:text-4xl font-bold mb-2'>About <span className='underline underline-offset-4 decoration-1 font-light'>{COMPANY.shortName}</span></h1>
          <p className='text-gray-500 max-w-80 text-center mb-8'>Passionate about connecting investors and families with premium properties, delivering exceptional real estate solutions that exceed expectations and create lasting value.</p>
          <div className='flex flex-col md:flex-row items-center md:items-start md:gap-20'>
              <LazyImage
                src={assets.brand_img}
                alt={`${COMPANY.shortName} overview`}
                skeletonClass='w-full sm:w-1/2 max-w-lg'
                className='block w-full h-auto'
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
                  <p className='my-10 max-w-lg '>Our core purpose is to restore balance and reliability to the industry by operating with uncompromising integrity and transparency. At Citify, we firmly believe in a client-first philosophy, prioritizing your peace of mind and long-term success over short-term profit maximization.</p>
                  <Link to="/about" className='bg-brand text-white px-8 py-2 rounded cursor-pointer inline-block'>Learn More</Link>
              </div>
          </div>
      </motion.div>

      {/* Properties Section */}
        <motion.div
          initial='hidden'
          whileInView='visible'
          viewport={viewportOnce}
          variants={fadeUp}
          className='container mx-auto py-4 pt-20 px-6 md:px-20 lg:px-32 my-20 w-full overflow-hidden'
          id='Properties'
        >
          <div className='rounded-4xl border border-brand/15 bg-[radial-gradient(circle_at_top_left,rgba(5,143,68,0.12),transparent_35%),linear-gradient(180deg,#f7fcf9_0%,#ffffff_62%)] p-6 sm:p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)]'>
            <h1 className='text-2xl sm:text-4xl font-bold mb-2 text-center'>Featured <span className='underline underline-offset-4 decoration-1 font-light'>Properties</span></h1>
            <p className='text-center text-slate-600 mb-8 max-w-2xl mx-auto'>Explore high-potential land listings in fast-growing locations, curated for serious buyers and smart investors.</p>

            <div className='flex justify-center items-center gap-3 mb-5'>
              <button onClick={previousProject} className='bg-white border border-slate-200 p-2.5 rounded-full hover:bg-slate-50 transition-colors shadow-sm'><img src={assets.left_arrow} alt='Previous' className='w-4 h-4'/></button>
              <button onClick={nextProject} className='bg-brand border border-brand p-2.5 rounded-full hover:bg-brand-strong transition-colors shadow-sm'><img src={assets.right_arrow} alt='Next' className='w-4 h-4 brightness-0 invert'/></button>
                    </div>

            <div className='overflow-hidden'>
              <motion.div variants={staggerContainer} className='flex gap-6 transition-transform duration-500 ease-in-out will-change-transform' style={{ transform: `translateX(-${propertyOffsets[currentIndex] || 0}px)` }}>
                {featuredProjectsVisible.map((project) => (
                  <motion.div
                    variants={fadeUp}
                    key={project.id}
                    ref={(node) => {
                      if (node) propertyCardRefs.current.set(project.id, node)
                      else propertyCardRefs.current.delete(project.id)
                    }}
                    className='shrink-0 w-full md:w-1/2 lg:w-1/3'
                  >
                    <Link to={`/property/${project.id}`} className='group block rounded-3xl overflow-hidden border border-slate-200 bg-white hover:shadow-[0_20px_45px_rgba(15,23,42,0.12)] transition-all h-full'>
                      <div className='relative overflow-hidden'>
                        <span className='absolute top-3 left-3 z-10 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.22em] px-2.5 py-1 rounded-full bg-white/90 text-brand'>Inspection Ready</span>
                        <div className='absolute inset-x-0 bottom-0 z-10 h-24 bg-linear-to-t from-slate-950/70 to-transparent' />
                        <LazyImage
                          src={project.image}
                          alt={project.title}
                          className='w-full h-52 object-cover bg-gray-100 transition-transform duration-500 group-hover:scale-[1.04]'
                          sizes='(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw'
                        />
                        <p className='absolute bottom-3 left-4 z-10 text-white text-xl font-semibold'>{project.price}</p>
                      </div>
                      <div className='p-5'>
                        <h2 className='text-xl font-semibold text-slate-900'>{project.title}</h2>
                        <p className='text-slate-500 mt-2'>{project.location}</p>
                        <p className='mt-4 text-sm text-slate-600'>Verified listing with strong location value and growth potential.</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <div className='text-center mt-8'>
                <Link to="/properties" className='bg-brand text-white px-8 py-2.5 rounded-full cursor-pointer inline-block hover:bg-brand-strong transition-colors'>View All Properties</Link>
            </div>
          </div>
      </motion.div>

      {/* Testimonials Section */}
      <motion.div
        initial='hidden'
        whileInView='visible'
        viewport={viewportOnce}
        variants={fadeUp}
        className='container mx-auto py-12 lg:px-32 w-full overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(5,143,68,0.12),transparent_45%),linear-gradient(180deg,#f8fbf9_0%,#ffffff_70%)] my-20 rounded-3xl border border-brand/20'
        id='Testimonials'
      >
        <h1 className='text-2xl sm:text-4xl font-bold mt-2 mb-2 text-center text-slate-900'>Client testimonials</h1>
        <p className='text-center text-slate-500 mb-8 max-w-2xl mx-auto px-4'>Testimonials from buyers and investors who trusted us with their property decisions.</p>

        <div className='overflow-hidden px-4 md:px-8'>
          <motion.div
            variants={staggerContainer}
            className='flex gap-6 transition-transform duration-500 ease-in-out will-change-transform'
            style={{ transform: `translateX(-${testimonialOffsets[testimonialIndex] || 0}px)` }}
          >
            {testimonialsData.map((testimonial, index) => (
              <motion.div
                variants={fadeUp}
                key={`${testimonial.name}-${index}`}
                ref={(node) => {
                  const key = `${testimonial.name}-${index}`
                  if (node) testimonialCardRefs.current.set(key, node)
                  else testimonialCardRefs.current.delete(key)
                }}
                className='w-full shrink-0 md:w-[calc((100%-3rem)/3)]'
              >
                <article className='h-full rounded-2xl border border-slate-200/90 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)] p-6 md:p-7'>
                  <div className='flex items-start justify-between gap-4 mb-5'>
                    <div className='flex items-center gap-3 min-w-0'>
                      <div className='inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand font-semibold text-sm shrink-0'>
                        {String(testimonial.name || '').split(' ').slice(0, 2).map((chunk) => chunk.charAt(0)).join('').toUpperCase()}
                      </div>
                      <div className='min-w-0'>
                        <h2 className='text-base text-slate-800 font-semibold truncate'>{testimonial.name}</h2>
                        <p className='text-slate-500 text-sm truncate'>{testimonial.title}</p>
                      </div>
                    </div>
                    <span className='text-4xl leading-none text-brand/30 font-serif' aria-hidden='true'>"</span>
                  </div>
                  <div className='flex items-center gap-1 mb-4'>
                    {Array.from({ length: testimonial.rating }, (_, starIndex) => (
                      <img key={starIndex} src={assets.star_icon} alt='' className='w-4 h-4' />
                    ))}
                    <span className='ml-2 text-[11px] font-medium uppercase tracking-wide text-slate-400'>Verified Client</span>
                  </div>
                  <p className='text-slate-600 leading-relaxed'>{testimonial.text}</p>
                </article>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className='mt-6 flex items-center justify-center gap-2'>
          {Array.from({ length: testimonialPageCount }, (_, dotIndex) => (
            <span
              key={`testimonial-dot-${dotIndex}`}
              className={`h-1.5 rounded-full transition-all ${dotIndex === Math.min(testimonialIndex, testimonialMaxIndex) ? 'w-6 bg-brand' : 'w-2 bg-slate-300'}`}
              aria-hidden='true'
            />
          ))}
        </div>

      </motion.div>

      {/* FAQ Section */}
      <motion.div
        initial='hidden'
        whileInView='visible'
        viewport={viewportOnce}
        variants={fadeUp}
        className='container mx-auto py-12 lg:px-32 w-full overflow-hidden bg-linear-to-b from-slate-50 to-white my-20 rounded-3xl border border-slate-200'
        id='FAQ'
      >
        <h1 className='text-2xl sm:text-4xl font-bold mb-2 text-center'>Frequently Asked <span className='underline underline-offset-4 decoration-1 font-light'>Questions</span></h1>
        <p className='text-center text-slate-500 mb-10 max-w-2xl mx-auto px-4'>Quick answers to common buyer questions about inspections, listing confidence, and getting started.</p>

        <motion.div variants={staggerContainer} className='max-w-4xl mx-auto px-4 md:px-8 space-y-3'>
          {faqItems.map((item, index) => {
            const isOpen = openFaqIndex === index
            return (
              <motion.div
                variants={fadeUp}
                key={item.question}
                className='rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden'
              >
                <button
                  type='button'
                  className='w-full px-5 md:px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors'
                  onClick={() => setOpenFaqIndex((prev) => (prev === index ? -1 : index))}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${index}`}
                >
                  <span className='text-sm sm:text-base font-semibold text-slate-900'>{item.question}</span>
                  <span className={`text-brand text-xl leading-none transition-transform ${isOpen ? 'rotate-45' : 'rotate-0'}`} aria-hidden='true'>+</span>
                </button>

                {isOpen && (
                  <div id={`faq-panel-${index}`} className='px-5 md:px-6 pb-5 text-sm text-slate-600 leading-relaxed'>
                    {item.answer}
                  </div>
                )}
              </motion.div>
            )
          })}
        </motion.div>
      </motion.div>

      {/* Contact Section */}
      <motion.section
        initial='hidden'
        whileInView='visible'
        viewport={viewportOnce}
        variants={fadeUp}
        className='p-6 py-20 lg:px-32 w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,#d4f1e4,#eaf8f2_40%,#ffffff_80%)]'
        id='Contact'
      >
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-12'>
            <h1 className='text-3xl sm:text-5xl font-bold text-slate-900'>Start Your Property Acquisition <span className='text-brand'>Journey</span></h1>
            <p className='text-slate-600 mt-3 max-w-2xl mx-auto'>Tell us about your property needs and timeline, and we will guide you through the entire acquisition process with expert support.</p>
          </div>

          <motion.div variants={staggerContainer} className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
            <div className='lg:col-span-2 rounded-3xl bg-slate-900 text-white p-8 shadow-xl'>
              <p className='text-xs uppercase tracking-[0.2em] text-brand/70 font-semibold'>Fast consultation</p>
              <h2 className='text-2xl font-semibold mt-2'>Invest with confidence</h2>
              <p className='text-slate-300 mt-4 leading-relaxed'>Our team of experts will collaborate to find you the perfect property that meets your needs.</p>

              <div className='mt-8 space-y-4 text-sm'>
                <div className='rounded-xl bg-white/10 border border-white/15 p-4'>
                  <p className='text-brand/60 uppercase text-[10px] tracking-widest'>Average Reply</p>
                  <p className='mt-1 font-medium'>Within 24 hours</p>
                </div>
                <div className='rounded-xl bg-white/10 border border-white/15 p-4'>
                  <p className='text-brand/60 uppercase text-[10px] tracking-widest'>Office Hours</p>
                    <p className='mt-1 font-medium'>{COMPANY.officeHours}</p>
                </div>
              </div>
            </div>

            <motion.div variants={fadeUp} className='lg:col-span-3 rounded-3xl border border-slate-200 bg-white/95 backdrop-blur p-8 shadow-lg'>
              <form onSubmit={handleSubmit} className='text-slate-700'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='text-sm font-medium text-slate-700'>Your Name</label>
                    <input
                      className='w-full border border-slate-300 rounded-xl py-3 px-4 mt-2 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand'
                      type='text'
                      name='Name'
                      aria-label='Your Name'
                      autoComplete='name'
                      placeholder='Your full name'
                      required
                    />
                  </div>
                  <div>
                    <label className='text-sm font-medium text-slate-700'>Your Email</label>
                    <input
                      className='w-full border border-slate-300 rounded-xl py-3 px-4 mt-2 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand'
                      type='email'
                      name='Email'
                      aria-label='Your Email'
                      autoComplete='email'
                      placeholder='you@example.com'
                      required
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-5'>
                  <div>
                    <label className='text-sm font-medium text-slate-700'>Subject</label>
                    <select
                      className='w-full border border-slate-300 rounded-xl py-3 px-4 mt-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand'
                      name='Subject'
                      aria-label='Subject'
                      required
                      defaultValue=''
                    >
                      <option value='' disabled>Select a subject</option>
                      <option value='General Enquiry'>General Enquiry</option>
                      <option value='Property Purchase'>Property Purchase</option>
                      <option value='Inspection Request'>Inspection Request</option>
                      <option value='Support Request'>Support Request</option>
                      <option value='Partnership'>Partnership</option>
                    </select>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-slate-700'>Mobile Number</label>
                    <input
                      className='w-full border border-slate-300 rounded-xl py-3 px-4 mt-2 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand'
                      type='tel'
                      name='Mobile'
                      aria-label='Mobile Number'
                      autoComplete='tel'
                      placeholder='Mobile'
                    />
                  </div>
                </div>

                <div className='mt-5'>
                  <label className='hidden' aria-hidden='true'>
                    Company Website
                    <input type='text' name='Website' tabIndex={-1} autoComplete='off' />
                  </label>

                  <label className='text-sm font-medium text-slate-700'>Message</label>
                  <textarea
                    className='w-full border border-slate-300 rounded-xl py-3 px-4 mt-2 h-36 resize-none focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand'
                    name='Message'
                    aria-label='Message'
                    placeholder='Enter your message'
                    required
                  />
                </div>

                <label className='mt-5 flex items-start gap-3 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={consent}
                    onChange={(e) => handleConsentChange(e.target.checked)}
                    className='mt-0.5 w-4 h-4 accent-brand cursor-pointer shrink-0'
                  />
                  <span className='text-xs text-slate-500 leading-relaxed'>
                    I consent to {COMPANY.name} collecting and using my details to respond to this enquiry, in accordance with their{' '}
                    <Link to='/privacy-policy' className='text-brand underline underline-offset-2 hover:text-brand-strong'>Privacy Policy</Link>.
                  </span>
                </label>

                {contactError && <p role='alert' aria-live='assertive' className='text-sm text-red-600 mt-3'>{contactError}</p>}

                <div className='mt-4'>
                  <button disabled={!consent || isSubmitting || isOffline} className='bg-brand text-white py-3 px-10 rounded-xl font-medium hover:bg-brand-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
                    <span aria-live='polite'>{isOffline ? "You're offline" : statusText || 'Send Message'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
    </>
  )
}

export default Header
