import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useWebRTC from '../hooks/useWebRTC';
import useMediaDevices from '../hooks/useMediaDevices';
import useSessionTimer from '../hooks/useSessionTimer';
import useChat from '../hooks/useChat';
import { getReaderDetails, getUserBalance } from '../services/apiService';
import { ReaderInfo, UserBalance } from '../types';

interface SessionContextType {
  userId: string;
  readerId: string;
  sessionId: string;
  token: string;
  reader: ReaderInfo | null;
  userBalance: UserBalance | null;
  sessionStatus: 'waiting' | 'connecting' | 'connected' | 'ended' | 'error';
  sessionDuration: number;
  sessionStartTime: number | null;
  amountCharged: number;
  remainingBalance: number;
  // WebRTC states and controls
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  isChatOpen: boolean;
  connectionStatus: string;
  chatMessages: Array<{ sender: string, message: string, timestamp: number }>;
  // Methods
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleChat: () => void;
  sendChatMessage: (message: string) => void;
  startSession: () => Promise<void>;
  endSession: (reason?: string) => void;
  // Device selection
  availableAudioInputs: MediaDeviceInfo[];
  availableVideoInputs: MediaDeviceInfo[];
  selectedAudioInput: string;
  selectedVideoInput: string;
  setSelectedAudioInput: (deviceId: string) => void;
  setSelectedVideoInput: (deviceId: string) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
  userId: string;
  readerId: string;
  sessionId: string;
  token: string;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ 
  children, 
  userId, 
  readerId, 
  sessionId,
  token 
}) => {
  const navigate = useNavigate();
  const [reader, setReader] = useState<ReaderInfo | null>(null);
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'waiting' | 'connecting' | 'connected' | 'ended' | 'error'>('waiting');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [remainingBalance, setRemainingBalance] = useState(0);

  // Initialize hooks
  const { 
    localStream, 
    remoteStream, 
    isAudioMuted, 
    isVideoOff,
    connectionStatus,
    toggleAudio, 
    toggleVideo,
    connectPeer,
    disconnectPeer,
  } = useWebRTC(sessionId, userId, readerId);

  const {
    availableAudioInputs,
    availableVideoInputs,
    selectedAudioInput,
    selectedVideoInput,
    setSelectedAudioInput,
    setSelectedVideoInput
  } = useMediaDevices(localStream);

  const { 
    sessionDuration, 
    sessionStartTime, 
    amountCharged,
    startTimer, 
    stopTimer 
  } = useSessionTimer(reader?.ratePerMinute || 0);

  const { chatMessages, sendMessage } = useChat(sessionId, userId);

  // Load reader details and user balance
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Fetch reader details
        const readerData = await getReaderDetails(readerId, token);
        setReader(readerData);
        
        // Fetch user balance
        const balanceData = await getUserBalance(userId, token);
        setUserBalance(balanceData);
        setRemainingBalance(balanceData.availableBalance);
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('Failed to load session data');
        setSessionStatus('error');
      }
    };

    if (userId && readerId && token) {
      loadInitialData();
    }
  }, [userId, readerId, token]);

  // Monitor balance and end call if insufficient funds
  useEffect(() => {
    if (sessionStatus === 'connected' && remainingBalance <= 0) {
      endSession('insufficient_funds');
    }
  }, [remainingBalance, sessionStatus]);

  // Update remaining balance as session progresses
  useEffect(() => {
    if (userBalance) {
      setRemainingBalance(userBalance.availableBalance - amountCharged);
    }
  }, [amountCharged, userBalance]);

  // Notify parent window of session events
  useEffect(() => {
    const notifyParent = () => {
      if (sessionStatus === 'connected' || sessionStatus === 'ended') {
        window.parent.postMessage({
          type: sessionStatus === 'connected' ? 'PSYCHIC_SESSION_STARTED' : 'PSYCHIC_SESSION_ENDED',
          data: {
            sessionId,
            userId,
            readerId,
            duration: sessionDuration,
            amountCharged,
            timestamp: Date.now()
          }
        }, '*');
      }
    };

    notifyParent();
  }, [sessionStatus, sessionDuration, amountCharged, sessionId, userId, readerId]);

  // Start the WebRTC session
  const startSession = async (): Promise<void> => {
    try {
      setSessionStatus('connecting');
      
      // Initialize WebRTC connection
      await connectPeer();
      
      // Start session timer for billing
      startTimer();
      
      setSessionStatus('connected');
      navigate('/session');
      
      toast.success('Session connected successfully');
    } catch (error) {
      console.error('Failed to start session:', error);
      setSessionStatus('error');
      toast.error('Failed to establish connection');
    }
  };

  // End the WebRTC session
  const endSession = (reason?: string): void => {
    // Stop timer and disconnect WebRTC
    stopTimer();
    disconnectPeer();
    
    // Set session status to ended
    setSessionStatus('ended');
    
    // Show appropriate message based on reason
    if (reason === 'insufficient_funds') {
      toast.info('Session ended: Your balance is depleted');
    } else if (reason === 'reader_disconnected') {
      toast.info('Session ended: Reader disconnected');
    } else if (reason === 'user_ended') {
      toast.info('You ended the session');
    } else {
      toast.info('Session ended');
    }
    
    // Notify parent window with final session data
    window.parent.postMessage({
      type: 'PSYCHIC_SESSION_ENDED',
      data: {
        sessionId,
        userId,
        readerId,
        duration: sessionDuration,
        amountCharged,
        reason: reason || 'user_ended',
        timestamp: Date.now()
      }
    }, '*');
  };

  // Toggle chat panel
  const toggleChat = (): void => {
    setIsChatOpen(!isChatOpen);
  };

  // Send chat message
  const sendChatMessage = (message: string): void => {
    if (message.trim()) {
      sendMessage(message);
    }
  };

  // Context value
  const value: SessionContextType = {
    userId,
    readerId,
    sessionId,
    token,
    reader,
    userBalance,
    sessionStatus,
    sessionDuration,
    sessionStartTime,
    amountCharged,
    remainingBalance,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoOff,
    isChatOpen,
    connectionStatus,
    chatMessages,
    toggleAudio,
    toggleVideo,
    toggleChat,
    sendChatMessage,
    startSession,
    endSession,
    availableAudioInputs,
    availableVideoInputs,
    selectedAudioInput,
    selectedVideoInput,
    setSelectedAudioInput,
    setSelectedVideoInput
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};