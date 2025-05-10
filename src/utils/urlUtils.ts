// Extract URL parameters for session
export const extractUrlParams = (): { userId?: string; readerId?: string; token?: string; sessionId?: string } => {
  const searchParams = new URLSearchParams(window.location.search);
  
  return {
    userId: searchParams.get('userId') || undefined,
    readerId: searchParams.get('readerId') || undefined,
    token: searchParams.get('token') || undefined,
    sessionId: searchParams.get('sessionId') || undefined
  };
};

// Validate required parameters
export const validateParams = (params: { userId?: string; readerId?: string; token?: string }) => {
  const { userId, readerId, token } = params;
  
  return Boolean(userId && readerId && token);
};

// Generate a unique session ID if one isn't provided
export const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};