'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Profile {
  id: string;
  email: string;
  subscription_tier: string;
  full_name?: string;
}

export default function AccountPage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/konto/inloggning');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(data);
      setLoading(false);
    };

    getProfile();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile?.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPortalLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRIVAT_PRICE_ID,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-500">Laddar...</div>
      </div>
    );
  }

  const isSubscribed = profile?.subscription_tier === 'basic' || profile?.subscription_tier === 'premium';

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-[#0033A0] px-6 py-4">
          <h1 className="text-xl font-bold text-white">Mitt konto</h1>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Info */}
          <div>
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
              Profiluppgifter
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">E-post</span>
                <span className="font-medium text-slate-900">{profile?.email}</span>
              </div>
              {profile?.full_name && (
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Namn</span>
                  <span className="font-medium text-slate-900">{profile.full_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Subscription Status */}
          <div>
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
              Prenumeration
            </h2>
            <div className="bg-slate-50 rounded-lg p-4">
              {isSubscribed ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Full tillgang</p>
                    <p className="text-sm text-slate-500">Du har tillgang till full rapport</p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#00A651] text-white">
                    Aktiv
                  </span>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-slate-900 mb-1">Gratis provperiod</p>
                  <p className="text-sm text-slate-500 mb-4">
                    Du har tillgang till en gratis forenklad rapport.
                    Uppgradera for full tillgang.
                  </p>
                  <Button onClick={handleUpgrade} disabled={checkoutLoading}>
                    Kop full rapport — 19 kr/mån
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Subscription Actions */}
          {isSubscribed && (
            <div>
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                Hantera prenumeration
              </Button>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
              Snabba val
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/analys" className="btn-primary inline-block text-center">
                Gora ny analys
              </Link>
              <Button variant="outline" onClick={handleSignOut}>
                Logga ut
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}