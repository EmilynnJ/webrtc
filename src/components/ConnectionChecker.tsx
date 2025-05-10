import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface ConnectionCheckerProps {
  onTestComplete: (success: boolean) => void;
}

const ConnectionChecker = ({ onTestComplete }: ConnectionCheckerProps) => {
  const [isChecking, setIsChecking] = useState(false);
  const [networkSpeed, setNetworkSpeed] = useState<number | null>(null);
  const [networkQuality, setNetworkQuality] = useState<'good' | 'fair' | 'poor' | null>(null);
  const [testCompleted, setTestCompleted] = useState(false);
  
  const runConnectionTest = async () => {
    setIsChecking(true);
    setNetworkSpeed(null);
    setNetworkQuality(null);
    
    try {
      // Test WebRTC readiness
      if (!navigator.mediaDevices || !window.RTCPeerConnection) {
        throw new Error('WebRTC is not supported in your browser');
      }
      
      // Check for network connectivity (simplified test)
      const startTime = Date.now();
      const response = await fetch('https://www.google.com', { 
        mode: 'no-cors',
        cache: 'no-cache'
      });
      
      if (!response) {
        throw new Error('Network test failed');
      }
      
      // Calculate rough network speed (simplified)
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const estimatedSpeed = 1000 / responseTime * 5; // Very rough estimate
      
      setNetworkSpeed(Math.round(estimatedSpeed));
      
      // Determine quality rating
      let quality: 'good' | 'fair' | 'poor';
      if (estimatedSpeed > 3) {
        quality = 'good';
      } else if (estimatedSpeed > 1) {
        quality = 'fair';
      } else {
        quality = 'poor';
      }
      
      setNetworkQuality(quality);
      setTestCompleted(true);
      
      // Report success if quality is at least fair
      onTestComplete(quality !== 'poor');
      
      if (quality === 'poor') {
        toast.warning('Your connection may not be stable enough for video calls.');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      toast.error('Failed to test your connection');
      onTestComplete(false);
    } finally {
      setIsChecking(false);
    }
  };
  
  // Auto-run test when component mounts
  useEffect(() => {
    runConnectionTest();
  }, []);
  
  return (
    <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Connection Test</h3>
      
      {isChecking ? (
        <div className="flex flex-col items-center justify-center py-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500 border-r-2 mb-3"></div>
          <p>Testing your connection...</p>
        </div>
      ) : testCompleted ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Network quality:</span>
            <span className={`font-semibold px-3 py-1 rounded-full ${
              networkQuality === 'good' 
                ? 'bg-green-900/50 text-green-400' 
                : networkQuality === 'fair'
                ? 'bg-yellow-900/50 text-yellow-400'
                : 'bg-red-900/50 text-red-400'
            }`}>
              {networkQuality === 'good' 
                ? 'Good' 
                : networkQuality === 'fair'
                ? 'Fair'
                : 'Poor'}
            </span>
          </div>
          
          {networkSpeed !== null && (
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Estimated speed:</span>
              <span className="font-semibold">{networkSpeed} Mbps</span>
            </div>
          )}
          
          {networkQuality === 'poor' && (
            <div className="mt-3 text-red-400 text-sm">
              <p>Your connection may experience issues during the video call.</p>
              <p>Try moving closer to your Wi-Fi router or using a wired connection.</p>
            </div>
          )}
          
          <button 
            onClick={runConnectionTest}
            className="psychic-btn-outline w-full mt-2"
          >
            Test Again
          </button>
        </div>
      ) : (
        <button 
          onClick={runConnectionTest}
          className="psychic-btn w-full"
        >
          Start Connection Test
        </button>
      )}
    </div>
  );
};

export default ConnectionChecker;