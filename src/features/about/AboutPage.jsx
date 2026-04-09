import React from 'react'
import About from './components/About'
import WhyChooseUs from './components/WhyChooseUs'
import Aboutsides from './components/Aboutsides'
import SitePageLayout from '../../shared/components/SitePageLayout'

const AboutPage = () => {
  return (
    <SitePageLayout>
      <div>
        <About />
        <Aboutsides />
        <WhyChooseUs />
      </div>
    </SitePageLayout>
  )
}

export default AboutPage
