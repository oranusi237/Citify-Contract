import React from 'react'
import Navbar from '../components/Navbar'
import About from '../components/About/About'
import WhyChooseUs from '../components/About/WhyChooseUs'
import Aboutsides from '../components/About/Aboutsides'
import Footer from '../components/Footer'

const AboutPage = () => {
  return (
    <div className='w-full overflow-hidden'>
      <Navbar />
      <div className='pt-20'>
        <About />
        <Aboutsides />
        <WhyChooseUs />
      </div>
      <Footer />
    </div>
  )
}

export default AboutPage
