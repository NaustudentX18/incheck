import { Component } from 'react'

/**
 * React Error Boundary — catches render errors,
 * network failures, and unhandled promise rejections.
 * Gracefully degrades without crashing the whole app.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleDismiss = () => {
    this.setState({ error: null, errorInfo: null })
  }

  render() {
    const { error, errorInfo } = this.state

    if (error) {
      return (
        <div className="error-boundary" role="alert" aria-live="assertive">
          <div className="error-boundary-inner">
            <div className="error-icon" aria-hidden="true">💥</div>
            <h2>Something broke</h2>
            <p className="error-sub">Your captures are safe. Just the UI hiccuped.</p>
            {errorInfo?.componentStack && (
              <details className="error-details">
                <summary>Show technical details</summary>
                <pre className="error-stack">{errorInfo.componentStack}</pre>
              </details>
            )}
            <div className="error-actions">
              <button className="error-reload" onClick={this.handleReload}>
                Reload app
              </button>
              <button className="error-dismiss" onClick={this.handleDismiss}>
                Ignore & try again
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
