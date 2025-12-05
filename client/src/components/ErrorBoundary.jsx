import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', color: 'white', backgroundColor: '#1a1a2e', minHeight: '100vh', overflow: 'auto' }}>
                    <h1>Something went wrong.</h1>
                    <h3 style={{ color: '#ff6b6b' }}>{this.state.error && this.state.error.toString()}</h3>
                    <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                    <button
                        onClick={() => window.location.href = '/'}
                        style={{ marginTop: '20px', padding: '10px 20px', background: '#6b4c9a', border: 'none', borderRadius: '8px', color: 'white' }}
                    >
                        Return to Home
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
