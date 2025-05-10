import { useState, useEffect, useRef } from 'react';

export default function useSessionTimer(ratePerMinute: number) {
  const [sessionDuration, setSessionDuration] = useState(0);
  const [amountCharged, setAmountCharged] = useState(0);
  const [billingActive, setBillingActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const billingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastBillingTimeRef = useRef<number | null>(null);

  // Start the session timer
  const startTimer = () => {
    if (billingActive) return;
    
    const now = new Date();
    setSessionStartTime(now);
    lastBillingTimeRef.current = now.getTime();
    setBillingActive(true);
    
    // Update session duration every second
    timerIntervalRef.current = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);
    
    // Process billing every minute (or 10 seconds in development)
    const billingInterval = process.env.NODE_ENV === 'development' ? 10000 : 60000;
    billingIntervalRef.current = setInterval(async () => {
      processBilling();
    }, billingInterval);
  };

  // Stop the session timer
  const stopTimer = async () => {
    if (!billingActive) return;
    
    // Clear intervals
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    if (billingIntervalRef.current) {
      clearInterval(billingIntervalRef.current);
      billingIntervalRef.current = null;
    }
    
    setBillingActive(false);
    
    // Process final billing
    await processBilling();
  };

  // Process billing
  const processBilling = async () => {
    if (!lastBillingTimeRef.current || !sessionStartTime) return;
    
    const now = new Date().getTime();
    const timeSinceLastBilling = (now - lastBillingTimeRef.current) / 1000; // in seconds
    
    if (timeSinceLastBilling < 5) {
      return; // Don't bill for less than 5 seconds
    }
    
    const minutesElapsed = timeSinceLastBilling / 60;
    const amountToCharge = minutesElapsed * ratePerMinute;
    
    try {
      // Send billing request to server
      const response = await fetch('/api/payments/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'current-session-id', // This would be passed in as a prop
          amount: amountToCharge,
          duration: sessionDuration
        }),
      });
      
      if (response.ok) {
        setAmountCharged(prev => prev + amountToCharge);
        lastBillingTimeRef.current = now;
      } else {
        console.error('Failed to process payment');
        // Could implement fallback or retry logic here
      }
    } catch (error) {
      console.error('Error processing billing:', error);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      if (billingIntervalRef.current) {
        clearInterval(billingIntervalRef.current);
      }
    };
  }, []);

  return {
    sessionDuration,
    amountCharged,
    billingActive,
    sessionStartTime,
    startTimer,
    stopTimer
  };
}