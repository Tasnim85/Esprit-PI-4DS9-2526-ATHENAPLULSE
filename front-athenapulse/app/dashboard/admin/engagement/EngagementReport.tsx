'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/layout/DashboardLayout'

interface ReportData {
  session_id: string
  engagement_score: number
  status: string
  headline: string
  explanation: string
  recommendation: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_DSO4_BACKEND_URL || 'http://localhost:8000'

function EngagementReportContent() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`${API_BASE_URL}/session/${sessionId}/report`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch report: ${response.status}`)
        }
        
        const data = await response.json()
        setReport(data)
      } catch (err) {
        console.error('Error fetching report:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) {
      fetchReport()
    }
  }, [sessionId])

  const getScoreConfig = (score: number) => {
    if (score >= 70) return { color: '#10b981', bgLight: '#d1fae5', text: '#065f46', border: '#10b981', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }
    if (score >= 30) return { color: '#f59e0b', bgLight: '#fed7aa', text: '#92400e', border: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }
    return { color: '#ef4444', bgLight: '#fee2e2', text: '#991b1b', border: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }
  }

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'engaged': return { text: 'Engagé', icon: '🎯' }
      case 'neutral': return { text: 'Neutre', icon: '⚖️' }
      case 'disengaged': return { text: 'Désengagé', icon: '⚠️' }
      default: return { text: status || 'Inconnu', icon: '📊' }
    }
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            border: '4px solid rgba(255,255,255,0.3)', 
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px',
          }} />
          <p style={{ color: 'white', fontSize: '1.1rem', fontWeight: 500 }}>Chargement du rapport...</p>
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '40px 24px'
      }}>
        <div style={{ 
          maxWidth: '500px', 
          background: 'white', 
          borderRadius: '24px', 
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ color: '#dc2626', marginBottom: '12px', fontFamily: 'var(--font-display)' }}>
            Erreur de chargement
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            {error}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
              }}
            >
              Réessayer
            </button>
            <button
              onClick={() => router.push('/dashboard/admin/engagement')}
              style={{
                padding: '10px 20px',
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '12px',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
              }}
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!report) return null

  const scoreConfig = getScoreConfig(report.engagement_score)
  const statusInfo = getStatusLabel(report.status)

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '40px 24px'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            marginBottom: '24px',
            fontFamily: 'var(--font-display)',
            fontSize: '0.9rem',
            fontWeight: 500,
            color: '#4b5563',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateX(-4px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateX(0)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          ← Retour aux rapports
        </button>

        {/* Main Card */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        }}>
          {/* Header with Gradient */}
          <div style={{
            padding: '40px',
            background: scoreConfig.gradient,
            color: 'white',
            textAlign: 'center',
          }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              fontWeight: 700,
              marginBottom: '12px',
              letterSpacing: '-0.02em',
            }}>
              Rapport d'engagement
            </h1>
            <p style={{ 
              fontSize: '0.9rem', 
              opacity: 0.95,
              background: 'rgba(255,255,255,0.2)',
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: '20px',
              fontFamily: 'monospace',
            }}>
              ID: {report.session_id?.slice(0, 12) || sessionId.slice(0, 12)}...
            </p>
          </div>

          {/* Content */}
          <div style={{ padding: '40px' }}>
            {/* Score Section */}
            <div style={{
              textAlign: 'center',
              marginBottom: '40px',
            }}>
              <div style={{
                position: 'relative',
                display: 'inline-block',
                marginBottom: '20px',
              }}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke={scoreConfig.color}
                    strokeWidth="12"
                    strokeDasharray={`${(report.engagement_score / 100) * 439.82} 439.82`}
                    strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: '3rem',
                    fontWeight: 800,
                    color: scoreConfig.color,
                  }}>
                    {report.engagement_score}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: 500 }}>
                    /100
                  </div>
                </div>
              </div>
              
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 24px',
                borderRadius: '40px',
                background: scoreConfig.bgLight,
                color: scoreConfig.text,
                fontSize: '1rem',
                fontWeight: 600,
              }}>
                <span style={{ fontSize: '1.2rem' }}>{statusInfo.icon}</span>
                <span>{statusInfo.text}</span>
              </div>
            </div>

            {/* Headline Card */}
            <div style={{
              background: scoreConfig.bgLight,
              borderRadius: '16px',
              padding: '28px',
              marginBottom: '24px',
              borderLeft: `4px solid ${scoreConfig.color}`,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}>
                <span style={{ fontSize: '1.5rem' }}>📊</span>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '1.3rem',
                  color: scoreConfig.text,
                  margin: 0,
                }}>
                  {report.headline}
                </h2>
              </div>
              <p style={{ 
                color: '#374151', 
                lineHeight: 1.6, 
                margin: 0,
                fontSize: '0.95rem',
              }}>
                {report.explanation}
              </p>
            </div>

            {/* Recommendation Card */}
            <div style={{
              background: '#f3f4f6',
              borderRadius: '16px',
              padding: '28px',
              marginBottom: '32px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}>
                <span style={{ fontSize: '1.5rem' }}>💡</span>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: '#1f2937',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Recommandations
                </h3>
              </div>
              <p style={{ 
                color: '#4b5563', 
                lineHeight: 1.6, 
                margin: 0,
                fontSize: '0.95rem',
              }}>
                {report.recommendation}
              </p>
            </div>

            {/* Metadata Footer */}
            <div style={{
              paddingTop: '24px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                📅 Généré le {new Date().toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    const reportText = `RAPPORT D'ENGAGEMENT\n\nSession: ${report.session_id}\nScore: ${report.engagement_score}/100\nStatut: ${statusInfo.text}\n\n${report.headline}\n\n${report.explanation}\n\nRecommandation: ${report.recommendation}\n\nGénéré le: ${new Date().toLocaleString('fr-FR')}`
                    navigator.clipboard.writeText(reportText)
                    alert('✓ Rapport copié dans le presse-papier')
                  }}
                  style={{
                    padding: '10px 20px',
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    color: '#4b5563',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
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
                  📋 Copier
                </button>
                <button
                  onClick={() => router.push('/dashboard/admin/engagement')}
                  style={{
                    padding: '10px 24px',
                    background: scoreConfig.gradient,
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  📊 Voir tous les rapports
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginTop: '24px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🎯</div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>Niveau</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: scoreConfig.color, marginTop: '4px' }}>{statusInfo.text}</div>
          </div>
          
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📈</div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>Score</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: scoreConfig.color, marginTop: '4px' }}>{report.engagement_score}/100</div>
          </div>
          
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🆔</div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>Session</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', marginTop: '4px', fontFamily: 'monospace' }}>
              {report.session_id?.slice(0, 12) || sessionId.slice(0, 12)}...
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EngagementReportPage() {
  return (
    <DashboardLayout role="administrateur">
      <EngagementReportContent />
    </DashboardLayout>
  )
}