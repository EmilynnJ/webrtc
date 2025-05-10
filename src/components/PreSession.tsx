import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSession } from '../contexts/SessionContext';
import DeviceSelection from './DeviceSelection';
import ConnectionChecker from './ConnectionChecker';

const PreSession = () => {
  const navigate = useNavigate();
  const { 
    reader, 
    userBalance, 
    startSession, 
    sessionStatus,
    userId,
    readerId,
    token
  } = useSession();
  
  const [mediaPermissionGranted, setMediaPermissionGranted] = useState<boolean | null>(null);
  const [isConnectionReady, setIsConnectionReady] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  
  // Check if all required session parameters are available
  useEffect(() => {
    if (!userId || !readerId || !token) {
      toast.error('Missing session parameters');
      navigate('/');
    }
  }, [userId, readerId, token, navigate]);
  
  // Auto-start session when reader data and connection are ready
  useEffect(() => {
    const autoStartSession = async () => {
      if (reader && userBalance && isConnectionReady && sessionStatus === 'waiting') {
        try {
          await startSession();
          navigate('/session');
        } catch (error) {
          console.error('Failed to auto-start session:', error);
          toast.error('Failed to start session automatically');
        }
      }
    };
    
    autoStartSession();
  }, [reader, userBalance, isConnectionReady, sessionStatus, startSession, navigate]);
  
  // Handle media permission check
  const checkMediaPermissions = async () => {
    try {
      setIsCheckingConnection(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      
      // Success - permissions granted
      setMediaPermissionGranted(true);
      
      // Clean up the test stream
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Media permission error:', error);
      setMediaPermissionGranted(false);
      toast.error('Camera or microphone access denied');
    } finally {
      setIsCheckingConnection(false);
    }
  };
  
  // Check permissions when component mounts
  useEffect(() => {
    checkMediaPermissions();
  }, []);
  
  // Handle connection test completion
  const handleConnectionTestComplete = (success: boolean) => {
    setIsConnectionReady(success);
    if (success) {
      toast.success('Your connection is ready!');
    }
  };
  
  // Calculate if session can be started based on balance and rate
  const sufficientBalance = userBalance && reader 
    ? userBalance.availableBalance >= reader.minimumSessionAmount
    : false;
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-xl glass-panel p-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-center mb-6 text-purple-300">
          Preparing Your Psychic Reading
        </h1>
        
        {/* Reader info */}
        {reader && (
          <div className="mb-6 bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="relative w-16 h-16 overflow-hidden rounded-full border-2 border-purple-500">
                {reader.profileImage ? (
                  <img 
                    src={reader.profileImage} 
                    alt={reader.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-purple-900">
                    <span className="text-xl font-bold">{reader.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{reader.name}</h2>
                <p className="text-gray-300">{reader.specialty}</p>
                <p className="text-purple-400 font-semibold">
                  ${reader.ratePerMinute.toFixed(2)}/minute
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Balance info */}
        {userBalance && reader && (
          <div className="mb-6 p-4 rounded-lg bg-gray-800/50">
            <h3 className="text-lg font-semibold mb-2">Your Balance</h3>
            <p className="text-xl font-bold text-green-400">
              ${userBalance.availableBalance.toFixed(2)} available
            </p>
            {!sufficientBalance && (
              <p className="mt-2 text-red-400">
                You need at least ${reader.minimumSessionAmount.toFixed(2)} to start a session with this reader.
              </p>
            )}
            <p className="mt-2 text-gray-400 text-sm">
              Estimated session time: {Math.floor(userBalance.availableBalance / reader.ratePerMinute)} minutes
            </p>
          </div>
        )}
        
        {/* Device selection */}
        {mediaPermissionGranted === true && (
          <DeviceSelection />
        )}
        
        {/* Connection test */}
        {mediaPermissionGranted === true && (
          <ConnectionChecker 
            onTestComplete={handleConnectionTestComplete}
          />
        )}
        
        {/* Permission error */}
        {mediaPermissionGranted === false && (
          <div className="bg-red-900/30 border border-red-700 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold text-red-400 mb-2">Camera/Microphone Access Required</h3>
            <p className="mb-4">Please allow access to your camera and microphone to continue.</p>
            <button 
              className="psychic-btn w-full"
              onClick={checkMediaPermissions}
            >
              Try Again
            </button>
          </div>
        )}
        
        {/* Start session button */}
        <button
          className="psychic-btn w-full mt-4"
          disabled={!isConnectionReady || !sufficientBalance || sessionStatus !== 'waiting' || isCheckingConnection}
          onClick={() => startSession()}
        >
          {sessionStatus === 'connecting' ? 'Connecting...' : 'Start Session'}
        </button>
        
        {/* Help text */}
        <p className="text-center text-gray-400 mt-4 text-sm">
          By starting this session, you agree that you will be charged at a rate of 
          ${reader?.ratePerMinute.toFixed(2)}/minute.
        </p>
      </div>
    </div>
  );
};

export default PreSession;