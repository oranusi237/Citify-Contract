import React from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

const SitePageLayout = ({
  children,
  className = 'w-full overflow-hidden',
  contentClassName = 'pt-20',
  contentAs = 'div',
}) => {
  const ContentTag = contentAs

  return (
    <div className={className}>
      <Navbar />
      <ContentTag className={contentClassName}>{children}</ContentTag>
      <Footer />
    </div>
  )
}

export default SitePageLayout