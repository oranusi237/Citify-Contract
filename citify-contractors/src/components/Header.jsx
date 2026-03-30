import React, { useState, useEffect } from 'react'
import Navbar from './Navbar'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { assets, testimonialsData } from '../assets/index'
import { seedProjectsIfEmpty, subscribeToProjects } from '../utils/projectsStore'
import { toast } from 'react-toastify'
import { makeFadeUp, makeStaggerContainer, useMotionSettings, viewportOnce } from '../utils/motion'

const Header = () => {
  const [result, setResult] = useState("");
  const [contactError, setContactError] = useState('');
  const [consent, setConsent] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsToShow, setCardsToShow] = useState(1);
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [years, setYears] = useState(0);
  const [projects, setProjects] = useState(0);
  const [sqft, setSqft] = useState(0);
  const [ongoing, setOngoing] = useState(0);
  const motionSettings = useMotionSettings()
  const fadeUp = makeFadeUp(motionSettings)
  const staggerContainer = makeStaggerContainer(motionSettings)

  useEffect(() => {
    const duration = 1200;
    const intervalMs = 30;
    const steps = Math.ceil(duration / intervalMs);

    const animate = (target, setFn) => {
      let count = 0;
      const step = Math.ceil(target / steps);
      const timer = setInterval(() => {
        count += step;
        if (count >= target) {
          setFn(target);
          clearInterval(timer);
        } else {
          setFn(count);
        }
      }, intervalMs);
      return timer;
    };

    const timers = [
      animate(10, setYears),
      animate(15, setProjects),
      animate(12, setSqft),
      animate(25, setOngoing)
    ];

    return () => timers.forEach(clearInterval);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setCardsToShow(3);
      } else {
        setCardsToShow(1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const maxIndex = Math.max(featuredProjects.length - cardsToShow, 0);
    setCurrentIndex((prevIndex) => Math.min(prevIndex, maxIndex));
  }, [cardsToShow, featuredProjects.length]);

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
    const maxIndex = Math.max(featuredProjects.length - cardsToShow, 0);
    setCurrentIndex((prevIndex) => (prevIndex >= maxIndex ? 0 : prevIndex + 1));
  };

  const previousProject = () => {
    const maxIndex = Math.max(featuredProjects.length - cardsToShow, 0);
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? maxIndex : prevIndex - 1));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setContactError('');
    const formData = new FormData(event.target);
    const name = String(formData.get('Name') || '').trim();
    const email = String(formData.get('Email') || '').trim();
    const message = String(formData.get('Message') || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (name.length < 2) {
      setContactError('Please enter your name (at least 2 characters).');
      return;
    }
    if (!emailRegex.test(email)) {
      setContactError('Please enter a valid email address.');
      return;
    }
    if (message.length < 10) {
      setContactError('Please enter a message with at least 10 characters.');
      return;
    }
    if (!consent) {
      setContactError('Please agree to the privacy policy before submitting.');
      return;
    }

    setResult("Sending....");

    formData.append("access_key", "39b3e6de-e385-4b3a-92b9-44f8298021b9");

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      setResult("Form Submitted Successfully");
      toast.success("Form Submitted Successfully");
      event.target.reset();
    } else {
      console.log("Error", data);
      toast.error(data.message)
      setResult("");
    }
  };

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
                  <Link to="/contact" className=' bg-[#058F44] px-8 py-3 rounded inline-block text-white'>Contact Us</Link>
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
          <h1 className='text-2xl sm:text-4xl font-bold mb-2'>About <span className='underline underline-offset-4 decoration-1 font-light'>Citify</span></h1>
          <p className='text-gray-500 max-w-80 text-center mb-8'>Passionate about connecting investors and families with premium properties, delivering exceptional real estate solutions that exceed expectations and create lasting value.</p>
          <div className='flex flex-col md:flex-row items-center md:items-start md:gap-20'>
              <img src={assets.brand_img} alt="" className='w-full sm:w-1/2 max-w-lg' />
              <div className='flex flex-col items-center md:items-start mt-10 text-gray-600'>
                  <div className='grid grid-cols-2 gap-6 md:gap-10 w-full 2xl:pr-28'>
                     <div>
                      <p className='text-4xl font-medium text-gray-800'>{years > 0 ? years : 0}+</p>
                      <p>Years of Experience</p>
                     </div>
                     <div>
                      <p className='text-4xl font-medium text-gray-800'>{projects > 0 ? projects : 0}+</p>
                      <p>Properties Available</p>
                     </div>
                     <div>
                      <p className='text-4xl font-medium text-gray-800'>{sqft > 0 ? sqft : 0}+</p>
                      <p>Acres Developed</p>
                     </div>
                     <div>
                      <p className='text-4xl font-medium text-gray-800'>{ongoing > 0 ? ongoing : 0}+</p>
                      <p>Ongoing Developments</p>
                     </div>
                  </div>
                  <p className='my-10 max-w-lg '>Our core purpose is to restore balance and reliability to the industry by operating with uncompromising integrity and transparency. At Citify, we firmly believe in a client-first philosophy, prioritizing your peace of mind and long-term success over short-term profit maximization.</p>
                  <Link to="/about" className='bg-[#058F44] text-white px-8 py-2 rounded cursor-pointer inline-block'>Learn More</Link>
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
          <div className='rounded-4xl border border-[#058F44]/15 bg-[radial-gradient(circle_at_top_left,rgba(5,143,68,0.12),transparent_35%),linear-gradient(180deg,#f7fcf9_0%,#ffffff_62%)] p-6 sm:p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)]'>
            <h1 className='text-2xl sm:text-4xl font-bold mb-2 text-center'>Featured <span className='underline underline-offset-4 decoration-1 font-light'>Properties</span></h1>
            <p className='text-center text-slate-600 mb-8 max-w-2xl mx-auto'>Explore high-potential land listings in fast-growing locations, curated for serious buyers and smart investors.</p>

            <div className='flex justify-center items-center gap-3 mb-5'>
              <button onClick={previousProject} className='bg-white border border-slate-200 p-2.5 rounded-full hover:bg-slate-50 transition-colors shadow-sm'><img src={assets.left_arrow} alt='Previous' className='w-4 h-4'/></button>
              <button onClick={nextProject} className='bg-[#058F44] border border-[#058F44] p-2.5 rounded-full hover:bg-[#047335] transition-colors shadow-sm'><img src={assets.right_arrow} alt='Next' className='w-4 h-4 brightness-0 invert'/></button>
                    </div>

            <div className='overflow-hidden'>
              <motion.div variants={staggerContainer} className='flex gap-6 transition-transform duration-500 ease-in-out' style={{ transform: `translateX(-${currentIndex * (100 / cardsToShow)}%)` }}>
                {featuredProjects.map((project) => (
                  <motion.div variants={fadeUp} key={project.id} className='shrink-0 w-full md:w-1/2 lg:w-1/3'>
                    <Link to={`/property/${project.id}`} className='group block rounded-3xl overflow-hidden border border-slate-200 bg-white hover:shadow-[0_20px_45px_rgba(15,23,42,0.12)] transition-all h-full'>
                      <div className='relative overflow-hidden'>
                        <span className='absolute top-3 left-3 z-10 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.22em] px-2.5 py-1 rounded-full bg-white/90 text-[#058F44]'>Inspection Ready</span>
                        <div className='absolute inset-x-0 bottom-0 z-10 h-24 bg-linear-to-t from-slate-950/70 to-transparent' />
                        <img src={project.image} alt={project.title} className='w-full h-52 object-cover bg-gray-100 transition-transform duration-500 group-hover:scale-[1.04]' />
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
                <Link to="/properties" className='bg-[#058F44] text-white px-8 py-2.5 rounded-full cursor-pointer inline-block hover:bg-[#047335] transition-colors'>View All Properties</Link>
            </div>
          </div>
      </motion.div>

      {/* Testimonials Section */}
        <motion.div
          initial='hidden'
          whileInView='visible'
          viewport={viewportOnce}
          variants={fadeUp}
          className='container mx-auto py-12 lg:px-32 w-full overflow-hidden bg-linear-to-b from-slate-50 to-white my-20 rounded-3xl border border-slate-200'
          id='Testimonials'
        >
          <h1 className='text-2xl sm:text-4xl font-bold mb-2 text-center'>Customer <span className='underline underline-offset-4 decoration-1 font-light'>Testimonials</span></h1>
          <p className='text-center text-slate-500 mb-10 max-w-md mx-auto'>Real stories from clients who trusted us to deliver their dream spaces.</p>
          <motion.div variants={staggerContainer} className='grid grid-cols-1 md:grid-cols-2 gap-6 px-4 md:px-8'>
            {testimonialsData.slice(0, 2).map((testimonial, index) => (
              <motion.div variants={fadeUp} key={index} className='rounded-2xl border border-slate-200 bg-white shadow-sm p-7 md:p-8'>
                <div className='flex items-center justify-between mb-5'>
                <div>
                  <h2 className='text-lg text-slate-800 font-semibold'>{testimonial.name}</h2>
                  <p className='text-slate-500 text-sm'>{testimonial.title}</p>
                </div>
                <span className='text-3xl leading-none text-[#058F44]/70 font-serif' aria-hidden='true'>"</span>
                </div>
                <div className='flex gap-1 mb-4'>
                  {Array.from({length: testimonial.rating}, (_, starIndex)=> (
                    <img key={starIndex} src={assets.star_icon} alt='' className='w-4 h-4' />
                  ))}
                </div>
                <p className='text-slate-600 leading-relaxed'>{testimonial.text}</p>
              </motion.div>
            ))}
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
            <h1 className='text-3xl sm:text-5xl font-bold text-slate-900'>Start Your Property Acquisition <span className='text-[#058F44]'>Journey</span></h1>
            <p className='text-slate-600 mt-3 max-w-2xl mx-auto'>Tell us about your property needs and timeline, and we will guide you through the entire acquisition process with expert support.</p>
          </div>

          <motion.div variants={staggerContainer} className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
            <div className='lg:col-span-2 rounded-3xl bg-slate-900 text-white p-8 shadow-xl'>
              <p className='text-xs uppercase tracking-[0.2em] text-[#058F44]/70 font-semibold'>Fast consultation</p>
              <h2 className='text-2xl font-semibold mt-2'>Invest with confidence</h2>
              <p className='text-slate-300 mt-4 leading-relaxed'>Our team of experts will collaborate to find you the perfect property that meets your needs.</p>

              <div className='mt-8 space-y-4 text-sm'>
                <div className='rounded-xl bg-white/10 border border-white/15 p-4'>
                  <p className='text-[#058F44]/60 uppercase text-[10px] tracking-widest'>Average Reply</p>
                  <p className='mt-1 font-medium'>Within 24 hours</p>
                </div>
                <div className='rounded-xl bg-white/10 border border-white/15 p-4'>
                  <p className='text-[#058F44]/60 uppercase text-[10px] tracking-widest'>Office Hours</p>
                  <p className='mt-1 font-medium'>Mon - Fri, 9:00 AM - 5:00 PM</p>
                </div>
              </div>
            </div>

            <motion.div variants={fadeUp} className='lg:col-span-3 rounded-3xl border border-slate-200 bg-white/95 backdrop-blur p-8 shadow-lg'>
              <form onSubmit={onSubmit} className='text-slate-700'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='text-sm font-medium text-slate-700'>Your Name</label>
                    <input
                      className='w-full border border-slate-300 rounded-xl py-3 px-4 mt-2 focus:outline-none focus:ring-2 focus:ring-[#058F44]/20 focus:border-[#058F44]'
                      type='text'
                      name='Name'
                      placeholder='Your full name'
                      required
                    />
                  </div>
                  <div>
                    <label className='text-sm font-medium text-slate-700'>Your Email</label>
                    <input
                      className='w-full border border-slate-300 rounded-xl py-3 px-4 mt-2 focus:outline-none focus:ring-2 focus:ring-[#058F44]/20 focus:border-[#058F44]'
                      type='email'
                      name='Email'
                      placeholder='you@example.com'
                      required
                    />
                  </div>
                </div>

                <div className='mt-5'>
                  <label className='text-sm font-medium text-slate-700'>Message</label>
                  <textarea
                    className='w-full border border-slate-300 rounded-xl py-3 px-4 mt-2 h-36 resize-none focus:outline-none focus:ring-2 focus:ring-[#058F44]/20 focus:border-[#058F44]'
                    name='Message'
                    placeholder='Enter your message'
                    required
                  />
                </div>

                <label className='mt-5 flex items-start gap-3 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={consent}
                    onChange={(e) => { setConsent(e.target.checked); setContactError(''); }}
                    className='mt-0.5 w-4 h-4 accent-[#058F44] cursor-pointer shrink-0'
                  />
                  <span className='text-xs text-slate-500 leading-relaxed'>
                    I consent to Citify Contractors collecting and using my details to respond to this enquiry, in accordance with their{' '}
                    <Link to='/privacy-policy' className='text-[#058F44] underline underline-offset-2 hover:text-[#047335]'>Privacy Policy</Link>.
                  </span>
                </label>

                {contactError && <p className='text-sm text-red-600 mt-3'>{contactError}</p>}

                <div className='mt-4'>
                  <button disabled={!consent} className='bg-[#058F44] text-white py-3 px-10 rounded-xl font-medium hover:bg-[#047335] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
                    {result ? result : 'Send Message'}
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