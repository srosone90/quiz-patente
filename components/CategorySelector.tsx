'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getCategories } from '@/lib/supabase'
import { Lock, Target } from 'lucide-react'

interface CategorySelectorProps {
  isPremium: boolean
}

export default function CategorySelector({ isPremium }: CategorySelectorProps) {
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const { data } = await getCategories()
      setCategories(data || [])
    } catch (error) {
      console.error('Errore caricamento categorie:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isPremium) {
    return (
      <div className="card p-6 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-dark-card dark:via-dark-hover dark:to-dark-surface border-amber-200 dark:border-amber-900/30">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-2xl shadow-lg">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text-primary mb-2">
              Filtra per Categoria
            </h3>
            <p className="text-gray-700 dark:text-dark-text-secondary mb-4 text-sm">
              Studia solo le domande che ti interessano: Toponomastica Palermo, Codice della Strada e altro!
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Sblocca Premium
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-2xl">📚</div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">
          Filtra per Categoria
        </h3>
      </div>
      <p className="text-gray-600 dark:text-dark-text-secondary mb-6 text-sm">
        Concentrati su singoli argomenti per uno studio mirato
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {/* Tutte le categorie */}
        <Link
          href="/quiz?plan=premium"
          className="group p-4 rounded-xl border-2 border-primary-200 dark:border-primary-900/30 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-dark-surface dark:to-dark-hover hover:shadow-lg hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="group-hover:scale-110 transition-transform">
              <Target className="w-10 h-10 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <div className="font-bold text-primary-900 dark:text-primary-300">Tutte le Categorie</div>
              <div className="text-xs text-primary-700 dark:text-primary-400">Quiz completo casuale</div>
            </div>
          </div>
        </Link>

        {/* Categorie individuali */}
        {categories.map((category) => {
          const icon = getCategoryIcon(category)
          return (
            <Link
              key={category}
              href={`/quiz?plan=premium&category=${encodeURIComponent(category)}`}
              className="group p-4 rounded-xl border-2 border-gray-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-dark-hover hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl group-hover:scale-110 transition-transform">{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-dark-text-primary truncate">{category}</div>
                  <div className="text-xs text-gray-600 dark:text-dark-text-secondary">Studia {category}</div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function getCategoryIcon(category: string): string {
  if (category.toLowerCase().includes('palermo')) return '🏛️'
  if (category.toLowerCase().includes('sicilia')) return '🗺️'
  if (category.toLowerCase().includes('legislazione')) return '⚖️'
  if (category.toLowerCase().includes('strada') || category.toLowerCase().includes('codice')) return '🚗'
  return '📖'
}
