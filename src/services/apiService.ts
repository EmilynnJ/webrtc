import { ReaderInfo, UserBalance } from '../types';

// API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://soulseer-api.onrender.com';

// Generic fetch function with error handling
const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `API error: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// Get reader details
export const getReaderDetails = async (readerId: string, token: string): Promise<ReaderInfo> => {
  return fetchApi(`/readers/${readerId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Get user balance
export const getUserBalance = async (userId: string, token: string): Promise<UserBalance> => {
  return fetchApi(`/users/${userId}/balance`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Create a payment intent with Stripe
export const createStripePaymentIntent = async (
  amount: number,
  existingPaymentIntentId?: string
): Promise<{
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  error?: string;
}> => {
  try {
    // If we're in development mode, just simulate a successful payment
    if (import.meta.env.DEV) {
      return {
        success: true,
        paymentIntentId: existingPaymentIntentId || `pi_dev_${Date.now()}`,
        clientSecret: 'dummy_secret'
      };
    }

    const endpoint = existingPaymentIntentId 
      ? `/payments/update-intent/${existingPaymentIntentId}`
      : '/payments/create-intent';
    
    const response = await fetchApi(endpoint, {
      method: existingPaymentIntentId ? 'PATCH' : 'POST',
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents for Stripe
      }),
    });

    return {
      success: true,
      paymentIntentId: response.paymentIntentId,
      clientSecret: response.clientSecret,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed',
    };
  }
};

// Record session information to the database
export const recordSession = async (
  sessionId: string,
  userId: string,
  readerId: string,
  duration: number,
  amount: number,
  token: string
): Promise<{ success: boolean }> => {
  try {
    await fetchApi('/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sessionId,
        userId,
        readerId,
        duration,
        amount,
      }),
    });

    return { success: true };
  } catch (error) {
    console.error('Error recording session:', error);
    return { success: false };
  }
};