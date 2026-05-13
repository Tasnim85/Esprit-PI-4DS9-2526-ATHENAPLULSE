'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/app/components/layout/DashboardLayout'

interface SessionSummary {
  session_id: string
  delegate_id: string
  persona: string
  difficulty: string
  created_at: string
  overall_score: number
  status: string
}

interface EvaluationReport {
  score_global: number
  score_message: string
  total_turns: number
  difficulty: string
  points_forts: any[]
  axes_amelioration: any[]
  recommandations: any[]
  all_dimensions: any[]
  formatted_report: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_SIMULATION_API_URL || 'http://localhost:8002'

const Icons = {
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  download: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  ),
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  ),
  loading: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
      </circle>
    </svg>
  ),
  user: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  calendar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
}

const personasMap: Record<string, string> = {
  dermatologist_aesthetic: 'Dermatologue Esthétique',
  dermatologist_medical: 'Dermatologue Médical',
  aesthetic_doctor: 'Médecin Esthétique',
  general_practitioner: 'Médecin Généraliste',
  nutritionist: 'Nutritionniste',
  naturopath: 'Naturopathe',
  endocrinologist: 'Endocrinologue',
  gastroenterologist: 'Gastro-entérologue',
  sports_doctor: 'Médecin du Sport',
  pharmacist_skincare: 'Pharmacienne Conseil',
  pharmacist_supplements: 'Pharmacien Nutrition',
  parapharmacist: 'Conseillère Parapharmacie',
  esthetician: 'Esthéticienne',
  makeup_artist: 'Maquilleur Pro',
  spa_director: 'Directrice de Spa',
  influencer: 'Influenceuse Beauté',
  patient_advocate: 'Association de Patients',
}

const difficultyMap: Record<string, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  professional: 'Avancé',
}

// Composant Modal pour le rapport
function ReportModal({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const [report, setReport] = useState<EvaluationReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/session/${sessionId}/report`)
        if (!response.ok) throw new Error('Failed to fetch report')
        const data = await response.json()
        setReport(data)
      } catch (error) {
        console.error('Failed to fetch report:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [sessionId])

  const getScoreConfig = (score: number) => {
    if (score >= 70) return { color: '#10b981', bgLight: '#d1fae5', text: '#065f46', border: '#10b981', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', icon: '🎯', label: 'Excellent' }
    if (score >= 50) return { color: '#f59e0b', bgLight: '#fed7aa', text: '#92400e', border: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', icon: '⚖️', label: 'Intermédiaire' }
    return { color: '#ef4444', bgLight: '#fee2e2', text: '#991b1b', border: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', icon: '⚠️', label: 'À améliorer' }
  }

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '40px', textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #e5e7eb', 
            borderTopColor: '#0A6EBD',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 12px',
          }} />
          <p style={{ color: '#6b7280' }}>Chargement du rapport...</p>
        </div>
      </div>
    )
  }

  if (!report) return null

  const scoreConfig = getScoreConfig(report.score_global)

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: scoreConfig.gradient,
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Rapport détaillé</div>
            <div style={{ fontWeight: 700 }}>Session: {sessionId.slice(0, 12)}...</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              color: 'white',
            }}
          >
            ✕ Fermer
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '32px' }}>
          {/* Score Section */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
              <svg width="140" height="140" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                <circle cx="80" cy="80" r="70" fill="none" stroke={scoreConfig.color} strokeWidth="12" strokeDasharray={`${(report.score_global / 100) * 439.82} 439.82`} strokeLinecap="round" transform="rotate(-90 80 80)" style={{ transition: 'stroke-dasharray 1s ease' }} />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: scoreConfig.color }}>{report.score_global}</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>/100</div>
              </div>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '40px', background: scoreConfig.bgLight, color: scoreConfig.text, fontSize: '0.9rem', fontWeight: 600 }}>
              <span>{scoreConfig.icon}</span>
              <span>{scoreConfig.label}</span>
            </div>
          </div>

          {/* Message */}
          <div style={{ background: scoreConfig.bgLight, borderRadius: '16px', padding: '20px', marginBottom: '24px', borderLeft: `4px solid ${scoreConfig.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.3rem' }}>📊</span>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: scoreConfig.text, margin: 0 }}>{report.score_message || 'Évaluation de la performance'}</h3>
            </div>
          </div>

          {/* Points forts */}
          {report.points_forts && report.points_forts.length > 0 && (
            <div style={{ background: '#f0fdf4', borderRadius: '16px', padding: '20px', marginBottom: '20px', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '1.3rem' }}>✅</span>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#166534', margin: 0 }}>Points forts</h3>
              </div>
              <div style={{ display: 'grid', gap: '16px' }}>
                {report.points_forts.map((point: any, i: number) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, color: '#15803D' }}>{point.label || point.nom || `Compétence ${i + 1}`}</span>
                      <span style={{ color: '#16A34A', fontWeight: 700 }}>{point.score}/100</span>
                    </div>
                    <div style={{ height: '6px', background: '#dcfce7', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                      <div style={{ width: `${point.score}%`, height: '100%', background: '#16A34A', borderRadius: '3px' }} />
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#166534', margin: 0 }}>{point.description || point.feedback || ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Axes d'amélioration */}
          {report.axes_amelioration && report.axes_amelioration.length > 0 && (
            <div style={{ background: '#fffbeb', borderRadius: '16px', padding: '20px', marginBottom: '20px', border: '1px solid #fde68a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '1.3rem' }}>⚠️</span>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#92400E', margin: 0 }}>Axes d'amélioration</h3>
              </div>
              <div style={{ display: 'grid', gap: '16px' }}>
                {report.axes_amelioration.map((axe: any, i: number) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, color: '#92400E' }}>{axe.label || axe.nom || `Compétence ${i + 1}`}</span>
                      <span style={{ color: '#F2A516', fontWeight: 700 }}>{axe.score}/100</span>
                    </div>
                    <div style={{ height: '6px', background: '#fef3c7', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                      <div style={{ width: `${axe.score}%`, height: '100%', background: '#F2A516', borderRadius: '3px' }} />
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#78350F', margin: 0 }}>{axe.description || axe.feedback || ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommandations */}
          {report.recommandations && report.recommandations.length > 0 && (
            <div style={{ background: '#eff6ff', borderRadius: '16px', padding: '20px', marginBottom: '20px', border: '1px solid #bfdbfe' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '1.3rem' }}>💡</span>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#1e40af', margin: 0 }}>Recommandations</h3>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                {report.recommandations.map((rec: any, i: number) => (
                  <div key={i} style={{ padding: '12px', background: 'white', borderRadius: '12px', border: '1px solid #dbeafe' }}>
                    <div style={{ fontWeight: 700, marginBottom: '6px', color: '#0A6EBD' }}>{rec.module || rec.titre || rec.title || 'Recommandation'}</div>
                    <p style={{ fontSize: '0.85rem', color: '#4b5563', margin: 0 }}>{rec.description || ''}</p>
                    {rec.priority && <div style={{ fontSize: '0.7rem', marginTop: '6px', color: '#F2A516' }}>Priorité: {rec.priority}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Copy button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button
              onClick={() => {
                const reportText = `RAPPORT D'ÉVALUATION\n\nSession: ${sessionId}\nScore: ${report.score_global}/100\n\n${report.score_message}\n\nPoints forts: ${report.points_forts?.map((p: any) => `\n- ${p.label || p.nom}: ${p.score}/100 - ${p.description || ''}`).join('')}\n\nAxes d'amélioration: ${report.axes_amelioration?.map((a: any) => `\n- ${a.label || a.nom}: ${a.score}/100 - ${a.description || ''}`).join('')}\n\nRecommandations: ${report.recommandations?.map((r: any) => `\n- ${r.module || r.titre}: ${r.description || ''}`).join('')}`
                navigator.clipboard.writeText(reportText)
                alert('✓ Rapport copié dans le presse-papier')
              }}
              style={{
                padding: '10px 20px',
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                color: '#4b5563',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#f9fafb'
                e.currentTarget.style.borderColor = '#9ca3af'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'white'
                e.currentTarget.style.borderColor = '#d1d5db'
              }}
            >
              📋 Copier le rapport
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [filteredSessions, setFilteredSessions] = useState<SessionSummary[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [stats, setStats] = useState({
    total: 0,
    avgScore: 0,
    completed: 0,
  })

  useEffect(() => {
    fetchSessions()
  }, [])

  useEffect(() => {
    let filtered = [...sessions]
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(s => 
        s.delegate_id.toLowerCase().includes(term) ||
        s.session_id.toLowerCase().includes(term)
      )
    }
    
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(s => s.difficulty === selectedDifficulty)
    }
    
    setFilteredSessions(filtered)
  }, [sessions, searchTerm, selectedDifficulty])

  useEffect(() => {
    if (sessions.length === 0) return
    
    const completed = sessions.filter(s => s.status === 'completed')
    const totalScore = completed.reduce((sum, s) => sum + s.overall_score, 0)
    const avgScore = completed.length > 0 ? Math.round(totalScore / completed.length) : 0
    
    setStats({
      total: sessions.length,
      avgScore,
      completed: completed.length,
    })
  }, [sessions])

  const fetchSessions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/sessions`)
      if (!response.ok) throw new Error('Failed to fetch sessions')
      const data = await response.json()
      setSessions(data)
      setFilteredSessions(data)
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const openReport = (sessionId: string) => {
    setSelectedSessionId(sessionId)
  }

  const closeReport = () => {
    setSelectedSessionId(null)
  }

  const getScoreColor = (score: number): string => {
    if (score >= 70) return '#10b981'
    if (score >= 50) return '#f59e0b'
    return '#ef4444'
  }

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDelegateName = (delegateId: string): string => {
    return delegateId.slice(0, 8) + '...'
  }

  return (
    <DashboardLayout role="administrateur">
      <div style={{ 
        minHeight: '100vh',
        background: '#f5f7fa',
        padding: '40px 24px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          {/* Modal du rapport */}
          {selectedSessionId && (
            <ReportModal sessionId={selectedSessionId} onClose={closeReport} />
          )}

          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '2rem', 
              fontWeight: 700, 
              marginBottom: '8px',
              color: '#1f2937',
            }}>
              Tableau de bord des formations
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
              Suivez les progrès de vos délégués et consultez les rapports détaillés
            </p>
          </div>

          {/* Statistics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
            <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sessions totales</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0A6EBD' }}>{stats.total}</div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '8px' }}>{stats.completed} terminées</div>
            </div>
            <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Score moyen</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: getScoreColor(stats.avgScore) }}>{stats.avgScore}%</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '8px' }}>Toutes sessions confondues</div>
            </div>
            <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Taux de complétion</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#10b981' }}>
                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '8px' }}>{stats.completed}/{stats.total} sessions</div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ 
            background: 'white', 
            borderRadius: '20px', 
            padding: '20px', 
            marginBottom: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}>
            <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                {Icons.search}
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par délégué ou session..."
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = '#0A6EBD'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(10,110,189,0.1)'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = '#e5e7eb'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>
            
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              style={{
                padding: '12px 20px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '0.9rem',
                background: 'white',
                minWidth: '160px',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="all">Tous les niveaux</option>
              <option value="beginner">Débutant</option>
              <option value="intermediate">Intermédiaire</option>
              <option value="professional">Avancé</option>
            </select>
            
            <button
              onClick={fetchSessions}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #0A6EBD 0%, #0D1B2A 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Rafraîchir
            </button>
          </div>

          {/* Sessions Table */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Délégué</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Persona</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Niveau</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                    <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Score</th>
                    <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '60px', textAlign: 'center' }}>
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          border: '3px solid #e5e7eb', 
                          borderTopColor: '#0A6EBD',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                          margin: '0 auto 12px',
                        }} />
                        <p style={{ color: '#9ca3af' }}>Chargement des sessions...</p>
                      </td>
                    </tr>
                  ) : filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                        Aucune session trouvée
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((session) => (
                      <tr key={session.session_id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                        <td style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 500 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {Icons.user}
                            {getDelegateName(session.delegate_id)}
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '0.85rem' }}>
                          {personasMap[session.persona] || session.persona}
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '0.85rem' }}>
                          <span style={{
                            background: session.difficulty === 'beginner' ? '#dcfce7' : session.difficulty === 'intermediate' ? '#dbeafe' : '#fed7aa',
                            color: session.difficulty === 'beginner' ? '#166534' : session.difficulty === 'intermediate' ? '#1e40af' : '#9a3412',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                          }}>
                            {difficultyMap[session.difficulty] || session.difficulty}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '0.8rem', color: '#6b7280' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {Icons.calendar}
                            {formatDate(session.created_at)}
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <span style={{
                            background: getScoreColor(session.overall_score),
                            color: 'white',
                            fontWeight: 700,
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                          }}>
                            {session.overall_score}%
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <button
                            onClick={() => openReport(session.session_id)}
                            style={{
                              padding: '8px 20px',
                              background: 'white',
                              border: '1px solid #0A6EBD',
                              borderRadius: '10px',
                              color: '#0A6EBD',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = '#0A6EBD'
                              e.currentTarget.style.color = 'white'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'white'
                              e.currentTarget.style.color = '#0A6EBD'
                            }}
                          >
                            Voir le rapport
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </DashboardLayout>
  )
}