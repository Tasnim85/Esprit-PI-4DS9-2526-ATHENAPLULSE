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
  delegate_id: string
  created_at: string
  engagement_score: number
  status: 'engaged' | 'neutral' | 'disengaged'
}

const API_BASE_URL = process.env.NEXT_PUBLIC_DSO4_BACKEND_URL || 'http://localhost:8000'

export default function EngagementReportsList() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterHCP, setFilterHCP] = useState('')
  const [hcps, setHcps] = useState<string[]>([])

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
      delegate_id: item.hcp_name || item.hcp_id,
      created_at: item.date,
      engagement_score: item.score_global,
      status: getStatusFromScore(item.score_global)
    }))
  }

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
      
      const uniqueHcps = [...new Set(transformedSessions.map(s => s.delegate_id))]
      setHcps(uniqueHcps)
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

  const handleFilterChange = (hcpName: string) => {
    setFilterHCP(hcpName)
    if (hcpName) {
      // Filter locally since we have the data
      const filtered = sessions.filter(s => s.delegate_id === hcpName)
      setSessions(filtered)
    } else {
      fetchSessions()
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'engaged': return 'Engagé'
      case 'neutral': return 'Neutre'
      case 'disengaged': return 'Désengagé'
      default: return status
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#10b981'
    if (score >= 30) return '#f59e0b'
    return '#ef4444'
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
          Rapports d'engagement
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Consultez l'historique des conversations et les scores d'engagement
        </p>
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
        alignItems: 'flex-end',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
            Filtrer par HCP
          </label>
          <select
            value={filterHCP}
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
            {hcps.map(hcp => (
              <option key={hcp} value={hcp}>{hcp}</option>
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
          }}
        >
          Actualiser
        </button>
      </div>

      {/* Sessions Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
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
        <div style={{
          textAlign: 'center',
          padding: '60px',
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
        }}>
          <p style={{ color: 'var(--color-text-muted)' }}>Aucune session trouvée</p>
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--color-surface-1)', borderBottom: '1px solid var(--color-border)' }}>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600 }}>Session ID</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600 }}>HCP</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600 }}>Score</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600 }}>Statut</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.session_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '16px', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                    {session.session_id.slice(0, 12)}...
                  </td>
                  <td style={{ padding: '16px', fontSize: '0.9rem', fontWeight: 500 }}>
                    {session.delegate_id}
                  </td>
                  <td style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    {formatDate(session.created_at)}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: session.engagement_score >= 70 ? 'rgba(16,185,129,0.1)' : 
                                 session.engagement_score >= 30 ? 'rgba(245,158,11,0.1)' : 
                                 'rgba(239,68,68,0.1)',
                      color: getScoreColor(session.engagement_score),
                      fontWeight: 600,
                      fontSize: '0.85rem',
                    }}>
                      {session.engagement_score}/100
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: session.status === 'engaged' ? '#10b981' :
                                 session.status === 'neutral' ? '#f59e0b' :
                                 '#ef4444',
                      marginRight: '8px',
                    }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {getStatusLabel(session.status)}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <Link href={`/dashboard/admin/engagement/${session.session_id}`}>
                      <button style={{
                        padding: '8px 20px',
                        background: 'linear-gradient(135deg, #0D1B2A 0%, #0A3D62 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.opacity = '0.9'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.opacity = '1'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}>
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

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}