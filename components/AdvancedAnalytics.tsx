'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface AnalyticsData {
  totalUsers: number
  newUsersToday: number
  newUsersWeek: number
  premiumUsers: number
  freeUsers: number
  totalQuizzes: number
  quizzesToday: number
  avgScore: number
  passRate: number
  activeCodesCount: number
  totalRedemptions: number
  topCategories: { category: string; count: number; avg_success: number }[]
  userGrowth: { date: string; count: number }[]
  quizActivity: { date: string; total: number; passed: number }[]
}

export default function AdvancedAnalytics() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  async function loadAnalytics() {
    setLoading(true)
    try {
      const now = new Date()
      const rangeDate = new Date()
      
      switch (timeRange) {
        case '7d':
          rangeDate.setDate(now.getDate() - 7)
          break
        case '30d':
          rangeDate.setDate(now.getDate() - 30)
          break
        case '90d':
          rangeDate.setDate(now.getDate() - 90)
          break
        case 'all':
          rangeDate.setFullYear(2020)
          break
      }

      // Total users
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })

      // New users today
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const { count: newUsersToday } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString())

      // New users this week
      const weekStart = new Date()
      weekStart.setDate(now.getDate() - 7)
      const { count: newUsersWeek } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekStart.toISOString())

      // Premium vs Free
      const { count: premiumUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .neq('subscription_type', 'free')

      const { count: freeUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_type', 'free')

      // Quiz stats
      const { data: quizData } = await supabase
        .from('quiz_results')
        .select('score, passed, created_at')
        .gte('created_at', rangeDate.toISOString())

      const totalQuizzes = quizData?.length || 0
      const passedQuizzes = quizData?.filter(q => q.passed).length || 0
      const avgScore = (quizData && quizData.length > 0) 
        ? quizData.reduce((acc, q) => acc + (q.score || 0), 0) / totalQuizzes
        : 0
      const passRate = totalQuizzes > 0 ? (passedQuizzes / totalQuizzes) * 100 : 0

      // Quizzes today
      const quizzesToday = quizData?.filter(q => {
        const quizDate = new Date(q.created_at)
        return quizDate >= todayStart
      }).length || 0

      // Access codes stats
      const { count: activeCodesCount } = await supabase
        .from('access_codes')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      const { count: totalRedemptions } = await supabase
        .from('code_redemptions')
        .select('*', { count: 'exact', head: true })

      // Top categories
      const categoryStats: { [key: string]: { count: number; passed: number } } = {}
      quizData?.forEach(q => {
        const cat = 'Generale' // Categoria non disponibile nei dati, usa default
        if (!categoryStats[cat]) {
          categoryStats[cat] = { count: 0, passed: 0 }
        }
        categoryStats[cat].count++
        if (q.passed) categoryStats[cat].passed++
      })

      const topCategories = Object.entries(categoryStats)
        .map(([category, stats]) => ({
          category,
          count: stats.count,
          avg_success: (stats.passed / stats.count) * 100
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // User growth (daily)
      const { data: allUsers } = await supabase
        .from('user_profiles')
        .select('created_at')
        .gte('created_at', rangeDate.toISOString())
        .order('created_at', { ascending: true })

      const userGrowthMap: { [key: string]: number } = {}
      allUsers?.forEach(user => {
        const date = new Date(user.created_at).toLocaleDateString('it-IT')
        userGrowthMap[date] = (userGrowthMap[date] || 0) + 1
      })

      const userGrowth = Object.entries(userGrowthMap).map(([date, count]) => ({
        date,
        count
      }))

      // Quiz activity (daily)
      const quizActivityMap: { [key: string]: { total: number; passed: number } } = {}
      quizData?.forEach(quiz => {
        const date = new Date(quiz.created_at).toLocaleDateString('it-IT')
        if (!quizActivityMap[date]) {
          quizActivityMap[date] = { total: 0, passed: 0 }
        }
        quizActivityMap[date].total++
        if (quiz.passed) quizActivityMap[date].passed++
      })

      const quizActivity = Object.entries(quizActivityMap).map(([date, stats]) => ({
        date,
        total: stats.total,
        passed: stats.passed
      }))

      setData({
        totalUsers: totalUsers || 0,
        newUsersToday: newUsersToday || 0,
        newUsersWeek: newUsersWeek || 0,
        premiumUsers: premiumUsers || 0,
        freeUsers: freeUsers || 0,
        totalQuizzes,
        quizzesToday,
        avgScore: Math.round(avgScore * 10) / 10,
        passRate: Math.round(passRate),
        activeCodesCount: activeCodesCount || 0,
        totalRedemptions: totalRedemptions || 0,
        topCategories,
        userGrowth,
        quizActivity
      })
    } catch (error) {
      console.error('Errore caricamento analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center text-gray-500 py-12">
        Errore caricamento dati analytics
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-end gap-2">
        {(['7d', '30d', '90d', 'all'] as const).map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              timeRange === range
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {range === '7d' ? '7 giorni' : range === '30d' ? '30 giorni' : range === '90d' ? '90 giorni' : 'Tutto'}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Utenti Totali</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{data.totalUsers}</div>
          <div className="text-xs text-green-600 mt-2">+{data.newUsersToday} oggi • +{data.newUsersWeek} settimana</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-green-500">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Quiz Completati</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{data.totalQuizzes}</div>
          <div className="text-xs text-green-600 mt-2">+{data.quizzesToday} oggi</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-yellow-500">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tasso Superamento</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{data.passRate}%</div>
          <div className="text-xs text-gray-500 mt-2">Media voto: {data.avgScore}/20</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Utenti Premium</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{data.premiumUsers}</div>
          <div className="text-xs text-gray-500 mt-2">{data.freeUsers} free</div>
        </div>
      </div>

      {/* Top Categories */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📊 Top 5 Categorie</h3>
        <div className="space-y-3">
          {data.topCategories.map((cat, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '📌'}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{cat.category}</span>
                </div>
                <div className="ml-10 mt-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${cat.avg_success}%` }}
                  ></div>
                </div>
              </div>
              <div className="ml-4 text-right">
                <div className="text-sm font-bold text-gray-900 dark:text-white">{Math.round(cat.avg_success)}%</div>
                <div className="text-xs text-gray-500">{cat.count} quiz</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">👥 Crescita Utenti</h3>
          <div className="text-sm text-gray-500">
            {data.userGrowth.length > 0 ? (
              <div className="space-y-1">
                {data.userGrowth.slice(-7).map((day, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{day.date}</span>
                    <span className="font-bold">+{day.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              'Nessun dato disponibile'
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🎯 Attività Quiz</h3>
          <div className="text-sm text-gray-500">
            {data.quizActivity.length > 0 ? (
              <div className="space-y-1">
                {data.quizActivity.slice(-7).map((day, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{day.date}</span>
                    <span className="font-bold">{day.passed}/{day.total} superati</span>
                  </div>
                ))}
              </div>
            ) : (
              'Nessun dato disponibile'
            )}
          </div>
        </div>
      </div>

      {/* B2B Stats */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold mb-4">🏫 Statistiche B2B</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm opacity-90">Codici Attivi</div>
            <div className="text-3xl font-bold">{data.activeCodesCount}</div>
          </div>
          <div>
            <div className="text-sm opacity-90">Totale Riscatti</div>
            <div className="text-3xl font-bold">{data.totalRedemptions}</div>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={loadAnalytics}
          className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition"
        >
          🔄 Aggiorna Dati
        </button>
      </div>
    </div>
  )
}
