'use client'

import { useState, useEffect } from 'react'
import { supabase, Question, saveQuizResult, saveQuizAnswers, getQuestionsByCategory, getWrongAnswers } from '@/lib/supabase'

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
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [showResult, setShowResult] = useState(false)
  const [quizFinished, setQuizFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [canProceed, setCanProceed] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)

  const isFree = plan === 'free'
  const totalQuestions = mode === 'review' ? questions.length : (isFree ? 10 : 20)
  const timeLimit = isFree ? 600 : 1800 // 10 min for free, 30 min for premium (in seconds)

  useEffect(() => {
    loadQuestions()
  }, [plan, category, mode])

  // Timer countdown
  useEffect(() => {
    if (loading || quizFinished || questions.length === 0) return

    // Initialize timer when questions are loaded
    if (timeRemaining === 0) {
      setTimeRemaining(timeLimit)
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          finishQuiz()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, quizFinished, questions.length, timeRemaining])

  async function loadQuestions() {
    try {
      setLoading(true)
      let fetchedQuestions: Question[] = []

      if (mode === 'review') {
        // Modalità Ripassa Errori: carica domande sbagliate
        const { data: wrongAnswers, error: wrongError } = await getWrongAnswers(20)
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
        fetchedQuestions = catQuestions || []
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
      setLoading(false)
    } catch (error) {
      console.error('Errore nel caricamento domande:', error)
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
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Salva risultato quiz
      const { data: resultData, error: resultError } = await saveQuizResult(
        scorePercentage,
        correctCount,
        totalQuestions,
        isFree ? 'free' : 'premium'
      )

      if (resultError) throw resultError

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
        await saveQuizAnswers(quizResultId, answersToSave)
      }
    } catch (error) {
      console.error('Errore nel salvataggio risultati:', error)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20 dark:bg-dark-bg">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-navy mx-auto dark:border-gold"></div>
        <p className="mt-4 text-gray-600 dark:text-dark-text">Caricamento domande...</p>
      </div>
    )
  }

  if (mode === 'review' && questions.length === 0) {
    return (
      <div className="text-center py-20 dark:bg-dark-bg">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-navy mb-4 dark:text-gold">Complimenti!</h2>
        <p className="text-gray-600 dark:text-dark-text">
          Non hai errori da ripassare. Continua così!
        </p>
        <a 
          href="/dashboard"
          className="mt-6 inline-block bg-navy text-white px-8 py-3 rounded-lg hover:bg-opacity-90 transition dark:bg-gold dark:text-navy"
        >
          Torna alla Dashboard
        </a>
      </div>
    )
  }

  if (quizFinished) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10 dark:bg-dark-bg">
        <div className="bg-white rounded-xl shadow-lg p-8 dark:bg-dark-card dark:border dark:border-dark-border">
          <div className="text-6xl mb-4">
            {hasPassed ? '🎉' : '📚'}
          </div>
          
          <h2 className="text-3xl font-bold mb-2 dark:text-white">
            {hasPassed ? 'Complimenti!' : 'Continua a studiare'}
          </h2>
          
          <div className="text-5xl font-bold my-6" style={{ color: hasPassed ? '#10b981' : '#ef4444' }}>
            {scorePercentage}%
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-green-50 p-4 rounded-lg dark:bg-green-900/20">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{correctCount}</div>
              <div className="text-sm text-green-700 dark:text-green-300">Corrette</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg dark:bg-red-900/20">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{incorrectCount}</div>
              <div className="text-sm text-red-700 dark:text-red-300">Sbagliate</div>
            </div>
          </div>

          <div className="text-gray-600 mb-8 dark:text-dark-text">
            {hasPassed ? (
              <p className="text-lg">
                Hai superato il quiz! Per l'esame è richiesta una percentuale del <strong className="dark:text-white">90%</strong>.
              </p>
            ) : (
              <p className="text-lg">
                Per superare l'esame serve il <strong className="dark:text-white">90%</strong>.<br />
                Massimo <strong className="dark:text-white">2 errori</strong> su 20 domande.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <a 
              href="/dashboard"
              className="block w-full bg-navy text-white px-8 py-3 rounded-lg hover:bg-opacity-90 transition dark:bg-gold dark:text-navy font-semibold"
            >
              Torna alla Dashboard
            </a>
            <button
              onClick={() => window.location.reload()}
              className="block w-full bg-gray-200 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-300 transition dark:bg-dark-border dark:text-dark-text"
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
      <div className="text-center py-20 dark:bg-dark-bg">
        <p className="text-red-600 dark:text-red-400">Nessuna domanda disponibile</p>
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
    <div className="max-w-4xl mx-auto px-4 dark:bg-dark-bg">
      {/* Header con progresso */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-semibold text-navy dark:text-gold">
            {mode === 'review' ? 'Modalità Ripasso' : category ? `Categoria: ${category}` : 'Quiz Completo'}
          </span>
          <div className="flex items-center gap-4">
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
              timeWarning 
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse' 
                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              ⏱️ {formatTime(timeRemaining)}
            </span>
            <span className="text-sm text-gray-600 dark:text-dark-text">
              Domanda {currentIndex + 1} di {questions.length}
            </span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-dark-border">
          <div 
            className="bg-navy h-3 rounded-full transition-all duration-300 dark:bg-gold"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Contatori risposte */}
        <div className="flex gap-4 mt-4 text-sm">
          <span className="text-green-600 dark:text-green-400">
            ✓ Corrette: {correctCount}
          </span>
          <span className="text-red-600 dark:text-red-400">
            ✗ Sbagliate: {incorrectCount}
          </span>
        </div>
      </div>

      {/* Domanda */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6 dark:bg-dark-card dark:border dark:border-dark-border">
        <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white leading-relaxed">
          {currentQuestion.question}
        </h2>

        <div className="space-y-3">
          {answers.map((answer, index) => {
            const letter = String.fromCharCode(65 + index)
            const isSelected = selectedAnswer === answer
            const isCorrect = answer === currentQuestion.correct_answer
            const showCorrection = showResult

            let bgColor = 'bg-gray-50 hover:bg-gray-100 dark:bg-dark-bg dark:hover:bg-dark-border'
            let borderColor = 'border-gray-200 dark:border-dark-border'
            let textColor = 'text-gray-800 dark:text-white'

            if (showCorrection) {
              if (isCorrect) {
                bgColor = 'bg-green-50 dark:bg-green-900/20'
                borderColor = 'border-green-500 dark:border-green-400'
                textColor = 'text-green-700 dark:text-green-300'
              } else if (isSelected && !isCorrect) {
                bgColor = 'bg-red-50 dark:bg-red-900/20'
                borderColor = 'border-red-500 dark:border-red-400'
                textColor = 'text-red-700 dark:text-red-300'
              }
            } else if (isSelected) {
              bgColor = 'bg-navy/10 dark:bg-gold/20'
              borderColor = 'border-navy dark:border-gold'
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(answer)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${bgColor} ${borderColor} ${textColor} ${
                  !showResult ? 'cursor-pointer' : 'cursor-default'
                }`}
                style={{
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  whiteSpace: 'normal'
                }}
              >
                <span className="font-bold mr-3">{letter})</span>
                {answer}
                {showCorrection && isCorrect && (
                  <span className="ml-2 text-green-600 dark:text-green-400">✓ Corretta</span>
                )}
                {showCorrection && isSelected && !isCorrect && (
                  <span className="ml-2 text-red-600 dark:text-red-400">✗ Sbagliata</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Spiegazione (solo premium) */}
        {showResult && currentQuestion.explanation && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-border">
            {!isFree ? (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 dark:bg-blue-900/20 dark:border-blue-400">
                <h3 className="font-bold text-blue-900 mb-2 dark:text-blue-300">
                  💡 Spiegazione
                </h3>
                <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>
            ) : (
              <div className="bg-gold/10 border-l-4 border-gold p-4 dark:bg-gold/20">
                <h3 className="font-bold text-navy mb-2 dark:text-gold">
                  🔒 Spiegazione Premium
                </h3>
                <p className="text-gray-600 dark:text-dark-text mb-3">
                  Le spiegazioni dettagliate sono disponibili solo per gli utenti premium.
                </p>
                <a 
                  href="/pricing"
                  className="inline-block bg-navy text-white px-4 py-2 rounded-lg text-sm hover:bg-opacity-90 transition dark:bg-gold dark:text-navy"
                >
                  Passa a Premium
                </a>
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
            className={`flex-1 py-4 rounded-lg font-semibold text-lg transition ${
              selectedAnswer
                ? 'bg-navy text-white hover:bg-opacity-90 dark:bg-gold dark:text-navy'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-dark-border dark:text-gray-600'
            }`}
          >
            Conferma Risposta
          </button>
        ) : (
          <button
            onClick={handleContinue}
            className="flex-1 bg-navy text-white py-4 rounded-lg font-semibold text-lg hover:bg-opacity-90 transition dark:bg-gold dark:text-navy"
          >
            {currentIndex < questions.length - 1 ? 'Prossima Domanda →' : 'Termina Quiz'}
          </button>
        )}
      </div>
    </div>
  )
}
