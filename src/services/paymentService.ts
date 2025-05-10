import { createStripePaymentIntent } from './apiService';

// Store session payment info to avoid redundant API calls
const sessionPayment = {
  paymentIntentId: '',
  amountPaid: 0
};

// Process payment for the session
export const processPayment = async (amount: number): Promise<{ success: boolean; error?: string }> => {
  try {
    // Skip if amount is too small (less than $0.50)
    if (amount < 0.5) {
      // For very small amounts, just track locally and process later
      sessionPayment.amountPaid += amount;
      return { success: true };
    }
    
    // In real implementation, would call Stripe API to capture payment
    const paymentResult = await createStripePaymentIntent(
      amount + sessionPayment.amountPaid,  // Include any accumulated small amounts
      sessionPayment.paymentIntentId
    );
    
    if (paymentResult.success) {
      // Store payment intent ID for future charges
      sessionPayment.paymentIntentId = paymentResult.paymentIntentId;
      sessionPayment.amountPaid = 0; // Reset accumulated amount
      
      return { success: true };
    } else {
      return { 
        success: false, 
        error: paymentResult.error || 'Payment processing failed'
      };
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown payment error'
    };
  }
};

// Get current payment status
export const getPaymentStatus = () => {
  return {
    paymentIntentId: sessionPayment.paymentIntentId,
    amountPaid: sessionPayment.amountPaid
  };
};