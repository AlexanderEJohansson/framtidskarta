import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCheckoutSession } from '@/lib/stripe/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Inte inloggad' }, { status: 401 });
    }

    const { priceId } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID krävs' }, { status: 400 });
    }

    // Get profile to check for existing Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    const origin = request.nextUrl.origin;

    const session = await createCheckoutSession({
      priceId,
      customerId: profile?.stripe_customer_id,
      successUrl: `${origin}/konto?checkout=success`,
      cancelUrl: `${origin}/konto?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Kunde inte skapa checkout-session' }, { status: 500 });
  }
}