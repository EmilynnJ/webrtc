import { useNavigate } from 'react-router-dom';

interface ErrorPageProps {
  title: string;
  message: string;
  showRetry?: boolean;
}

const ErrorPage = ({ title, message, showRetry = false }: ErrorPageProps) => {
  const navigate = useNavigate();

  const handleRetry = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    // Post message to parent window to handle navigation
    window.parent.postMessage({
      type: 'PSYCHIC_APP_ERROR',
      data: {
        title,
        message,
        timestamp: Date.now()
      }
    }, '*');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      <div className="glass-panel p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-900/50 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">{title}</h1>
        <p className="text-gray-300 mb-6">{message}</p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {showRetry && (
            <button
              className="psychic-btn"
              onClick={handleRetry}
            >
              Retry
            </button>
          )}
          
          <button
            className="psychic-btn-outline"
            onClick={handleGoBack}
          >
            Return to SoulSeer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;