'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Share2, Eye, EyeOff, Edit2, Save, X, Award, TrendingUp } from 'lucide-react';

interface Profile {
  user_id: string;
  username: string;
  bio: string;
  avatar_url: string;
  is_public: boolean;
  total_xp: number;
  level: number;
  achievements_count: number;
}

export default function PublicProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editForm, setEditForm] = useState({
    username: '',
    bio: '',
    is_public: false,
  });
  const [profileUrl, setProfileUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user profile
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get progress
    const { data: progressData } = await supabase
      .from('user_progress')
      .select('total_xp, level')
      .eq('user_id', user.id)
      .single();

    // Get achievements count
    const { count } = await supabase
      .from('user_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (profileData) {
      const fullProfile: Profile = {
        ...profileData,
        total_xp: progressData?.total_xp || 0,
        level: progressData?.level || 1,
        achievements_count: count || 0,
      };
      setProfile(fullProfile);
      setEditForm({
        username: profileData.username || '',
        bio: profileData.bio || '',
        is_public: profileData.is_public || false,
      });
      
      // Generate profile URL
      const baseUrl = window.location.origin;
      setProfileUrl(`${baseUrl}/profile/${user.id}`);
    }

    setIsLoading(false);
  }

  async function saveProfile() {
    if (!profile) return;

    const { error } = await supabase
      .from('user_profiles')
      .update({
        username: editForm.username,
        bio: editForm.bio,
        is_public: editForm.is_public,
      })
      .eq('user_id', profile.user_id);

    if (!error) {
      setProfile({
        ...profile,
        username: editForm.username,
        bio: editForm.bio,
        is_public: editForm.is_public,
      });
      setIsEditing(false);
    }
  }

  function cancelEdit() {
    if (profile) {
      setEditForm({
        username: profile.username,
        bio: profile.bio,
        is_public: profile.is_public,
      });
    }
    setIsEditing(false);
  }

  async function shareProfile() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Profilo di ${profile?.username} - Quiz Patente`,
          text: `Guarda il mio profilo su Quiz Patente! Livello ${profile?.level} con ${profile?.total_xp} XP`,
          url: profileUrl,
        });
      } catch (err) {
        // User cancelled or error
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Caricamento profilo...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Profilo non disponibile
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header with gradient */}
      <div className="h-32 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500"></div>

      <div className="relative px-6 pb-6">
        {/* Avatar */}
        <div className="relative -mt-16 mb-4">
          <div className="w-32 h-32 rounded-full bg-white dark:bg-gray-800 p-2 shadow-xl">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-4xl font-bold text-white">
                {profile.username?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          >
            {isEditing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
          </button>
        </div>

        {isEditing ? (
          /* Edit Mode */
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Il tuo username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bio
              </label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="Raccontaci qualcosa di te..."
                maxLength={200}
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                {editForm.bio.length}/200
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditForm({ ...editForm, is_public: !editForm.is_public })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  editForm.is_public
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {editForm.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {editForm.is_public ? 'Profilo Pubblico' : 'Profilo Privato'}
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">
                {editForm.is_public ? 'Visibile a tutti' : 'Visibile solo a te'}
              </span>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={saveProfile}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Salva
              </button>
              <button
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="mb-6">
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {profile.username || 'Utente'}
              </h1>
              <div className="flex items-center gap-2">
                {profile.is_public ? (
                  <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
            {profile.bio && (
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {profile.bio}
              </p>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {profile.level}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">Livello</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {profile.total_xp}
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-300 font-medium">XP</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {profile.achievements_count}
            </div>
            <div className="text-sm text-amber-700 dark:text-amber-300 font-medium">Achievement</div>
          </div>
        </div>

        {/* Share Section */}
        {profile.is_public && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Condividi il tuo profilo
              </h3>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={profileUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300"
              />
              <button
                onClick={shareProfile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                {copied ? '✓ Copiato!' : 'Condividi'}
              </button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Gli altri utenti potranno vedere i tuoi progressi e achievement
            </p>
          </div>
        )}

        {!profile.is_public && (
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <EyeOff className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Profilo Privato
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Il tuo profilo è visibile solo a te. Attiva la modalità pubblica per condividerlo con altri utenti!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
