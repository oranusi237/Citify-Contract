import React from 'react'

const LoadingPage = () => {
  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4'>
      <div className='w-12 h-12 rounded-full border-4 border-[#058F44]/20 border-t-[#058F44] animate-spin' />
      <p className='text-gray-500 text-sm font-medium'>Loading...</p>
    </div>
  )
}

export default LoadingPage
