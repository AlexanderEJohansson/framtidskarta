import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import stripe from '@/lib/stripe/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Inte inloggad' }, { status: 401 });
    }

    const { profileId } = await request.json();

    // Get profile's Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', profileId || user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'Ingen Stripe-kund hittad' }, { status: 404 });
    }

    const origin = request.nextUrl.origin;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/konto`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error('Portal error:', err);
    return NextResponse.json({ error: 'Kunde inte öppna prenumerationsportalen' }, { status: 500 });
  }
}