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
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center justify-center font-sans">
                    <div className="max-w-3xl w-full bg-gray-800 rounded-lg shadow-2xl p-6 border border-red-500/50">
                        <h1 className="text-3xl font-bold text-red-500 mb-4 flex items-center gap-2">
                            <span className="text-4xl">⚠️</span> Algo salió mal
                        </h1>
                        <div className="mb-6">
                            <p className="text-gray-300 mb-2">Se ha producido un error crítico en la aplicación.</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                            >
                                Recargar página
                            </button>
                        </div>

                        <div className="bg-black/50 p-4 rounded border border-gray-700 overflow-auto max-h-[60vh]">
                            <h3 className="text-lg font-semibold text-red-400 mb-2">Error:</h3>
                            <pre className="text-red-300 whitespace-pre-wrap font-mono text-sm mb-4">
                                {this.state.error && this.state.error.toString()}
                            </pre>

                            <h3 className="text-lg font-semibold text-gray-400 mb-2">Stack Trace:</h3>
                            <pre className="text-gray-500 whitespace-pre-wrap font-mono text-xs">
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
