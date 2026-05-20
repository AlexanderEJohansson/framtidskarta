import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !user) {
      console.error('Magic link callback error:', error);
      return NextResponse.redirect(new URL('/konto/inloggning?error=auth_failed', requestUrl.origin));
    }

    // Create profile if it doesn't exist
    const supabase2 = await createClient();
    const { data: existingProfile } = await supabase2
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingProfile) {
      await supabase2.from('profiles').insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        subscription_tier: 'none',
      });
    }

    return NextResponse.redirect(new URL('/konto', requestUrl.origin));
  }

  return NextResponse.redirect(new URL('/konto/inloggning', requestUrl.origin));
}