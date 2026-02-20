'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Question, saveQuizResult, saveQuizAnswers, getQuestionsByCategory, getWrongAnswers, checkAndUnlockAchievements } from '@/lib/supabase'
import { useWakeLock } from '@/hooks/useWakeLock'
import { RotateCcw, Folder, FileEdit, Lightbulb, PartyPopper, BookOpen } from 'lucide-react'

interface QuizEngineProps {
  plan?: 'free' | 'premium'
  category?: string
  mode?: 'review' | 'normal'
}

interface UserAnswer {
  question_id: number
  question_text: string
  user_answer: string
  correct_answer: string
  is_correct: boolean
  category: string
  explanation?: string
}

export default function QuizEngine({ plan = 'free', category, mode = 'normal' }: QuizEngineProps) {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [showResult, setShowResult] = useState(false)
  const [quizFinished, setQuizFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [canProceed, setCanProceed] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const timeRemainingRef = useRef(0)
  
  // Wake Lock per mantenere schermo attivo
  const { isSupported: wakeLockSupported, isLocked, request: requestWakeLock, release: releaseWakeLock } = useWakeLock()

  const isFree = plan === 'free'
  const totalQuestions = mode === 'review' ? questions.length : (isFree ? 10 : 20)
  const timeLimit = isFree ? 600 : 1800 // 10 min for free, 30 min for premium (in seconds)

  useEffect(() => {
    loadQuestions()
  }, [plan, category, mode])

  // Wake Lock: attiva quando quiz inizia, rilascia quando finisce
  useEffect(() => {
    if (!loading && !quizFinished && questions.length > 0 && wakeLockSupported) {
      requestWakeLock();
    }

    return () => {
      if (quizFinished || loading) {
        releaseWakeLock();
      }
    };
  }, [loading, quizFinished, questions.length, wakeLockSupported]);

  // Timer countdown ottimizzato per ridurre re-render
  useEffect(() => {
    if (loading || quizFinished || questions.length === 0) return

    // Initialize timer when questions are loaded
    if (timeRemainingRef.current === 0) {
      timeRemainingRef.current = timeLimit
      setTimeRemaining(timeLimit)
    }

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Update display every second but minimize re-renders
    timerRef.current = setInterval(() => {
      timeRemainingRef.current -= 1
      
      if (timeRemainingRef.current <= 0) {
        if (timerRef.current) clearInterval(timerRef.current)
        finishQuiz()
        setTimeRemaining(0)
      } else {
        // Only update state (trigger re-render) every 1 second
        setTimeRemaining(timeRemainingRef.current)
      }
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [loading, quizFinished, questions.length, timeLimit])

  async function loadQuestions() {
    try {
      setLoading(true)
      let fetchedQuestions: Question[] = []

      if (mode === 'review') {
        // Modalità Ripassa Errori: carica domande sbagliate
        // Usa limite coerente con free/premium
        const maxReviewQuestions = isFree ? 10 : 20
        const { data: wrongAnswers, error: wrongError } = await getWrongAnswers(maxReviewQuestions)
        if (wrongError) throw wrongError
        if (!wrongAnswers || wrongAnswers.length === 0) {
          setQuizFinished(true)
          setLoading(false)
          return
        }
        
        // Ottieni le domande complete dal database
        const questionIds = Array.from(new Set(wrongAnswers.map((wa: any) => wa.question_id)))
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .in('id', questionIds)
        
        if (error) throw error
        fetchedQuestions = data || []
      } else if (category) {
        // Modalità filtro per categoria (premium only)
        const { data: catQuestions, error: catError } = await getQuestionsByCategory(category, isFree ? 10 : 20)
        if (catError) throw catError
        // Shuffle casuale e prendi solo il numero richiesto
        const allCatQuestions = catQuestions || []
        const shuffled = allCatQuestions.sort(() => Math.random() - 0.5)
        fetchedQuestions = shuffled.slice(0, isFree ? 10 : 20)
      } else {
        // Modalità normale: domande random
        const { data, error } = await supabase
          .from('questions')
          .select('*')
        
        if (error) throw error
        
        const allQuestions = data || []
        const shuffled = allQuestions.sort(() => Math.random() - 0.5)
        fetchedQuestions = shuffled.slice(0, totalQuestions)
      }

      setQuestions(fetchedQuestions)
      setError(null)
      setLoading(false)
    } catch (error) {
      console.error('Errore nel caricamento domande:', error)
      setError('Impossibile caricare le domande. Verifica la connessione internet.')
      setLoading(false)
    }
  }

  const currentQuestion = questions[currentIndex]
  const correctCount = userAnswers.filter(a => a.is_correct).length
  const incorrectCount = userAnswers.filter(a => !a.is_correct).length
  const scorePercentage = Math.round((correctCount / totalQuestions) * 100)
  const hasPassed = scorePercentage >= 90

  function handleAnswerSelect(answer: string) {
    if (showResult) return
    setSelectedAnswer(answer)
    setCanProceed(false)
  }

  function handleNext() {
    if (!selectedAnswer || !currentQuestion) return

    const isCorrect = selectedAnswer === currentQuestion.correct_answer
    
    // Salva risposta utente
    const newAnswer: UserAnswer = {
      question_id: currentQuestion.id,
      question_text: currentQuestion.question,
      user_answer: selectedAnswer,
      correct_answer: currentQuestion.correct_answer,
      is_correct: isCorrect,
      category: currentQuestion.category || '',
      explanation: currentQuestion.explanation
    }
    
    setUserAnswers(prev => [...prev, newAnswer])
    setShowResult(true)
    setCanProceed(true)
  }

  async function handleContinue() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setCanProceed(false)
    } else {
      await finishQuiz()
    }
  }

  async function finishQuiz() {
    setQuizFinished(true)
    setSaveError(null)
    
    // Rilascia Wake Lock
    releaseWakeLock()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSaveError('Utente non autenticato. I risultati non sono stati salvati.')
        return
      }

      // Salva risultato quiz
      const { data: resultData, error: resultError } = await saveQuizResult(
        scorePercentage,
        correctCount,
        totalQuestions,
        isFree ? 'free' : 'premium'
      )

      if (resultError) {
        console.error('Errore salvataggio risultato:', resultError)
        setSaveError('Errore nel salvataggio dei risultati: ' + resultError.message)
        return
      }

      // Salva risposte individuali per "Ripassa Errori"
      if (resultData && resultData[0]?.id) {
        const quizResultId = resultData[0].id
        const answersToSave = userAnswers.map(ans => ({
          questionId: ans.question_id,
          questionText: ans.question_text,
          userAnswer: ans.user_answer,
          correctAnswer: ans.correct_answer,
          isCorrect: ans.is_correct,
          category: ans.category
        }))
        
        const { error: answersError } = await saveQuizAnswers(quizResultId, answersToSave)
        if (answersError) {
          console.error('Errore salvataggio risposte:', answersError)
          setSaveError('Risultati salvati parzialmente. Errore risposte: ' + answersError.message)
        }
      }

      // Check e sblocca achievement se necessario
      await checkAndUnlockAchievements(user.id)
      
      // ✅ EMIT EVENT per aggiornare Dashboard, ReviewMode, etc.
      console.log('✅ Quiz completato e salvato! Emetto evento quizCompleted')
      window.dispatchEvent(new Event('quizCompleted'))
      
    } catch (error: any) {
      console.error('Errore nel salvataggio risultati:', error)
      setSaveError('Errore nel salvataggio: ' + (error?.message || 'Errore sconosciuto'))
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 dark:border-accent-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Caricamento domande...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-center py-16">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Errore di Caricamento
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error}
        </p>
        <button
          onClick={() => {
            setError(null)
            setLoading(true)
            loadQuestions()
          }}
          className="btn-primary"
        >
          Riprova
        </button>
      </div>
    )
  }

  if (mode === 'review' && questions.length === 0) {
    return (
      <div className="card text-center py-16">
        <div className="flex justify-center mb-6">
          <PartyPopper className="w-24 h-24 text-primary-600 dark:text-accent-400" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-accent-400 dark:to-accent-600 bg-clip-text text-transparent mb-4">
          Complimenti!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
          Non hai errori da ripassare. Continua così!
        </p>
        <a 
          href="/dashboard"
          className="btn-primary inline-block"
        >
          Torna alla Dashboard
        </a>
      </div>
    )
  }

  if (quizFinished) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12 animate-fadeIn">
          <div className="flex justify-center mb-6">
            {hasPassed ? (
              <PartyPopper className="w-28 h-28 text-green-500" />
            ) : (
              <BookOpen className="w-28 h-28 text-primary-600 dark:text-accent-400" />
            )}
          </div>
          
          <h2 className="text-4xl font-bold mb-4">
            {hasPassed ? (
              <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                Complimenti!
              </span>
            ) : (
              <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                Continua a studiare
              </span>
            )}
          </h2>
          
          <div className="text-6xl font-bold my-8" style={{ color: hasPassed ? '#10b981' : '#ef4444' }}>
            {scorePercentage}%
          </div>

          <div className="grid grid-cols-2 gap-6 mb-10 max-w-md mx-auto">
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-2xl border-2 border-green-200 dark:border-green-700">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400">{correctCount}</div>
              <div className="text-sm font-semibold text-green-700 dark:text-green-300 mt-1">Corrette</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6 rounded-2xl border-2 border-red-200 dark:border-red-700">
              <div className="text-4xl font-bold text-red-600 dark:text-red-400">{incorrectCount}</div>
              <div className="text-sm font-semibold text-red-700 dark:text-red-300 mt-1">Sbagliate</div>
            </div>
          </div>

          {/* Messaggio Salvataggio */}
          {saveError ? (
            <div className="mb-6 max-w-lg mx-auto">
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 p-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">⚠️ Errore Salvataggio</p>
                    <p className="text-sm text-red-700 dark:text-red-300">{saveError}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 max-w-lg mx-auto">
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">✅ Risultati salvati con successo!</p>
                </div>
              </div>
            </div>
          )}

          <div className="text-gray-700 dark:text-gray-300 mb-10 max-w-lg mx-auto">
            {hasPassed ? (
              <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-6 rounded-r-xl">
                <p className="text-lg font-medium">
                  Hai superato il quiz! Per l'esame è richiesta una percentuale del <strong className="text-green-700 dark:text-green-300">90%</strong>.
                </p>
              </div>
            ) : (
              <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-6 rounded-r-xl">
                <p className="text-lg font-medium">
                  Per superare l'esame serve il <strong className="text-orange-700 dark:text-orange-300">90%</strong>.<br />
                  Massimo <strong className="text-orange-700 dark:text-orange-300">2 errori</strong> su 20 domande.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4 max-w-md mx-auto">
            <button
              onClick={() => {
                // Dispatch custom event per aggiornare dashboard
                window.dispatchEvent(new Event('quizCompleted'))
                router.push('/dashboard')
              }}
              className="btn-primary block w-full"
            >
              Torna alla Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="block w-full bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-gray-300 px-8 py-4 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all transform hover:scale-[1.02]"
            >
              Nuovo Quiz
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="card text-center py-20">
        <p className="text-red-600 dark:text-red-400 text-lg">Nessuna domanda disponibile</p>
      </div>
    )
  }

  const answers = currentQuestion.answers || []

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const timeWarning = timeRemaining <= 60 // Last minute warning

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 animate-fadeIn">
      {/* Header con progresso */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-500 to-primary-700 dark:from-accent-400 dark:to-accent-600 rounded-xl flex items-center justify-center">
              {mode === 'review' ? (
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              ) : category ? (
                <Folder className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              ) : (
                <FileEdit className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              )}
            </div>
            <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">
              {mode === 'review' ? 'Modalità Ripasso' : category ? `Categoria: ${category}` : 'Quiz Completo'}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <span className={`text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all ${
              timeWarning 
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse shadow-lg shadow-red-200 dark:shadow-red-900/30' 
                : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
            }`}>
              ⏱️ {formatTime(timeRemaining)}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">
              <span className="hidden sm:inline">Domanda </span>
              <span className="text-primary-600 dark:text-accent-500">{currentIndex + 1}</span> / {questions.length}
            </span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-4 overflow-hidden shadow-inner">
          <div 
            className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 dark:from-accent-400 dark:via-accent-500 dark:to-accent-600 h-4 rounded-full transition-all duration-500 ease-out shadow-lg"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Contatori risposte */}
        <div className="flex flex-wrap gap-3 sm:gap-6 mt-4 sm:mt-6">
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 sm:px-4 py-2 rounded-xl border border-green-200 dark:border-green-700">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            <span className="text-xs sm:text-sm font-bold text-green-700 dark:text-green-300">
              <span className="hidden sm:inline">Corrette: </span>{correctCount}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 sm:px-4 py-2 rounded-xl border border-red-200 dark:border-red-700">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
            <span className="text-xs sm:text-sm font-bold text-red-700 dark:text-red-300">
              <span className="hidden sm:inline">Sbagliate: </span>{incorrectCount}
            </span>
          </div>
        </div>
      </div>

      {/* Domanda */}
      <div className="card bg-white dark:bg-dark-card p-6 sm:p-8 mb-6 sm:mb-8 shadow-card-hover">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-8 text-primary-900 dark:text-white leading-relaxed">
          {currentQuestion.question}
        </h2>

        <div className="space-y-4">
          {answers.map((answer, index) => {
            const letter = String.fromCharCode(65 + index)
            const isSelected = selectedAnswer === answer
            const isCorrect = answer === currentQuestion.correct_answer
            const showCorrection = showResult

            let cardClass = ''
            
            if (showCorrection) {
              if (isCorrect) {
                cardClass = 'quiz-answer-card-correct'
              } else if (isSelected && !isCorrect) {
                cardClass = 'quiz-answer-card-incorrect'
              } else {
                cardClass = 'quiz-answer-card bg-gray-50 dark:bg-dark-surface border-gray-200 dark:border-dark-border text-gray-500 dark:text-gray-500 opacity-60'
              }
            } else if (isSelected) {
              cardClass = 'quiz-answer-card-selected'
            } else {
              cardClass = 'quiz-answer-card-default'
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(answer)}
                disabled={showResult}
                className={cardClass}
              >
                <span className="flex-shrink-0 w-10 h-10 bg-current bg-opacity-10 rounded-xl flex items-center justify-center font-bold text-lg">
                  {letter}
                </span>
                <span className="flex-1 text-left leading-relaxed">{answer}</span>
                {showCorrection && isCorrect && (
                  <svg className="flex-shrink-0 w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                )}
                {showCorrection && isSelected && !isCorrect && (
                  <svg className="flex-shrink-0 w-6 h-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                )}
              </button>
            )
          })}
        </div>

        {/* Spiegazione (solo premium) */}
        {showResult && currentQuestion.explanation && (
          <div className="mt-8 pt-8 border-t-2 border-gray-200 dark:border-dark-border animate-slideUp">
            {!isFree ? (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-6 rounded-r-2xl">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3 text-lg">
                      Spiegazione
                    </h3>
                    <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-accent-50 to-amber-50 dark:from-accent-900/20 dark:to-amber-900/20 border-l-4 border-accent-500 dark:border-accent-400 p-6 rounded-r-2xl">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-accent-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">🔒</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-accent-900 dark:text-accent-300 mb-3 text-lg">
                      Spiegazione Premium
                    </h3>
                    <p className="text-accent-800 dark:text-accent-200 mb-4 leading-relaxed">
                      Le spiegazioni dettagliate sono disponibili solo per gli utenti premium.
                    </p>
                    <a 
                      href="/pricing"
                      className="inline-block bg-accent-500 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-accent-600 transition-all transform hover:scale-105 shadow-lg"
                    >
                      Passa a Premium
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pulsanti azione */}
      <div className="flex gap-4">
        {!showResult ? (
          <button
            onClick={handleNext}
            disabled={!selectedAnswer}
            className={`flex-1 py-5 rounded-xl font-bold text-lg transition-all transform min-h-[60px] ${
              selectedAnswer
                ? 'btn-primary'
                : 'bg-gray-200 dark:bg-dark-border text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
          >
            Conferma Risposta
          </button>
        ) : (
          <button
            onClick={handleContinue}
            className="flex-1 btn-primary py-5 text-lg min-h-[60px]"
          >
            {currentIndex < questions.length - 1 ? 'Prossima Domanda →' : 'Termina Quiz'}
          </button>
        )}
      </div>
    </div>
  )
}
