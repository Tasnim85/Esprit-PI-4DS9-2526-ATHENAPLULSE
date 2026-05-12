'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// Interface matching the actual API response
interface ApiSession {
  session_id: string
  hcp_id: string
  hcp_name: string
  hcp_specialty: string
  date: string
  score_global: number
}

// Interface for the transformed session used in the UI
interface Session {
  session_id: string
  delegate_id: string  // Will use hcp_name as delegate_id
  created_at: string   // Will use date
  engagement_score: number  // Will use score_global
  status: 'engaged' | 'neutral' | 'disengaged'
}

interface DashboardStats {
  totalSessions: number
  averageEngagementScore: number
  highRiskSessions: number
  activeDelegates: number
}

const API_BASE_URL = process.env.NEXT_PUBLIC_DSO4_BACKEND_URL || 'http://localhost:8000'

export default function AdminDashboardContent() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    averageEngagementScore: 0,
    highRiskSessions: 0,
    activeDelegates: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterDelegate, setFilterDelegate] = useState('')
  const [delegates, setDelegates] = useState<string[]>([])

  // Helper function to get status from score
  const getStatusFromScore = (score: number): 'engaged' | 'neutral' | 'disengaged' => {
    if (score >= 70) return 'engaged'
    if (score >= 30) return 'neutral'
    return 'disengaged'
  }

  // Transform API data to UI format
  const transformSessions = (apiData: ApiSession[]): Session[] => {
    return apiData.map(item => ({
      session_id: item.session_id,
      delegate_id: item.hcp_name || item.hcp_id,  // Use hcp_name as delegate name
      created_at: item.date,
      engagement_score: item.score_global,
      status: getStatusFromScore(item.score_global)
    }))
  }

  // Fetch all sessions from API
  const fetchSessions = async (hcpId?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // Use hcp_id parameter as shown in your API
      const url = hcpId
        ? `${API_BASE_URL}/sessions?hcp_id=${hcpId}`
        : `${API_BASE_URL}/sessions`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.status}`)
      }
      
      const data: ApiSession[] = await response.json()
      
      // Transform the data to match UI expectations
      const transformedSessions = transformSessions(data)
      setSessions(transformedSessions)
      
      // Calculate statistics
      const total = transformedSessions.length
      const avgScore = total > 0 
        ? transformedSessions.reduce((acc, s) => acc + (s.engagement_score || 0), 0) / total 
        : 0
      const highRisk = transformedSessions.filter(s => s.engagement_score < 30).length
      const uniqueDelegates = [...new Set(transformedSessions.map(s => s.delegate_id).filter(Boolean))]
      
      setStats({
        totalSessions: total,
        averageEngagementScore: Math.round(avgScore),
        highRiskSessions: highRisk,
        activeDelegates: uniqueDelegates.length,
      })
      
      setDelegates(uniqueDelegates)
    } catch (err) {
      console.error('Error fetching sessions:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  const handleFilterChange = (delegateId: string) => {
    setFilterDelegate(delegateId)
    // When filtering, we need to find the hcp_id from the delegate name
    // For now, let's filter locally since the API uses hcp_id
    if (delegateId) {
      const filteredSessions = sessions.filter(s => s.delegate_id === delegateId)
      setSessions(filteredSessions)
    } else {
      fetchSessions()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'engaged':
        return 'var(--color-success)'
      case 'neutral':
        return 'var(--color-warning)'
      case 'disengaged':
        return 'var(--color-error)'
      default:
        return 'var(--color-text-muted)'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'engaged':
        return 'Engagé'
      case 'neutral':
        return 'Neutre'
      case 'disengaged':
        return 'Désengagé'
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Date inconnue'
      }
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'Date inconnue'
    }
  }

  if (error) {
    return (
      <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          padding: '60px',
          textAlign: 'center',
          border: '1px solid var(--color-border)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ color: '#dc2626', marginBottom: '12px', fontFamily: 'var(--font-display)' }}>
            Erreur de chargement
          </h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
            {error}
          </p>
          <button
            onClick={() => fetchSessions()}
            style={{
              padding: '10px 24px',
              background: 'var(--gradient-brand)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
            }}
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          fontWeight: 700,
          background: 'var(--gradient-brand)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          marginBottom: '8px',
        }}>
          Administration Dashboard
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Analyse des conversations et rapports d'engagement HCP
        </p>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
            Sessions totales
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-brand-primary)' }}>
            {stats.totalSessions}
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
            Score d'engagement moyen
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-brand-secondary)' }}>
            {stats.averageEngagementScore}/100
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
            Sessions à risque élevé
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-error)' }}>
            {stats.highRiskSessions}
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
            Délégués actifs
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-brand-primary)' }}>
            {stats.activeDelegates}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        border: '1px solid var(--color-border)',
        marginBottom: '24px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
            Filtrer par HCP
          </label>
          <select
            value={filterDelegate}
            onChange={(e) => handleFilterChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.9rem',
              background: 'white',
            }}
          >
            <option value="">Tous les HCP</option>
            {delegates.map(delegate => (
              <option key={delegate} value={delegate}>{delegate}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => fetchSessions()}
          style={{
            padding: '8px 20px',
            background: 'var(--gradient-brand)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: '22px',
          }}
        >
          Actualiser
        </button>
      </div>

      {/* Sessions Table */}
      <div style={{
        background: 'white',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface-1)',
        }}>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '1.1rem',
          }}>
            Historique des sessions
          </h3>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '3px solid var(--color-border)', 
              borderTopColor: 'var(--color-brand-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }} />
            <p style={{ color: 'var(--color-text-muted)' }}>Chargement des sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>Aucune session trouvée</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--color-surface-1)', borderBottom: '1px solid var(--color-border)' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600 }}>ID Session</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600 }}>HCP</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600 }}>Score</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600 }}>Statut</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.session_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 16px', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                      {session.session_id.slice(0, 8)}...
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>
                      {session.delegate_id}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {formatDate(session.created_at)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: session.engagement_score >= 70 ? 'rgba(0,200,0,0.1)' : 
                                   session.engagement_score >= 30 ? 'rgba(255,165,0,0.1)' : 
                                   'rgba(255,0,0,0.1)',
                        color: session.engagement_score >= 70 ? 'var(--color-success)' : 
                               session.engagement_score >= 30 ? 'var(--color-warning)' : 
                               'var(--color-error)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                      }}>
                        {session.engagement_score}/100
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: getStatusColor(session.status),
                        marginRight: '6px',
                      }} />
                      <span style={{ fontSize: '0.85rem' }}>
                        {getStatusLabel(session.status)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Link href={`/dashboard/admin/engagement/${session.session_id}`}>
                        <button style={{
                          padding: '6px 12px',
                          background: 'var(--color-brand-primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                          Voir rapport
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}