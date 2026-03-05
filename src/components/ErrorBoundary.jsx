import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '2rem',
                    margin: '2rem',
                    border: '1px solid #ff4d4f',
                    borderRadius: '8px',
                    backgroundColor: '#fff2f0',
                    color: '#d9363e',
                    fontFamily: 'sans-serif'
                }}>
                    <h2>Something went wrong.</h2>
                    <p>The application encountered an unexpected error.</p>
                    <pre style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        padding: '1rem',
                        borderRadius: '4px',
                        fontSize: '0.9rem'
                    }}>
                        {this.state.error && this.state.error.toString()}
                    </pre>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: '#d9363e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
