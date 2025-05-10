import { useSession } from '../contexts/SessionContext';

const SessionInfo = () => {
  const { 
    sessionDuration, 
    amountCharged, 
    remainingBalance,
    reader
  } = useSession();
  
  // Format session duration to MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };
  
  // Calculate estimated remaining time in minutes
  const estimatedMinutesRemaining = reader?.ratePerMinute 
    ? Math.floor(remainingBalance / reader.ratePerMinute)
    : 0;

  return (
    <div className="absolute top-4 left-4 right-4 flex flex-wrap justify-between items-center glass-panel p-3 rounded-lg">
      <div className="flex items-center space-x-2">
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="timer-display">
          {formatDuration(sessionDuration)}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="timer-display text-red-300">
          {formatCurrency(amountCharged)}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <div className="timer-display text-green-300">
          {formatCurrency(remainingBalance)}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <div className="timer-display text-blue-300">
          {estimatedMinutesRemaining} min left
        </div>
      </div>
    </div>
  );
};

export default SessionInfo;