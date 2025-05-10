import { Badge } from 'react-bootstrap';

interface SessionInfoProps {
  sessionDuration: number;
  amountCharged: number;
  remainingBalance: number;
  ratePerMinute: number;
}

export default function SessionInfo({
  sessionDuration,
  amountCharged,
  remainingBalance,
  ratePerMinute
}: SessionInfoProps) {
  // Format time display (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate estimated remaining time in minutes
  const estimatedMinutesRemaining = Math.floor(remainingBalance / ratePerMinute);

  return (
    <div className="position-absolute top-0 left-0 right-0 p-3">
      <div className="d-flex justify-content-center">
        <div className="bg-dark bg-opacity-75 rounded-pill px-4 py-2 text-white d-flex gap-4">
          {/* Session Duration */}
          <div className="d-flex align-items-center">
            <i className="bi bi-clock me-2"></i>
            <span>{formatTime(sessionDuration)}</span>
          </div>
          
          {/* Amount charged */}
          <div className="d-flex align-items-center text-danger">
            <i className="bi bi-cash me-2"></i>
            <span>${amountCharged.toFixed(2)}</span>
          </div>
          
          {/* Remaining balance */}
          <div className="d-flex align-items-center text-success">
            <i className="bi bi-wallet2 me-2"></i>
            <span>${remainingBalance.toFixed(2)}</span>
          </div>
          
          {/* Estimated time remaining */}
          <div className="d-flex align-items-center">
            <i className="bi bi-hourglass-split me-2"></i>
            <span>{estimatedMinutesRemaining} min left</span>
          </div>
        </div>
      </div>
    </div>
  );
}