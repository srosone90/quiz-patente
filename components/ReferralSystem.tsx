'use client';

import { useEffect, useState } from 'react';
import { Share2, Copy, Gift, Users, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ReferralData {
  code: string;
  referrals: Array<{
    id: string;
    status: string;
    created_at: string;
    completed_at: string | null;
  }>;
  rewardsEarned: number;
}

export default function ReferralSystem() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadReferralData();
    }
  }, [userId]);

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  }

  const loadReferralData = async () => {
    setLoading(true);
    
    // Get or create referral code
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    let referralCode = profile?.referral_code;
    
    if (!referralCode) {
      // Generate unique referral code
      referralCode = generateReferralCode();
      await supabase
        .from('user_profiles')
        .update({ referral_code: referralCode })
        .eq('id', userId);
    }

    // Get referrals made by this user
    const { data: referrals } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });

    const completed = referrals?.filter(r => r.status === 'completed').length || 0;
    const rewardsEarned = Math.floor(completed / 3); // 1 reward ogni 3 referral

    setReferralData({
      code: referralCode,
      referrals: referrals || [],
      rewardsEarned
    });

    setLoading(false);
  };

  const generateReferralCode = (): string => {
    if (!userId) return 'QUIZDEFAULT';
    return `QUIZ${userId.slice(0, 6).toUpperCase()}`;
  };

  const getReferralLink = (): string => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/login?ref=${referralData?.code}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getReferralLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareReferral = async () => {
    const shareData = {
      title: 'Quiz Patente - Preparati per l\'esame!',
      text: `Usa il mio codice referral e ottieni accesso premium! Codice: ${referralData?.code}`,
      url: getReferralLink()
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      copyToClipboard();
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    );
  }

  if (!referralData) return null;

  const completedReferrals = referralData.referrals.filter(r => r.status === 'completed').length;
  const pendingReferrals = referralData.referrals.filter(r => r.status === 'pending').length;
  const nextRewardIn = 3 - (completedReferrals % 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="w-8 h-8" />
          <div>
            <h3 className="text-2xl font-bold">Programma Referral</h3>
            <p className="text-purple-100 text-sm">Invita amici e guadagna premi!</p>
          </div>
        </div>

        <div className="bg-white/20 rounded-lg p-4 backdrop-blur">
          <div className="text-sm mb-2 opacity-90">Il tuo codice referral:</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/30 rounded px-4 py-3 font-mono text-lg font-bold">
              {referralData.code}
            </div>
            <button
              onClick={copyToClipboard}
              className="bg-white text-purple-600 p-3 rounded hover:bg-purple-50 transition-colors"
              title="Copia link"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
            <button
              onClick={shareReferral}
              className="bg-white text-purple-600 p-3 rounded hover:bg-purple-50 transition-colors"
              title="Condividi"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Inviti Totali</span>
          </div>
          <div className="text-2xl font-bold">{referralData.referrals.length}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Completati</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{completedReferrals}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Premi Ottenuti</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">{referralData.rewardsEarned}</div>
          <div className="text-xs text-gray-500 mt-1">{nextRewardIn} per prossimo premio</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">In Attesa</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">{pendingReferrals}</div>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Come funziona?</h4>
        <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li className="flex gap-2">
            <span className="font-bold">1.</span>
            <span>Condividi il tuo link referral con amici</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">2.</span>
            <span>I tuoi amici si registrano usando il tuo codice</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">3.</span>
            <span>Quando completano 5 quiz, il referral è "completato"</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">4.</span>
            <span>Ogni 3 referral completati = <strong>1 mese premium gratis!</strong></span>
          </li>
        </ol>
      </div>

      {/* Referral History */}
      {referralData.referrals.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Storico Inviti</h4>
          <div className="space-y-2">
            {referralData.referrals.map((ref) => (
              <div
                key={ref.id}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    ref.status === 'completed' ? 'bg-green-500' : 
                    ref.status === 'rewarded' ? 'bg-purple-500' : 'bg-orange-500'
                  }`}></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Invito del {new Date(ref.created_at).toLocaleDateString('it-IT')}
                  </span>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  ref.status === 'completed' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                  ref.status === 'rewarded' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' :
                  'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                }`}>
                  {ref.status === 'completed' ? 'Completato' : 
                   ref.status === 'rewarded' ? 'Premio Dato' : 'In Attesa'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
