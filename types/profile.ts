// Profile and subscription types for Framtidskarta

export type SubscriptionTier = 'none' | 'basic' | 'premium';

export interface Profile {
  id: string;
  email: string;
  created_at: string;
  subscription_tier: SubscriptionTier;
  stripe_customer_id?: string;
  full_name?: string;
  phone?: string;
  location?: string;
  // CV extracted data
  cv_text?: string;
  extracted_skills?: string[];
  extracted_experience?: string[];
  extracted_education?: string[];
}

export interface SubscriptionStatus {
  isActive: boolean;
  tier: SubscriptionTier;
  customerId?: string;
  currentPeriodEnd?: string;
}

// For Stripe webhook handling
export interface StripeWebhookPayload {
  type: string;
  data: {
    object: {
      customer: string;
      subscription?: string;
      metadata?: {
        profileId?: string;
      };
    };
  };
}