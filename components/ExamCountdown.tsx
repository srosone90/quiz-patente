'use client';

import { useEffect, useState } from 'react';
import { Calendar, MapPin, Bell, Clock, Edit2, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ExamSettings {
  exam_date: string | null;
  exam_location: string;
  reminder_enabled: boolean;
}

export default function ExamCountdown() {
  const [userId, setUserId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ExamSettings>({
    exam_date: null,
    exam_location: 'Palermo',
    reminder_enabled: true
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [countdown, setCountdown] = useState<{days: number, hours: number, minutes: number} | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadExamSettings();
    }
  }, [userId]);

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  }

  useEffect(() => {
    if (!settings.exam_date) return;

    const calculateCountdown = () => {
      const now = new Date();
      const examDate = new Date(settings.exam_date!);
      const diff = examDate.getTime() - now.getTime();

      if (diff < 0) {
        setCountdown(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setCountdown({ days, hours, minutes });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [settings.exam_date]);

  const loadExamSettings = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('exam_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      setSettings({
        exam_date: data.exam_date,
        exam_location: data.exam_location || 'Palermo',
        reminder_enabled: data.reminder_enabled
      });
    }
  };

  const saveExamSettings = async () => {
    setSaving(true);
    
    const { error } = await supabase
      .from('exam_settings')
      .upsert({
        user_id: userId,
        exam_date: settings.exam_date,
        exam_location: settings.exam_location,
        reminder_enabled: settings.reminder_enabled
      });

    if (!error) {
      setEditing(false);
    } else {
      console.error('Error saving exam settings:', error);
    }

    setSaving(false);
  };

  const cancelEditing = () => {
    loadExamSettings();
    setEditing(false);
  };

  if (!settings.exam_date && !editing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700">
        <div className="text-center py-8">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Imposta la Data del Tuo Esame
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Configura quando farai l'esame per vedere il countdown e ricevere promemoria
          </p>
          <button
            onClick={() => setEditing(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Imposta Esame
          </button>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Impostazioni Esame
        </h3>

        <div className="space-y-4">
          {/* Data Esame */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data Esame
            </label>
            <input
              type="date"
              value={settings.exam_date || ''}
              onChange={(e) => setSettings({...settings, exam_date: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Località */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Località
            </label>
            <input
              type="text"
              value={settings.exam_location}
              onChange={(e) => setSettings({...settings, exam_location: e.target.value})}
              placeholder="es. Motorizzazione Palermo"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Promemoria (placeholder - notifiche non implementate */}
          <div className="flex items-center gap-2 opacity-50 cursor-not-allowed">
            <input
              type="checkbox"
              checked={settings.reminder_enabled}
              disabled
              className="w-4 h-4 text-blue-600"
            />
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Abilita promemoria (coming soon)
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={saveExamSettings}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvataggio...' : 'Salva'}
            </button>
            <button
              onClick={cancelEditing}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Display countdown
  const examDate = new Date(settings.exam_date!);
  const isExamSoon = countdown && countdown.days <= 7;
  const isExamToday = countdown && countdown.days === 0;

  return (
    <div className={`rounded-lg p-6 shadow border ${
      isExamToday ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white border-red-600' :
      isExamSoon ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white border-orange-600' :
      'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-600'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8" />
          <div>
            <h3 className="text-xl font-bold">Il Tuo Esame</h3>
            <p className="text-sm opacity-90">
              {examDate.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors backdrop-blur"
        >
          <Edit2 className="w-5 h-5" />
        </button>
      </div>

      {countdown && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white/20 rounded-lg p-4 text-center backdrop-blur">
            <div className="text-3xl font-bold">{countdown.days}</div>
            <div className="text-sm opacity-90">Giorni</div>
          </div>
          <div className="bg-white/20 rounded-lg p-4 text-center backdrop-blur">
            <div className="text-3xl font-bold">{countdown.hours}</div>
            <div className="text-sm opacity-90">Ore</div>
          </div>
          <div className="bg-white/20 rounded-lg p-4 text-center backdrop-blur">
            <div className="text-3xl font-bold">{countdown.minutes}</div>
            <div className="text-sm opacity-90">Minuti</div>
          </div>
        </div>
      )}

      {settings.exam_location && (
        <div className="flex items-center gap-2 bg-white/20 rounded-lg p-3 backdrop-blur">
          <MapPin className="w-5 h-5" />
          <span className="text-sm">{settings.exam_location}</span>
        </div>
      )}

      {isExamToday && (
        <div className="mt-4 bg-white/30 rounded-lg p-4 backdrop-blur">
          <p className="font-semibold text-center">
            🎯 L'esame è OGGI! In bocca al lupo! 🍀
          </p>
        </div>
      )}

      {isExamSoon && !isExamToday && (
        <div className="mt-4 bg-white/20 rounded-lg p-3 backdrop-blur">
          <p className="text-sm text-center">
            ⚠️ L'esame è tra meno di una settimana! Ultimi ripassi!
          </p>
        </div>
      )}
    </div>
  );
}
