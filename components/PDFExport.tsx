'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ExportData {
  username: string;
  totalQuizzes: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number;
  categoryStats: { category: string; accuracy: number; total: number }[];
  recentQuizzes: { date: string; correct: number; total: number; accuracy: number }[];
  xp: number;
  level: number;
  achievements: { name: string; tier: string; date: string }[];
}

export default function PDFExport() {
  const [isExporting, setIsExporting] = useState(false);

  async function exportToPDF() {
    setIsExporting(true);

    try {
      // Import jsPDF dynamically
      const { default: jsPDF } = await import('jspdf');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch all data
      const data = await fetchExportData(user.id);

      // Create PDF
      const doc = new jsPDF();
      let yPos = 20;

      // Header
      doc.setFontSize(24);
      doc.setTextColor(37, 99, 235); // Blue
      doc.text('Report Quiz Patente', 105, yPos, { align: 'center' });
      yPos += 10;

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generato il ${new Date().toLocaleDateString('it-IT')}`, 105, yPos, { align: 'center' });
      yPos += 15;

      // User info
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(`Utente: ${data.username}`, 20, yPos);
      yPos += 10;

      // Gamification
      doc.setFontSize(14);
      doc.setTextColor(37, 99, 235);
      doc.text('🏆 Gamification', 20, yPos);
      yPos += 8;
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Livello: ${data.level} | XP: ${data.xp}`, 20, yPos);
      yPos += 12;

      // Statistics overview
      doc.setFontSize(14);
      doc.setTextColor(37, 99, 235);
      doc.text('📊 Statistiche Generali', 20, yPos);
      yPos += 8;
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Quiz completati: ${data.totalQuizzes}`, 20, yPos);
      yPos += 6;
      doc.text(`Domande totali: ${data.totalQuestions}`, 20, yPos);
      yPos += 6;
      doc.text(`Risposte corrette: ${data.correctAnswers}`, 20, yPos);
      yPos += 6;
      doc.text(`Accuratezza media: ${data.accuracy.toFixed(1)}%`, 20, yPos);
      yPos += 6;
      doc.text(`Tempo medio per domanda: ${Math.round(data.averageTime)}s`, 20, yPos);
      yPos += 12;

      // Achievements
      if (data.achievements.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(37, 99, 235);
        doc.text('🏅 Achievement Sbloccati', 20, yPos);
        yPos += 8;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        data.achievements.slice(0, 10).forEach((ach) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          const tierEmoji = {
            bronze: '🥉',
            silver: '🥈',
            gold: '🥇',
            platinum: '💎'
          }[ach.tier] || '';
          doc.text(`${tierEmoji} ${ach.name} - ${new Date(ach.date).toLocaleDateString('it-IT')}`, 25, yPos);
          yPos += 6;
        });
        yPos += 8;
      }

      // Category breakdown
      if (data.categoryStats.length > 0) {
        if (yPos > 220) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(14);
        doc.setTextColor(37, 99, 235);
        doc.text('📚 Performance per Categoria', 20, yPos);
        yPos += 8;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        data.categoryStats.forEach((cat) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`${cat.category}: ${cat.accuracy.toFixed(1)}% (${cat.total} domande)`, 25, yPos);
          yPos += 6;
        });
        yPos += 8;
      }

      // Recent quizzes
      if (data.recentQuizzes.length > 0) {
        if (yPos > 200) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(14);
        doc.setTextColor(37, 99, 235);
        doc.text('📅 Ultimi Quiz', 20, yPos);
        yPos += 8;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        data.recentQuizzes.slice(0, 15).forEach((quiz) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(
            `${quiz.date}: ${quiz.correct}/${quiz.total} (${quiz.accuracy.toFixed(1)}%)`,
            25,
            yPos
          );
          yPos += 6;
        });
      }

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Pagina ${i} di ${pageCount} - Quiz Patente Report`,
          105,
          290,
          { align: 'center' }
        );
      }

      // Save PDF
      const fileName = `quiz-report-${data.username.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Errore durante l\'esportazione del PDF. Riprova.');
    } finally {
      setIsExporting(false);
    }
  }

  async function fetchExportData(userId: string): Promise<ExportData> {
    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('id', userId)
      .single();

    // Get user progress
    const { data: progress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get quiz results
    const { data: quizResults } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get achievements
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select(`
        unlocked_at,
        achievements (name, tier)
      `)
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    // Calculate statistics
    const totalQuizzes = quizResults?.length || 0;
    const totalQuestions = quizResults?.reduce((sum, q) => sum + q.total_questions, 0) || 0;
    const correctAnswers = quizResults?.reduce((sum, q) => sum + q.correct_answers, 0) || 0;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const averageTime = quizResults?.length
      ? quizResults.reduce((sum, q) => sum + (q.time_spent || 0), 0) / totalQuestions
      : 0;

    // Category stats
    const categoryMap: Record<string, { correct: number; total: number }> = {};
    quizResults?.forEach((quiz) => {
      const cat = quiz.category || 'Generale';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { correct: 0, total: 0 };
      }
      categoryMap[cat].correct += quiz.correct_answers;
      categoryMap[cat].total += quiz.total_questions;
    });

    const categoryStats = Object.entries(categoryMap).map(([category, stats]) => ({
      category,
      accuracy: (stats.correct / stats.total) * 100,
      total: stats.total,
    })).sort((a, b) => b.total - a.total);

    // Recent quizzes
    const recentQuizzes = (quizResults?.slice(0, 20) || []).map((quiz) => ({
      date: new Date(quiz.created_at).toLocaleDateString('it-IT'),
      correct: quiz.correct_answers,
      total: quiz.total_questions,
      accuracy: (quiz.correct_answers / quiz.total_questions) * 100,
    }));

    // Achievements
    const achievements = (userAchievements || []).map((ua: any) => ({
      name: ua.achievements.name,
      tier: ua.achievements.tier,
      date: ua.unlocked_at,
    }));

    return {
      username: profile?.display_name || 'Utente',
      totalQuizzes,
      totalQuestions,
      correctAnswers,
      accuracy,
      averageTime,
      categoryStats,
      recentQuizzes,
      xp: progress?.total_xp || 0,
      level: progress?.level || 1,
      achievements,
    };
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileDown className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Esporta Report PDF
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Scarica un report completo con tutte le tue statistiche, achievement e progressi
        </p>
        <button
          onClick={exportToPDF}
          disabled={isExporting}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generazione PDF...
            </>
          ) : (
            <>
              <FileDown className="w-5 h-5" />
              Scarica Report PDF
            </>
          )}
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
          Il report include statistiche complete, achievement sbloccati e analisi per categoria
        </p>
      </div>
    </div>
  );
}
