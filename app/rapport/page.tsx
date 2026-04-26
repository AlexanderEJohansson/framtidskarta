'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface AnalysisResult {
  skills: string[];
  experience: string[];
  education: string[];
  gap_summary_sv: string;
  recommendations: string[];
  matched_occupations: string[];
  education_paths: string[];
  isFreeSample: false;
}

export default function ReportPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [profileId, setProfileId] = useState('');

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/konto/inloggning');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, id')
        .eq('id', user.id)
        .single();

      setProfileId(user.id);
      setHasSubscription(profile?.subscription_tier === 'basic' || profile?.subscription_tier === 'premium');

      // Get latest analysis
      if (profile?.subscription_tier === 'basic' || profile?.subscription_tier === 'premium') {
        const { data: analysis } = await supabase
          .from('analyses')
          .select('result_json')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (analysis?.result_json) {
          setResult(analysis.result_json as AnalysisResult);
        }
      }

      setLoading(false);
    };

    checkAccess();
  }, [router, supabase]);

  const handleRunAnalysis = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get CV text from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('cv_text')
      .eq('id', profileId)
      .single();

    if (!profile?.cv_text) {
      router.push('/analys');
      return;
    }

    const res = await fetch('/api/analys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cvText: profile.cv_text,
        profileId,
        isFreeSample: false,
      }),
    });

    const data = await res.json();

    if (data.error) {
      console.error(data.error);
      return;
    }

    setResult(data);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-500">Laddar...</div>
      </div>
    );
  }

  // Not subscribed - show paywall
  if (!hasSubscription) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Full rapport kräver prenumeration</h1>
          <p className="text-slate-500 mb-6">
            Du har tillgång till en gratis förenklad rapport. Uppgradera för att se fullständig gap-analys.
          </p>
          <Link href="/konto">
            <Button>Köp full rapport — 19 kr/mån</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Subscribed but no result yet
  if (!result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Din fulla rapport</h1>
          <p className="text-slate-500 mb-6">
            Du har tillgång till fullständig gap-analys. Kör en analys för att se din rapport.
          </p>
          <Button onClick={handleRunAnalysis}>
            Kör full analys
          </Button>
        </div>
      </div>
    );
  }

  // Show full report
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Din fulla rapport</h1>

        {/* Subscription Badge */}
        <div className="mb-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#00A651] text-white">
            Full tillgang
          </span>
        </div>

        {/* Skills */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
            Dina kompetenser
          </h2>
          <div className="flex flex-wrap gap-2">
            {result.skills.map((skill, i) => (
              <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
            Erfarenhet
          </h2>
          <div className="flex flex-wrap gap-2">
            {result.experience.map((exp, i) => (
              <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                {exp}
              </span>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
            Utbildning
          </h2>
          <div className="flex flex-wrap gap-2">
            {result.education.map((edu, i) => (
              <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                {edu}
              </span>
            ))}
          </div>
        </div>

        {/* Gap Summary */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
            Gap-analys
          </h2>
          <p className="text-slate-700">{result.gap_summary_sv}</p>
        </div>

        {/* Recommendations */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
            Rekommendationer
          </h2>
          <ul className="space-y-2">
            {result.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#00A651] mt-1">•</span>
                <span className="text-slate-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Matched Occupations */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
            Matcherade yrken
          </h2>
          <div className="flex flex-wrap gap-2">
            {result.matched_occupations.map((occ, i) => (
              <span key={i} className="px-3 py-1 bg-[#0033A0]/10 text-[#0033A0] rounded-full text-sm">
                {occ}
              </span>
            ))}
          </div>
        </div>

        {/* Education Paths */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
            Utbildningsvägar
          </h2>
          <ul className="space-y-2">
            {result.education_paths.map((path, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#0033A0] mt-1">•</span>
                <span className="text-slate-700">{path}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="text-center">
        <Link href="/analys">
          <Button variant="outline">Gör ny analys</Button>
        </Link>
      </div>
    </div>
  );
}