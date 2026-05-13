'use client'

import { useState, useRef, useEffect } from 'react'
import DashboardLayout from '@/app/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'

type Level = 'debutant' | 'intermediaire' | 'avance'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface DimensionItem {
  [key: string]: unknown
  nom?: string
  name?: string
  title?: string
  dimension?: string
  score?: number
  note?: number
  feedback?: string
  description?: string
  comment?: string
}

interface Evaluation {
  score_global: number
  score_message: string
  total_turns: number
  difficulty: string
  points_forts: DimensionItem[]
  axes_amelioration: DimensionItem[]
  recommandations: Array<{ titre?: string; description?: string; [key: string]: unknown }>
  all_dimensions: DimensionItem[]
  formatted_report: string
}

const mapDifficulty = (level: Level): string => {
  switch (level) {
    case 'debutant': return 'beginner'
    case 'intermediaire': return 'intermediate'
    case 'avance': return 'professional'
    default: return 'intermediate'
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_SIMULATION_API_URL || 'http://localhost:8002'
const SESSION_DURATION_MINUTES = 15
const SESSION_DURATION_MS = SESSION_DURATION_MINUTES * 60 * 1000

const levels: { value: Level; label: string; color: string; description: string }[] = [
  { value: 'debutant', label: 'Débutant', color: '#16A34A', description: 'Découverte des produits et argumentaires de base' },
  { value: 'intermediaire', label: 'Intermédiaire', color: '#0A6EBD', description: 'Maîtrise des arguments clés' },
  { value: 'avance', label: 'Avancé', color: '#F2A516', description: 'Gestion des objections complexes' },
]

const personas: { value: string; label: string; description: string; category: 'doctor' | 'pharmacy' | 'para' }[] = [
  { value: 'dermatologist_aesthetic', label: 'Dermatologue Esthétique', description: 'Exigeante sur les actifs et concentrations', category: 'doctor' },
  { value: 'dermatologist_medical', label: 'Dermatologue Médical', description: 'Focus sur la tolérance et les allergènes', category: 'doctor' },
  { value: 'aesthetic_doctor', label: 'Médecin Esthétique', description: 'Orientée résultats rapides et protocoles combinés', category: 'doctor' },
  { value: 'general_practitioner', label: 'Médecin Généraliste', description: 'Pragmatique, recommande les compléments pour carences', category: 'doctor' },
  { value: 'nutritionist', label: 'Nutritionniste', description: 'Analyse biodisponibilité et interactions alimentaires', category: 'doctor' },
  { value: 'naturopath', label: 'Naturopathe', description: 'Favorable aux actifs naturels, critique des conservateurs', category: 'doctor' },
  { value: 'endocrinologist', label: 'Endocrinologue', description: 'Compléments métaboliques et interactions médicamenteuses', category: 'doctor' },
  { value: 'gastroenterologist', label: 'Gastro-entérologue', description: 'Probiotiques ciblés, exige souches documentées', category: 'doctor' },
  { value: 'sports_doctor', label: 'Médecin du Sport', description: 'Récupération musculaire et hydratation', category: 'doctor' },
  { value: 'pharmacist_skincare', label: 'Pharmacienne Conseil', description: 'Compare les prix et compositions, connaît la concurrence', category: 'pharmacy' },
  { value: 'pharmacist_supplements', label: 'Pharmacien Nutrition', description: 'Méfiant des allégations non validées, vérifie certifications', category: 'pharmacy' },
  { value: 'parapharmacist', label: 'Conseillère Parapharmacie', description: 'Orientée tendances clean beauty et best-sellers', category: 'para' },
  { value: 'esthetician', label: 'Esthéticienne', description: 'Connaît les textures et routines de soin', category: 'para' },
  { value: 'makeup_artist', label: 'Maquilleur Pro', description: 'Focus tenue maquillage et bases hydratantes', category: 'para' },
  { value: 'spa_director', label: 'Directrice de Spa', description: 'Expérience client, marges et protocoles rituels', category: 'para' },
  { value: 'influencer', label: 'Influenceuse Beauté', description: 'Exigeante sur INCI, avis clients et packaging', category: 'para' },
  { value: 'patient_advocate', label: 'Association de Patients', description: 'Prix accessibles et formules non comédogènes', category: 'para' },
]

const categoryLabels: Record<string, string> = {
  doctor: '🩺 Médecins & Spécialistes',
  pharmacy: '💊 Pharmaciens',
  para: '✨ Parapharmacie & Beauté',
}

const Icons = {
  send: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>),
  check: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>),
  warning: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>),
  book: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>),
  loading: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/></circle></svg>),
  clock: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>),
  user: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>),
}

export default function EntrainementPage() {
  const { userData } = useAuth()
  const [step, setStep] = useState<'config' | 'consultation' | 'evaluation'>('config')
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null)
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number>(SESSION_DURATION_MS)
  const [isAutoEnding, setIsAutoEnding] = useState(false)
  const [showTimerWarning, setShowTimerWarning] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const getTimerColor = (): string => {
    if (timeRemaining < 60000) return '#DC2626'
    if (timeRemaining < 300000) return '#F2A516'
    return '#16A34A'
  }

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  const autoEndSession = async () => {
    if (!sessionId || isAutoEnding) return
    setIsAutoEnding(true)
    setMessages(prev => [...prev, { id: Date.now().toString(), text: "⏰ Le temps imparti est écoulé. Fin automatique de la simulation. Génération du rapport...", isUser: false, timestamp: new Date() }])
    await new Promise(resolve => setTimeout(resolve, 2000))
    try {
      const response = await fetch(`${API_BASE_URL}/session/${sessionId}/end`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      if (!response.ok) throw new Error('Failed to end session')
      const data = await response.json()
      setEvaluation(data)
      setStep('evaluation')
    } catch (error) {
      console.error('Failed to end session:', error)
      alert('Erreur lors de la génération du rapport')
    } finally {
      setIsAutoEnding(false)
      clearTimer()
    }
  }

  const startTimer = () => {
    clearTimer()
    setTimeRemaining(SESSION_DURATION_MS)
    setShowTimerWarning(false)
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1000) { clearTimer(); autoEndSession(); return 0 }
        return prev - 1000
      })
    }, 1000)
  }

  useEffect(() => {
    if (timeRemaining === 60000 && !showTimerWarning && step === 'consultation') {
      setShowTimerWarning(true)
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "⚠️ Attention : Il vous reste 1 minute avant la fin automatique de la simulation.", isUser: false, timestamp: new Date() }])
    }
  }, [timeRemaining, step, showTimerWarning])

  const endSession = async () => {
    if (!sessionId || isLoading || isAutoEnding) return
    const confirmEnd = window.confirm('Voulez-vous vraiment terminer la simulation ? Vous recevrez une évaluation.')
    if (!confirmEnd) return
    setIsLoading(true)
    clearTimer()
    try {
      const response = await fetch(`${API_BASE_URL}/session/${sessionId}/end`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      if (!response.ok) throw new Error('Failed to end session')
      const data = await response.json()
      setEvaluation(data)
      setStep('evaluation')
    } catch (error) {
      console.error('Failed to end session:', error)
      alert('Erreur lors de la génération du rapport')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { return () => clearTimer() }, [])

  const startConsultation = async () => {
    if (!selectedLevel || !selectedPersona || !userData?.id) return
    setIsStarting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delegate_id: userData.id, persona: selectedPersona, difficulty: mapDifficulty(selectedLevel) }),
      })
      if (!response.ok) throw new Error('Failed to start session')
      const data = await response.json()
      setSessionId(data.session_id)
      setMessages([{ id: '1', text: `Bonjour ! Je suis votre interlocuteur pour cette simulation. Vous avez ${SESSION_DURATION_MINUTES} minutes pour cet entretien. Commençons.`, isUser: false, timestamp: new Date() }])
      setStep('consultation')
      startTimer()
    } catch (error) {
      console.error('Failed to start session:', error)
      alert('Erreur lors du démarrage de la simulation. Veuillez réessayer.')
    } finally {
      setIsStarting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading || !sessionId || isAutoEnding) return
    const userMessage: Message = { id: Date.now().toString(), text: inputValue, isUser: true, timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    const currentMessage = inputValue
    setInputValue('')
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/analyze/text`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: sessionId, text: currentMessage }) })
      if (!response.ok) throw new Error('Failed to process message')
      const data = await response.json()
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: data.doctor_response, isUser: false, timestamp: new Date() }])
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: "Désolé, une erreur s'est produite. Veuillez réessayer.", isUser: false, timestamp: new Date() }])
    } finally {
      setIsLoading(false)
    }
  }

  const restartTraining = () => {
    clearTimer()
    setStep('config')
    setSelectedLevel(null)
    setSelectedPersona(null)
    setMessages([])
    setEvaluation(null)
    setSessionId(null)
    setTimeRemaining(SESSION_DURATION_MS)
    setShowTimerWarning(false)
  }

  const getPersonaLabel = (): string => personas.find(p => p.value === selectedPersona)?.label || 'Professionnel'

  const getLabel = (item: DimensionItem): string =>
    String(item.nom ?? item.name ?? item.title ?? item.dimension ?? Object.values(item).find(v => typeof v === 'string') ?? '')
  const getScore = (item: DimensionItem): string => String(item.score ?? item.note ?? '')
  const getFeedback = (item: DimensionItem): string => String(item.feedback ?? item.description ?? item.comment ?? '')
  const getRecoTitle = (rec: { titre?: string; description?: string; [key: string]: unknown }): string => String(rec.titre ?? rec.title ?? rec.name ?? '')
  const getRecoDesc = (rec: { titre?: string; description?: string; [key: string]: unknown }): string => String(rec.description ?? rec.feedback ?? rec.detail ?? '')

  const groupedPersonas = (['doctor', 'pharmacy', 'para'] as const).map(cat => ({
    category: cat,
    label: categoryLabels[cat],
    items: personas.filter(p => p.category === cat),
  }))

  const canStart = !selectedLevel || !selectedPersona || isStarting

  return (
    <DashboardLayout role="delegue">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px', background: 'linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Simulation d'entretien médical
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Entraînez-vous avec des professionnels de santé virtuels et améliorez vos compétences commerciales
          </p>
        </div>

        {/* ── Config ── */}
        {step === 'config' && (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>Niveau de difficulté</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {levels.map(level => (
                  <button key={level.value} onClick={() => setSelectedLevel(level.value)} style={{ padding: '20px', background: selectedLevel === level.value ? `${level.color}15` : 'white', border: `2px solid ${selectedLevel === level.value ? level.color : 'var(--color-border)'}`, borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: selectedLevel === level.value ? level.color : 'var(--color-text-primary)', marginBottom: '8px' }}>{level.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{level.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px' }}>Choisissez votre interlocuteur</h2>
              {groupedPersonas.map(group => (
                <div key={group.category} style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', paddingLeft: '2px' }}>
                    {group.label}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                    {group.items.map(p => (
                      <button key={p.value} onClick={() => setSelectedPersona(p.value)} style={{ padding: '14px 16px', background: selectedPersona === p.value ? 'rgba(10,110,189,0.06)' : 'white', border: `2px solid ${selectedPersona === p.value ? 'var(--color-brand-primary)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px', color: selectedPersona === p.value ? 'var(--color-brand-primary)' : 'var(--color-text-primary)' }}>{p.label}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{p.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={startConsultation} disabled={canStart} style={{ width: '100%', padding: '16px', background: canStart ? 'var(--color-surface-3)' : 'var(--gradient-brand)', color: canStart ? 'var(--color-text-muted)' : 'white', border: 'none', borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', cursor: canStart ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              {isStarting ? <>{Icons.loading} Démarrage de la simulation...</> : `Démarrer la simulation (${SESSION_DURATION_MINUTES} minutes max)`}
            </button>
          </div>
        )}

        {/* ── Consultation ── */}
        {step === 'consultation' && (
          <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', background: 'linear-gradient(135deg, #0D1B2A, #0A3D62)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Simulation avec {getPersonaLabel()}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Niveau {levels.find(l => l.value === selectedLevel)?.label}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '8px 16px', borderRadius: '999px' }}>
                {Icons.clock}
                <span style={{ fontFamily: 'monospace', fontSize: '1.3rem', fontWeight: 700, color: getTimerColor(), letterSpacing: '2px' }}>{formatTimeRemaining(timeRemaining)}</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>restant</span>
              </div>
              <button onClick={endSession} disabled={isLoading || isAutoEnding} style={{ padding: '8px 20px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 'var(--radius-md)', color: 'white', cursor: (isLoading || isAutoEnding) ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
                {isAutoEnding ? 'Fin automatique...' : 'Terminer la simulation'}
              </button>
            </div>

            <div style={{ height: '450px', overflowY: 'auto', padding: '24px', background: 'var(--color-surface-0)' }}>
              {messages.map((msg) => (
                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.isUser ? 'flex-end' : 'flex-start', marginBottom: '16px' }}>
                  {!msg.isUser && (<div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', flexShrink: 0, color: 'white' }}>{Icons.user}</div>)}
                  <div style={{ maxWidth: '70%', padding: '12px 18px', borderRadius: msg.isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: msg.isUser ? 'var(--gradient-brand)' : 'var(--color-surface-1)', color: msg.isUser ? 'white' : 'var(--color-text-primary)', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                  {msg.isUser && (<div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0A6EBD', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '12px', flexShrink: 0, color: 'white', fontSize: '0.9rem' }}>👤</div>)}
                </div>
              ))}
              {isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gradient-brand)', flexShrink: 0 }} />
                  <div style={{ padding: '12px 20px', borderRadius: '18px', background: 'var(--color-surface-1)', display: 'flex', alignItems: 'center', gap: '8px' }}>{Icons.loading}<span>L'interlocuteur réfléchit...</span></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '20px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '12px', background: 'white' }}>
              <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Votre réponse..." disabled={isAutoEnding} style={{ flex: 1, padding: '12px 16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', outline: 'none', opacity: isAutoEnding ? 0.6 : 1 }} />
              <button type="submit" disabled={isLoading || !inputValue.trim() || isAutoEnding} style={{ padding: '0 28px', background: (isLoading || !inputValue.trim() || isAutoEnding) ? 'var(--color-surface-3)' : 'var(--gradient-brand)', border: 'none', borderRadius: 'var(--radius-md)', color: 'white', fontFamily: 'var(--font-display)', fontWeight: 600, cursor: (isLoading || !inputValue.trim() || isAutoEnding) ? 'not-allowed' : 'pointer', opacity: (isLoading || !inputValue.trim() || isAutoEnding) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Envoyer {Icons.send}
              </button>
            </form>
          </div>
        )}

        {/* ── Évaluation ── */}
        {step === 'evaluation' && evaluation && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, #0D1B2A, #0A3D62)', borderRadius: 'var(--radius-lg)', padding: '32px', textAlign: 'center', marginBottom: '24px', color: 'white' }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '8px' }}>Score global</div>
              <div style={{ fontSize: '4rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '8px' }}>{evaluation.score_global}%</div>
              <div style={{ width: '200px', height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', margin: '0 auto', overflow: 'hidden' }}>
                <div style={{ width: `${evaluation.score_global}%`, height: '100%', background: evaluation.score_global >= 80 ? '#16A34A' : evaluation.score_global >= 60 ? '#F2A516' : '#DC2626', borderRadius: '4px', transition: 'width 1s ease' }} />
              </div>
              <div style={{ fontSize: '0.9rem', marginTop: '16px' }}>{evaluation.score_message}</div>
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
              {evaluation.points_forts?.length > 0 && (
                <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '8px' }}>{Icons.check} Points forts</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {evaluation.points_forts.map((point, i) => (
                      <div key={i} style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 700, color: '#15803D', flex: 1, minWidth: 0 }}>{getLabel(point)}</span>
                          <span style={{ background: '#16A34A', color: 'white', fontWeight: 700, fontSize: '0.8rem', padding: '2px 10px', borderRadius: '20px', whiteSpace: 'nowrap', flexShrink: 0 }}>{getScore(point)}/100</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#166534' }}>{getFeedback(point)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {evaluation.axes_amelioration?.length > 0 && (
                <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: '#F2A516', display: 'flex', alignItems: 'center', gap: '8px' }}>{Icons.warning} Axes d'amélioration</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {evaluation.axes_amelioration.map((axe, i) => (
                      <div key={i} style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 700, color: '#92400E', flex: 1, minWidth: 0 }}>{getLabel(axe)}</span>
                          <span style={{ background: '#F2A516', color: 'white', fontWeight: 700, fontSize: '0.8rem', padding: '2px 10px', borderRadius: '20px', whiteSpace: 'nowrap', flexShrink: 0 }}>{getScore(axe)}/100</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#78350F' }}>{getFeedback(axe)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {evaluation.recommandations?.length > 0 && (
                <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--color-brand-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>{Icons.book} Recommandations</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {evaluation.recommandations.map((rec, i) => (
                      <div key={i} style={{ background: 'rgba(10,110,189,0.04)', border: '1px solid rgba(10,110,189,0.15)', borderRadius: '10px', padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--color-brand-primary)' }}>{getRecoTitle(rec)}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{getRecoDesc(rec)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={restartTraining} style={{ padding: '14px', background: 'var(--gradient-brand)', border: 'none', borderRadius: 'var(--radius-lg)', color: 'white', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', marginTop: '8px' }}>
                Recommencer une simulation
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}