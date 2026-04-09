import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className='min-h-screen flex items-center justify-center text-center px-4'>
          <div>
            <p className='text-slate-700 font-semibold text-lg'>Something went wrong.</p>
            <button
              type='button'
              onClick={() => window.location.reload()}
              className='mt-4 px-6 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-strong transition-colors'
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
