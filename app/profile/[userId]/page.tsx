'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { Award, TrendingUp, ArrowLeft, Lock } from 'lucide-react';

interface ProfileData {
  id: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  is_public: boolean;
  total_xp: number;
  level: number;
  achievements_count: number;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (userId) {
      loadPublicProfile();
    }
  }, [userId]);

  async function loadPublicProfile() {
    setIsLoading(true);
    
    // Get user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profileData) {
      setIsLoading(false);
      return;
    }

    // Check if profile is public
    if (!profileData.is_public) {
      setIsPrivate(true);
      setIsLoading(false);
      return;
    }

    // Get progress data
    const { data: progressData } = await supabase
      .from('user_progress')
      .select('total_xp, level')
      .eq('user_id', userId)
      .single();

    // Get achievements count
    const { count } = await supabase
      .from('user_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    setProfile({
      id: profileData.id,
      display_name: profileData.display_name || 'Utente',
      bio: profileData.bio || '',
      avatar_url: profileData.avatar_url || '🚗',
      is_public: profileData.is_public,
      total_xp: progressData?.total_xp || 0,
      level: progressData?.level || 1,
      achievements_count: count || 0,
    });

    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Caricamento profilo...
          </div>
        </div>
      </div>
    );
  }

  if (isPrivate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Profilo Privato
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Questo profilo è privato e non può essere visualizzato pubblicamente.
            </p>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Torna alla Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Profilo non trovato
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Il profilo che stai cercando non esiste o è stato rimosso.
            </p>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Torna alla Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-3xl mx-auto py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mb-6 shadow"
        >
          <ArrowLeft className="w-4 h-4" />
          Indietro
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Header with gradient */}
          <div className="h-32 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500"></div>

          <div className="relative px-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-16 mb-4">
              <div className="w-32 h-32 rounded-full bg-white dark:bg-gray-800 p-2 shadow-xl">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-6xl">
                    {profile.avatar_url}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {profile.display_name}
              </h1>
              {profile.bio && (
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {profile.level}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">Livello</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {profile.total_xp}
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300 font-medium">XP</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {profile.achievements_count}
                </div>
                <div className="text-sm text-amber-700 dark:text-amber-300 font-medium">Achievement</div>
              </div>
            </div>

            {/* Public Badge */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-300 text-center">
                ✓ Profilo pubblico verificato
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
