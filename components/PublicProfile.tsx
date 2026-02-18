'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Share2, Eye, EyeOff, Edit2, Save, X, Award, TrendingUp, Facebook, Instagram, MessageCircle, Twitter, Linkedin, Copy } from 'lucide-react';

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

// Preset avatars that users can choose from
const PRESET_AVATARS = [
  '🚗', '🏍️', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓',
  '👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓', '🧑‍💻', '👨‍🏫', '👩‍🏫', '🧑‍🚀',
  '⭐', '🌟', '💫', '✨', '🔥', '💎', '🏆', '🎯',
  '🎓', '📚', '✅', '🚦', '🛣️', '🗺️', '📍', '🎪'
];

export default function PublicProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    username: '',
    bio: '',
    avatar_url: '🚗',
    is_public: false,
  });
  const [profileUrl, setProfileUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    initUser();
  }, []);

  async function initUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      loadProfile();
    }
  }

  async function loadProfile() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user profile
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
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
        user_id: user.id,
        username: profileData.display_name || '',
        avatar_url: profileData.avatar_url || '🚗',
        total_xp: progressData?.total_xp || 0,
        level: progressData?.level || 1,
        achievements_count: count || 0,
      };
      setProfile(fullProfile);
      setEditForm({
        username: profileData.display_name || '',
        bio: profileData.bio || '',
        avatar_url: profileData.avatar_url || '🚗',
        is_public: profileData.is_public || false,
      });
      
      // Generate profile URL
      const baseUrl = window.location.origin;
      setProfileUrl(`${baseUrl}/profile/${user.id}`);
    }

    setIsLoading(false);
  }

  async function saveProfile() {
    if (!currentUserId) return;

    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: currentUserId,
        display_name: editForm.username,
        bio: editForm.bio,
        avatar_url: editForm.avatar_url,
        is_public: editForm.is_public,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      console.error('Error saving profile:', error);
      alert('Errore nel salvataggio del profilo');
      return;
    }

    // Update local state
    if (profile) {
      setProfile({
        ...profile,
        username: editForm.username,
        bio: editForm.bio,
        avatar_url: editForm.avatar_url,
        is_public: editForm.is_public,
      });
    }
    setIsEditing(false);
  }

  function cancelEdit() {
    if (profile) {
      setEditForm({
        username: profile.username,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        is_public: profile.is_public,
      });
    }
    setIsEditing(false);
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareOnFacebook() {
    const text = `Guarda il mio profilo su Quiz Patente! \nLivello ${profile?.level} 🏆 | ${profile?.total_xp} XP ⭐`;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}&quote=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=600,height=400');
  }

  function shareOnWhatsApp() {
    const text = `🚗 Guarda il mio profilo su Quiz Patente!\n\n👤 ${profile?.username}\n🏆 Livello ${profile?.level}\n⭐ ${profile?.total_xp} XP\n🏅 ${profile?.achievements_count} Achievement\n\n${profileUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  function shareOnTwitter() {
    const text = `🚗 Guarda i miei progressi su Quiz Patente!\n🏆 Livello ${profile?.level} | ⭐ ${profile?.total_xp} XP`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  }

  function shareOnLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  }

  function shareOnInstagram() {
    // Instagram non supporta condivisione diretta via URL
    // Copia il link e suggerisce di postarlo manualmente
    copyToClipboard();
    alert('📱 Link copiato!\n\nApri Instagram e incollalo nella tua Story o Bio.\n\nSu mobile puoi anche screenshottare il tuo profilo e postarlo!');
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
              <span className="text-6xl">
                {profile.avatar_url || '🚗'}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Scegli Avatar
              </label>
              <div className="grid grid-cols-8 gap-2 mb-4">
                {PRESET_AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setEditForm({ ...editForm, avatar_url: avatar })}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl transition-all ${
                      editForm.avatar_url === avatar
                        ? 'bg-blue-500 scale-110 ring-2 ring-blue-600'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
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
                Condividi su
              </h3>
            </div>
            
            {/* Social Buttons Grid */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                onClick={shareOnFacebook}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition-colors"
                title="Condividi su Facebook"
              >
                <Facebook className="w-5 h-5" />
                <span className="text-sm font-medium">Facebook</span>
              </button>
              
              <button
                onClick={shareOnInstagram}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                title="Condividi su Instagram"
              >
                <Instagram className="w-5 h-5" />
                <span className="text-sm font-medium">Instagram</span>
              </button>
              
              <button
                onClick={shareOnWhatsApp}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white rounded-lg hover:bg-[#20BD5A] transition-colors"
                title="Condividi su WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">WhatsApp</span>
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                onClick={shareOnTwitter}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1A94DA] transition-colors"
                title="Condividi su Twitter"
              >
                <Twitter className="w-5 h-5" />
                <span className="text-sm font-medium">Twitter</span>
              </button>
              
              <button
                onClick={shareOnLinkedIn}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0A66C2] text-white rounded-lg hover:bg-[#095196] transition-colors"
                title="Condividi su LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
                <span className="text-sm font-medium">LinkedIn</span>
              </button>
              
              <button
                onClick={copyToClipboard}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                title="Copia link"
              >
                <Copy className="w-5 h-5" />
                <span className="text-sm font-medium">{copied ? '✓ Copiato' : 'Copia'}</span>
              </button>
            </div>
            
            {/* URL Display */}
            <input
              type="text"
              value={profileUrl}
              readOnly
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-600 dark:text-gray-400 text-center"
            />
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
