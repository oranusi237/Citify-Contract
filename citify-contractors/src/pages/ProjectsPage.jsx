import React from 'react'
import Navbar from '../components/Navbar'
import Projects from '../components/Projects'
import Footer from '../components/Footer'

const ProjectsPage = () => {
  return (
    <div className='w-full overflow-hidden'>
      <Navbar />
      <div className='pt-10'>
        <Projects />
      </div>
      <Footer />
    </div>
  )
}

export default ProjectsPage
