import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runSimplifiedAnalysis, runFullAnalysis } from '@/lib/ai/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Inte inloggad' }, { status: 401 });
    }

    const { cvText, profileId, isFreeSample } = await request.json();

    if (!cvText) {
      return NextResponse.json({ error: 'CV-text krävs' }, { status: 400 });
    }

    // Verify profile belongs to user
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, *')
      .eq('id', profileId || user.id)
      .single();

    const hasSubscription = profile?.subscription_tier === 'basic' || profile?.subscription_tier === 'premium';

    let result;

    if (isFreeSample || !hasSubscription) {
      // Free simplified analysis
      result = await runSimplifiedAnalysis(cvText);
    } else {
      // Full analysis for subscribers
      result = await runFullAnalysis(cvText, profile);
    }

    // Store analysis in database
    await supabase.from('analyses').insert({
      profile_id: profileId || user.id,
      cv_text: cvText,
      is_free_sample: result.isFreeSample,
      extracted_skills: result.skills,
      extracted_experience: result.experience,
      extracted_education: result.education,
      result_json: result,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('Analysis error:', err);
    return NextResponse.json({ error: 'Något gick fel vid analysen' }, { status: 500 });
  }
}