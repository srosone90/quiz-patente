import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipi per il database
export interface Question {
  id: number
  question: string
  answers: string[]
  correct_answer: string
  category?: string
  explanation?: string
}

export interface QuizResult {
  id: number
  user_id: string
  score_percentage: number
  correct_answers: number
  total_questions: number
  quiz_type: 'free' | 'premium'
  completed_at: string
}

export interface UserProfile {
  id: string
  full_name?: string
  subscription_type: 'free' | 'last_minute' | 'senza_pensieri'
  subscription_expires_at?: string
  is_admin?: boolean
}

export interface QuizAnswer {
  id: number
  user_id: string
  quiz_result_id: number
  question_id: number
  question_text: string
  user_answer: string
  correct_answer: string
  is_correct: boolean
  category?: string
  answered_at: string
}

export interface AccessCode {
  id: number
  code: string
  school_name: string
  plan_type: string
  duration_days: number
  max_uses: number
  used_count: number
  is_active: boolean
  created_at: string
  expires_at?: string
  qr_code_url?: string
  notes?: string
}

// Funzioni helper per autenticazione
export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })
  return { data, error }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Funzioni per i risultati quiz
export async function saveQuizResult(
  scorePercentage: number,
  correctAnswers: number,
  totalQuestions: number,
  quizType: 'free' | 'premium' = 'free'
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('quiz_results')
    .insert([
      {
        user_id: user.id,
        score_percentage: scorePercentage,
        correct_answers: correctAnswers,
        total_questions: totalQuestions,
        quiz_type: quizType,
      },
    ])
    .select()

  return { data, error }
}

export async function getQuizHistory() {
  const user = await getCurrentUser()
  if (!user) return { data: [], error: null }

  const { data, error } = await supabase
    .from('quiz_results')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(10)

  return { data, error }
}

export async function getUserProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.log('getUserProfile: No user found')
    return { data: null, error: null }
  }

  console.log('getUserProfile: Loading profile for user', user.id)

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  console.log('getUserProfile: Profile data', data)
  console.log('getUserProfile: subscription_type =', data?.subscription_type)

  return { data, error }
}

// ============================================
// NUOVE FUNZIONI PER FEATURE AVANZATE
// ============================================

// Salva risposte individuali per "Ripassa Errori"
export async function saveQuizAnswers(
  quizResultId: number,
  answers: Array<{
    questionId: number
    questionText: string
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
    category?: string
  }>
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const answersData = answers.map(a => ({
    user_id: user.id,
    quiz_result_id: quizResultId,
    question_id: a.questionId,
    question_text: a.questionText,
    user_answer: a.userAnswer,
    correct_answer: a.correctAnswer,
    is_correct: a.isCorrect,
    category: a.category
  }))

  const { data, error } = await supabase
    .from('quiz_answers')
    .insert(answersData)
    .select()

  return { data, error }
}

// Ottieni domande sbagliate per "Ripassa Errori"
// Solo l'ultima risposta per ogni domanda - se l'ultima è corretta, la domanda non compare
export async function getWrongAnswers(limit: number = 50) {
  const user = await getCurrentUser()
  if (!user) return { data: [], error: null }

  // Ottieni tutte le risposte dell'utente ordinate per data
  const { data: allAnswers, error } = await supabase
    .from('quiz_answers')
    .select('*')
    .eq('user_id', user.id)
    .order('answered_at', { ascending: false })

  if (error) return { data: [], error }
  if (!allAnswers) return { data: [], error: null }

  // Raggruppa per question_id e prendi solo l'ultima risposta
  const latestAnswersMap = new Map()
  allAnswers.forEach(answer => {
    if (!latestAnswersMap.has(answer.question_id)) {
      latestAnswersMap.set(answer.question_id, answer)
    }
  })

  // Filtra solo quelle sbagliate e limita il numero
  const wrongAnswers = Array.from(latestAnswersMap.values())
    .filter(answer => !answer.is_correct)
    .slice(0, limit)

  return { data: wrongAnswers, error: null }
}

// Ottieni domande per categoria
export async function getQuestionsByCategory(category: string, limit: number = 20) {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('category', category)
    .order('id')
    .limit(limit * 3) // Prendi 3x per avere margine per shuffle

  return { data, error }
}

// Ottieni categorie disponibili
export async function getCategories() {
  const { data, error } = await supabase
    .from('questions')
    .select('category')
    .order('category')

  if (data) {
    const uniqueCategories = [...new Set(data.map(d => d.category).filter(Boolean))]
    return { data: uniqueCategories, error: null }
  }

  return { data: [], error }
}

// Riscatta codice di accesso
export async function redeemAccessCode(code: string) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.error('redeemAccessCode: No user found')
    throw new Error('User not authenticated')
  }

  console.log('redeemAccessCode: Calling RPC with', { code, user_id: user.id })

  const { data, error } = await supabase
    .rpc('redeem_access_code', {
      p_code: code,
      p_user_id: user.id
    })

  console.log('redeemAccessCode: RPC response', { data, error })

  return { data, error }
}

// Verifica se utente è admin
export async function isAdmin() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('isAdmin: No user found')
      return false
    }

    console.log('isAdmin: Checking for user', user.id)

    const { data, error } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('isAdmin: Error fetching profile', error)
      return false
    }

    console.log('isAdmin: Profile data', data)
    return data?.is_admin === true
  } catch (error) {
    console.error('isAdmin: Exception', error)
    return false
  }
}

// ============================================
// FUNZIONI ADMIN
// ============================================

// Ottieni statistiche globali per admin
export async function getAdminGlobalStats() {
  const { data, error } = await supabase
    .from('admin_global_stats')
    .select('*')
    .single()

  return { data, error }
}

// Ottieni statistiche domande per admin
export async function getAdminQuestionStats(limit: number = 50) {
  const { data, error } = await supabase
    .from('admin_question_stats')
    .select('*')
    .limit(limit)

  return { data, error }
}

// Genera codice di accesso per scuole guida
export async function generateAccessCode(
  schoolName: string,
  planType: 'last_minute' | 'senza_pensieri',
  durationDays: number,
  maxUses: number = 1,
  expiresAt?: string
) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.error('generateAccessCode: No user found')
    throw new Error('User not authenticated')
  }

  const code = `${planType.toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

  console.log('Generating code:', { code, schoolName, planType, durationDays, maxUses, userId: user.id })

  const { data, error } = await supabase
    .from('access_codes')
    .insert([{
      code,
      school_name: schoolName,
      plan_type: planType,
      duration_days: durationDays,
      max_uses: maxUses,
      created_by: user.id,
      expires_at: expiresAt || null
    }])
    .select()

  if (error) {
    console.error('Error generating code:', error)
    throw new Error(error.message || 'Errore nella creazione del codice')
  }

  console.log('Code generated successfully:', code)
  return code
}

// Ottieni tutti i codici (admin)
export async function getAllAccessCodes() {
  const { data, error } = await supabase
    .from('access_codes')
    .select('*, code_redemptions(count)')
    .order('created_at', { ascending: false })

  return { data, error }
}

// Disattiva codice (admin)
export async function deactivateAccessCode(codeId: number) {
  // Prima trova tutti gli utenti che hanno riscattato questo codice
  const { data: redemptions, error: redemptionsError } = await supabase
    .from('code_redemptions')
    .select('user_id')
    .eq('code_id', codeId)

  if (redemptionsError) {
    console.error('Error getting redemptions:', redemptionsError)
    return { data: null, error: redemptionsError }
  }

  // Invalida le subscription di tutti gli utenti che hanno riscattato il codice
  if (redemptions && redemptions.length > 0) {
    const userIds = redemptions.map(r => r.user_id)
    
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        subscription_type: 'free',
        subscription_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .in('id', userIds)

    if (updateError) {
      console.error('Error invalidating subscriptions:', updateError)
      return { data: null, error: updateError }
    }

    console.log(`Invalidated subscriptions for ${userIds.length} users`)
  }

  // Infine disattiva il codice
  const { data, error } = await supabase
    .from('access_codes')
    .update({ is_active: false })
    .eq('id', codeId)
    .select()

  return { data, error }
}

// Ottieni tutti gli utenti (admin)
export async function getAllUsers() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      quiz_results(count)
    `)
    .order('created_at', { ascending: false })

  return { data, error }
}

// Aggiorna subscription utente (admin)
export async function updateUserSubscription(
  userId: string,
  subscriptionType: string,
  expiresAt?: string
) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      subscription_type: subscriptionType,
      subscription_expires_at: expiresAt,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()

  return { data, error }
}

// ========================================
// FUNZIONI GESTIONALE B2B
// ========================================

// Tipi B2B
export interface B2BClient {
  id: string
  business_name: string
  vat_number?: string
  tax_code?: string
  legal_address?: string
  city?: string
  postal_code?: string
  province?: string
  phone?: string
  mobile?: string
  email?: string
  pec?: string
  website?: string
  status: 'lead' | 'contacted' | 'proposal_sent' | 'negotiation' | 'active' | 'inactive' | 'lost'
  source?: 'phone' | 'email' | 'fair' | 'referral' | 'website' | 'other'
  potential_students_year?: number
  commercial_notes?: string
  payment_terms: 'immediate' | '30_days' | '60_days' | '90_days'
  discount_percentage?: number
  billing_frequency: 'immediate' | 'monthly' | 'quarterly' | 'annual'
  sdi_code?: string
  first_contact_date?: string
  created_at?: string
  updated_at?: string
  archived: boolean
}

export interface B2BContact {
  id: string
  client_id: string
  full_name: string
  role?: string
  direct_phone?: string
  email?: string
  is_primary: boolean
  notes?: string
  created_at?: string
}

export interface B2BContract {
  id: string
  client_id: string
  contract_number: string
  start_date: string
  end_date: string
  status: 'active' | 'expired' | 'cancelled' | 'renewal'
  contract_type: 'standard' | 'premium' | 'custom'
  price_per_student?: number
  included_students?: number
  included_services?: any
  contract_pdf_url?: string
  created_at?: string
  updated_at?: string
}

export interface B2BAppointment {
  id: string
  client_id: string
  title: string
  appointment_type: 'call' | 'meeting' | 'presentation' | 'followup' | 'contract_signing' | 'renewal' | 'support' | 'review'
  appointment_date: string
  duration_minutes: number
  location?: string
  location_type?: 'client_office' | 'our_office' | 'videocall' | 'phone'
  participants?: string
  objective?: string
  pre_notes?: string
  outcome_notes?: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  created_at?: string
  created_by?: string
}

export interface B2BInvoice {
  id: string
  client_id: string
  invoice_number: string
  issue_date: string
  due_date: string
  net_amount: number
  vat_percentage: number
  vat_amount: number
  total_amount: number
  description?: string
  payment_status: 'unpaid' | 'paid' | 'overdue' | 'partial'
  payment_date?: string
  pdf_url?: string
  xml_url?: string
  created_at?: string
  updated_at?: string
}

export interface B2BTask {
  id: string
  client_id?: string
  title: string
  description?: string
  due_date?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'in_progress' | 'done' | 'cancelled'
  category?: 'sales' | 'support' | 'technical' | 'administrative' | 'other'
  assigned_to?: string
  created_by?: string
  created_at?: string
  completed_at?: string
}

// === CLIENTI B2B ===

export async function getAllB2BClients(includeArchived = false) {
  let query = supabase
    .from('b2b_clients')
    .select(`
      *,
      b2b_contacts(count),
      b2b_contracts(count)
    `)
    .order('created_at', { ascending: false })

  if (!includeArchived) {
    query = query.eq('archived', false)
  }

  const { data, error } = await query
  return { data, error }
}

export async function getB2BClientById(clientId: string) {
  const { data, error } = await supabase
    .from('b2b_clients')
    .select(`
      *,
      b2b_contacts(*),
      b2b_contracts(*),
      b2b_invoices(*),
      b2b_appointments(*),
      b2b_notes(*)
    `)
    .eq('id', clientId)
    .single()

  return { data, error }
}

export async function createB2BClient(client: Partial<B2BClient>) {
  const { data, error } = await supabase
    .from('b2b_clients')
    .insert(client)
    .select()
    .single()

  return { data, error }
}

export async function updateB2BClient(clientId: string, updates: Partial<B2BClient>) {
  const { data, error } = await supabase
    .from('b2b_clients')
    .update(updates)
    .eq('id', clientId)
    .select()
    .single()

  return { data, error }
}

export async function archiveB2BClient(clientId: string) {
  const { data, error } = await supabase
    .from('b2b_clients')
    .update({ archived: true })
    .eq('id', clientId)
    .select()

  return { data, error }
}

// === REFERENTI ===

export async function getContactsByClientId(clientId: string) {
  const { data, error } = await supabase
    .from('b2b_contacts')
    .select('*')
    .eq('client_id', clientId)
    .order('is_primary', { ascending: false })

  return { data, error }
}

export async function createB2BContact(contact: Partial<B2BContact>) {
  const { data, error } = await supabase
    .from('b2b_contacts')
    .insert(contact)
    .select()
    .single()

  return { data, error }
}

export async function updateB2BContact(contactId: string, updates: Partial<B2BContact>) {
  const { data, error } = await supabase
    .from('b2b_contacts')
    .update(updates)
    .eq('id', contactId)
    .select()
    .single()

  return { data, error }
}

export async function deleteB2BContact(contactId: string) {
  const { data, error } = await supabase
    .from('b2b_contacts')
    .delete()
    .eq('id', contactId)

  return { data, error }
}

// === CONTRATTI ===

export async function getContractsByClientId(clientId: string) {
  const { data, error } = await supabase
    .from('b2b_contracts')
    .select('*')
    .eq('client_id', clientId)
    .order('end_date', { ascending: false })

  return { data, error }
}

export async function getExpiringContracts(days = 90) {
  const { data, error } = await supabase
    .rpc('v_expiring_contracts')

  return { data, error }
}

export async function createB2BContract(contract: Partial<B2BContract>) {
  const { data, error } = await supabase
    .from('b2b_contracts')
    .insert(contract)
    .select()
    .single()

  return { data, error }
}

export async function updateB2BContract(contractId: string, updates: Partial<B2BContract>) {
  const { data, error } = await supabase
    .from('b2b_contracts')
    .update(updates)
    .eq('id', contractId)
    .select()
    .single()

  return { data, error }
}

// === APPUNTAMENTI ===

export async function getAllB2BAppointments(startDate?: string, endDate?: string) {
  let query = supabase
    .from('b2b_appointments')
    .select(`
      *,
      b2b_clients(business_name, phone, email)
    `)
    .order('appointment_date', { ascending: true })

  if (startDate) {
    query = query.gte('appointment_date', startDate)
  }
  if (endDate) {
    query = query.lte('appointment_date', endDate)
  }

  const { data, error } = await query
  return { data, error }
}

export async function getUpcomingAppointments() {
  const { data, error } = await supabase
    .from('b2b_appointments')
    .select(`
      *,
      b2b_clients(business_name, phone, email)
    `)
    .eq('status', 'scheduled')
    .gte('appointment_date', new Date().toISOString())
    .order('appointment_date', { ascending: true })
    .limit(10)

  return { data, error }
}

export async function createB2BAppointment(appointment: Partial<B2BAppointment>) {
  const user = await getCurrentUser()
  
  const { data, error } = await supabase
    .from('b2b_appointments')
    .insert({
      ...appointment,
      created_by: user?.id
    })
    .select()
    .single()

  return { data, error }
}

export async function updateB2BAppointment(appointmentId: string, updates: Partial<B2BAppointment>) {
  const { data, error } = await supabase
    .from('b2b_appointments')
    .update(updates)
    .eq('id', appointmentId)
    .select()
    .single()

  return { data, error }
}

export async function deleteB2BAppointment(appointmentId: string) {
  const { data, error } = await supabase
    .from('b2b_appointments')
    .delete()
    .eq('id', appointmentId)

  return { data, error }
}

// === FATTURE ===

export async function getAllB2BInvoices() {
  const { data, error } = await supabase
    .from('b2b_invoices')
    .select(`
      *,
      b2b_clients(business_name)
    `)
    .order('issue_date', { ascending: false })

  return { data, error }
}

export async function getOverdueInvoices() {
  const { data, error } = await supabase
    .from('b2b_invoices')
    .select(`
      *,
      b2b_clients(business_name, email, phone)
    `)
    .in('payment_status', ['unpaid', 'partial'])
    .lt('due_date', new Date().toISOString().split('T')[0])
    .order('due_date', { ascending: true })

  return { data, error }
}

export async function createB2BInvoice(invoice: Partial<B2BInvoice>) {
  const { data, error } = await supabase
    .from('b2b_invoices')
    .insert(invoice)
    .select()
    .single()

  return { data, error }
}

export async function updateB2BInvoice(invoiceId: string, updates: Partial<B2BInvoice>) {
  const { data, error } = await supabase
    .from('b2b_invoices')
    .update(updates)
    .eq('id', invoiceId)
    .select()
    .single()

  return { data, error }
}

// === TASK ===

export async function getAllB2BTasks(includeCompleted = false) {
  let query = supabase
    .from('b2b_tasks')
    .select(`
      *,
      b2b_clients(business_name)
    `)
    .order('due_date', { ascending: true })

  if (!includeCompleted) {
    query = query.neq('status', 'done')
  }

  const { data, error } = await query
  return { data, error }
}

export async function createB2BTask(task: Partial<B2BTask>) {
  const user = await getCurrentUser()
  
  const { data, error } = await supabase
    .from('b2b_tasks')
    .insert({
      ...task,
      created_by: user?.id
    })
    .select()
    .single()

  return { data, error }
}

export async function updateB2BTask(taskId: string, updates: Partial<B2BTask>) {
  const { data, error } = await supabase
    .from('b2b_tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single()

  return { data, error }
}

export async function deleteB2BTask(taskId: string) {
  const { data, error } = await supabase
    .from('b2b_tasks')
    .delete()
    .eq('id', taskId)

  return { data, error }
}

// === NOTE ===

export async function getNotesByClientId(clientId: string) {
  const { data, error } = await supabase
    .from('b2b_notes')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function createB2BNote(note: { client_id: string; note_text: string; note_type?: string }) {
  const user = await getCurrentUser()
  
  const { data, error } = await supabase
    .from('b2b_notes')
    .insert({
      ...note,
      created_by: user?.id
    })
    .select()
    .single()

  return { data, error }
}

// === STATISTICHE E DASHBOARD ===

export async function getCRMPipelineStats() {
  const { data, error } = await supabase
    .from('b2b_clients')
    .select('status')
    .eq('archived', false)

  if (error) return { data: null, error }

  const stats = {
    lead: 0,
    contacted: 0,
    proposal_sent: 0,
    negotiation: 0,
    active: 0,
    inactive: 0,
    lost: 0
  }

  data?.forEach((client: any) => {
    if (stats.hasOwnProperty(client.status)) {
      stats[client.status as keyof typeof stats]++
    }
  })

  return { data: stats, error: null }
}

export async function getB2BDashboardStats() {
  // Totale clienti attivi
  const { count: activeClients } = await supabase
    .from('b2b_clients')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('archived', false)

  // Fatture non pagate
  const { count: unpaidInvoices } = await supabase
    .from('b2b_invoices')
    .select('*', { count: 'exact', head: true })
    .in('payment_status', ['unpaid', 'partial'])

  // Contratti in scadenza (90 giorni)
  const ninetyDaysFromNow = new Date()
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)
  
  const { count: expiringContracts } = await supabase
    .from('b2b_contracts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .lte('end_date', ninetyDaysFromNow.toISOString().split('T')[0])

  // Appuntamenti prossimi
  const { count: upcomingAppointments } = await supabase
    .from('b2b_appointments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'scheduled')
    .gte('appointment_date', new Date().toISOString())

  return {
    activeClients: activeClients || 0,
    unpaidInvoices: unpaidInvoices || 0,
    expiringContracts: expiringContracts || 0,
    upcomingAppointments: upcomingAppointments || 0
  }
}

// === MIGLIORAMENTO GESTIONE CODICI ===

export async function deleteAccessCode(codeId: number) {
  const { data, error } = await supabase
    .from('access_codes')
    .delete()
    .eq('id', codeId)

  return { data, error }
}

export async function updateAccessCode(codeId: number, updates: Partial<AccessCode>) {
  const { data, error } = await supabase
    .from('access_codes')
    .update(updates)
    .eq('id', codeId)
    .select()
    .single()

  return { data, error }
}

export async function searchAccessCodes(filters: {
  schoolName?: string
  planType?: string
  isActive?: boolean
  status?: 'active' | 'used' | 'expired'
}) {
  let query = supabase
    .from('access_codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters.schoolName) {
    query = query.ilike('school_name', `%${filters.schoolName}%`)
  }
  if (filters.planType) {
    query = query.eq('plan_type', filters.planType)
  }
  if (filters.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive)
  }

  const { data, error } = await query
  
  if (!data || error) return { data, error }

  // Filtra per status
  let filtered = data
  if (filters.status === 'used') {
    filtered = data.filter((code: any) => code.used_count >= code.max_uses)
  } else if (filters.status === 'expired') {
    filtered = data.filter((code: any) => 
      code.expires_at && new Date(code.expires_at) < new Date()
    )
  } else if (filters.status === 'active') {
    filtered = data.filter((code: any) => 
      code.is_active && 
      code.used_count < code.max_uses &&
      (!code.expires_at || new Date(code.expires_at) >= new Date())
    )
  }

  return { data: filtered, error: null }
}

// ============================================
// GAMIFICATION FUNCTIONS
// ============================================

export interface UserProgress {
  id: string
  user_id: string
  total_xp: number
  level: number
  current_streak: number
  longest_streak: number
  last_activity_date: string
  total_quizzes_completed: number
  total_questions_answered: number
  correct_answers: number
}

export interface Achievement {
  id: string
  code: string
  name_it: string
  name_en: string
  description_it: string
  description_en: string
  icon: string
  xp_reward: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  requirement_type: string
  requirement_value: number
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: string
  achievement?: Achievement
}

// Get user progress (XP, level, streak)
export async function getUserProgress(userId: string): Promise<UserProgress | null> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching user progress:', error)
    return null
  }
  
  return data
}

// Get all achievements
export async function getAchievements(): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('tier', { ascending: true })
    .order('xp_reward', { ascending: true })
  
  if (error) {
    console.error('Error fetching achievements:', error)
    return []
  }
  
  return data || []
}

// Get user unlocked achievements
export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select(`
      *,
      achievement:achievements(*)
    `)
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching user achievements:', error)
    return []
  }
  
  return data || []
}

// Check and unlock achievements
export async function checkAndUnlockAchievements(userId: string): Promise<void> {
  const progress = await getUserProgress(userId)
  if (!progress) return

  const allAchievements = await getAchievements()
  const userAchievements = await getUserAchievements(userId)
  const unlockedCodes = userAchievements.map(ua => ua.achievement?.code)

  for (const achievement of allAchievements) {
    // Skip already unlocked
    if (unlockedCodes.includes(achievement.code)) continue

    let shouldUnlock = false

    // Check requirements
    switch (achievement.requirement_type) {
      case 'quiz_count':
        shouldUnlock = progress.total_quizzes_completed >= achievement.requirement_value
        break
      case 'streak':
        shouldUnlock = progress.current_streak >= achievement.requirement_value
        break
      case 'level':
        shouldUnlock = progress.level >= achievement.requirement_value
        break
      case 'accuracy':
        const accuracy = (progress.correct_answers / progress.total_questions_answered) * 100
        shouldUnlock = accuracy >= achievement.requirement_value && progress.total_quizzes_completed >= 50
        break
    }

    if (shouldUnlock) {
      await unlockAchievement(userId, achievement.id)
    }
  }
}

// Unlock specific achievement
async function unlockAchievement(userId: string, achievementId: string): Promise<void> {
  const { error } = await supabase
    .from('user_achievements')
    .insert({ user_id: userId, achievement_id: achievementId })
  
  if (error) {
    console.error('Error unlocking achievement:', error)
  }
}

// Get weekly leaderboard
export async function getWeeklyLeaderboard(limit: number = 10): Promise<any[]> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('user_id, total_xp, level, total_quizzes_completed')
    .order('total_xp', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }
  
  return data || []
}

// Calculate XP for level up milestones
export function getXPForLevel(level: number): number {
  return level * level * 100 // livello^2 * 100
}

export function getXPProgress(currentXP: number, level: number): { current: number, needed: number, percentage: number } {
  const currentLevelXP = getXPForLevel(level)
  const nextLevelXP = getXPForLevel(level + 1)
  const xpIntoLevel = currentXP - currentLevelXP
  const xpNeededForNext = nextLevelXP - currentLevelXP
  
  return {
    current: xpIntoLevel,
    needed: xpNeededForNext,
    percentage: Math.min(100, (xpIntoLevel / xpNeededForNext) * 100)
  }
}
