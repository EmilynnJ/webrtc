import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SessionRoom from './components/SessionRoom';
import PreSession from './components/PreSession';
import { SessionProvider } from './contexts/SessionContext';
import ErrorPage from './components/ErrorPage';
import { extractUrlParams, validateParams } from './utils/urlUtils';
import './index.css';

const App = () => {
  const [isValidParams, setIsValidParams] = useState<boolean | null>(null);
  const [params, setParams] = useState<{
    userId?: string;
    readerId?: string;
    token?: string;
    sessionId?: string;
  }>({});

  useEffect(() => {
    const extractedParams = extractUrlParams();
    setParams(extractedParams);
    
    const isValid = validateParams(extractedParams);
    setIsValidParams(isValid);
    
    // If valid params, notify parent that app is ready
    if (isValid) {
      window.parent.postMessage({
        type: 'PSYCHIC_APP_READY',
        params: extractedParams
      }, '*');
    }
  }, []);

  if (isValidParams === null) {
    return <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
    </div>;
  }

  if (isValidParams === false) {
    return <ErrorPage 
      title="Invalid Session Parameters"
      message="We couldn't validate your session information. Please return to the main app and try again."
    />;
  }

  return (
    <BrowserRouter>
      <SessionProvider
        userId={params.userId || ''}
        readerId={params.readerId || ''}
        sessionId={params.sessionId || ''}
        token={params.token || ''}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/pre-session" />} />
          <Route path="/pre-session" element={<PreSession />} />
          <Route path="/session" element={<SessionRoom />} />
          <Route path="*" element={<Navigate to="/pre-session" />} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  );
};

export default App;