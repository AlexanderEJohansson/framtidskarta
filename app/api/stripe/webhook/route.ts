import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import stripe from '@/lib/stripe/client';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Ingen signatur' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Ogiltig signatur' }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        // Get the profile ID from metadata or look up by email
        const profileId = session.metadata?.profileId;

        if (profileId) {
          // Update profile with Stripe customer ID and subscription tier
          await supabase
            .from('profiles')
            .update({
              stripe_customer_id: customerId,
              subscription_tier: 'basic', // Default to basic for privat
            })
            .eq('id', profileId);
        } else if (session.customer_email) {
          // Fallback: look up profile by email
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', session.customer_email)
            .single();

          if (profile) {
            await supabase
              .from('profiles')
              .update({
                stripe_customer_id: customerId,
                subscription_tier: 'basic',
              })
              .eq('id', profile.id);
          }
        }

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        // Find profile and update tier
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          const tier = subscription.status === 'active' ? 'basic' : 'none';
          await supabase
            .from('profiles')
            .update({ subscription_tier: tier })
            .eq('id', profile.id);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        // Find profile and remove subscription
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ subscription_tier: 'none' })
            .eq('id', profile.id);
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
