import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
});

export const STRIPE_PRICES = {
  private: process.env.NEXT_PUBLIC_STRIPE_PRIVAT_PRICE_ID!,
  b2b: process.env.NEXT_PUBLIC_STRIPE_B2B_PRICE_ID!,
} as const;

export async function createCheckoutSession({
  priceId,
  customerId,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{price: priceId, quantity: 1}],
    customer: customerId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    locale: 'sv',
    currency: 'sek',
  });
  return session;
}

export async function createCustomer({email}: {email: string}) {
  return stripe.customers.create({email, locale: 'sv'});
}

export async function getSubscription(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId);
}

export default stripe;
