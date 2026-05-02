'use client'

// Icônes SVG
const Icons = {
  recommandation: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3"></path>
      <path d="M12 2v8"></path>
      <path d="m8 6 4-4 4 4"></path>
    </svg>
  ),
  presentation: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>
  ),
  simulation: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="6"></circle>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>
  ),
  star: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  ),
  badge: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z"></path>
    </svg>
  ),
  chevronRight: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  ),
}

const stats = [
  { label: 'Recommandations', value: '124', change: '+12%', icon: Icons.recommandation, color: '#0A6EBD' },
  { label: 'Présentations', value: '38', change: '+5%', icon: Icons.presentation, color: '#05B8CC' },
  { label: 'Sessions IA', value: '67', change: '+18%', icon: Icons.simulation, color: '#F2A516' },
  { label: 'Score moyen', value: '87%', change: '+4%', icon: Icons.star, color: '#16A34A' },
]

const activities = [
  { action: 'Recommandation produit générée', detail: 'Produit Cardio-X pour Dr. Amira', time: '09:34', icon: Icons.recommandation, type: 'recommandation' },
  { action: 'Simulation IA complétée', detail: 'Score : 91% — Excellent', time: '08:15', icon: Icons.simulation, type: 'simulation' },
  { action: 'Présentation créée', detail: 'Fibromed — 18 slides', time: 'Hier', icon: Icons.presentation, type: 'presentation' },
  { action: 'Nouveau badge obtenu', detail: 'Communicateur Expert', time: 'Hier', icon: Icons.badge, type: 'badge' },
  { action: 'Recommandation produit', detail: 'Produit Neuro-B pour Pharmacie Centrale', time: 'Il y a 2j', icon: Icons.recommandation, type: 'recommandation' },
]

const performanceData = [
  { month: 'Jan', score: 72 },
  { month: 'Fév', score: 78 },
  { month: 'Mar', score: 75 },
  { month: 'Avr', score: 82 },
  { month: 'Mai', score: 85 },
  { month: 'Jun', score: 87 },
]

const topProducts = [
  { name: 'Cardio-X', mentions: 34, pct: 85 },
  { name: 'Neuro-B', mentions: 28, pct: 70 },
  { name: 'Fibromed', mentions: 22, pct: 55 },
  { name: 'OmegaCare', mentions: 18, pct: 45 },
]

export default function DelegueDashboardContent() {
  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, marginBottom: '6px' }}>
          Bonjour, Karim
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Voici un résumé de vos activités du jour — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{
                width: 44, height: 44,
                borderRadius: '12px',
                background: `${stat.color}12`,
                border: `1px solid ${stat.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: stat.color,
              }}>
                {stat.icon}
              </div>
              <span style={{
                fontSize: '0.75rem',
                color: 'var(--color-success)',
                background: 'rgba(22,163,74,0.08)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
              }}>
                {stat.change}
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: stat.color, marginBottom: '4px' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>

        {/* Performance chart */}
        <div style={{
          background: 'white',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>
                Performance mensuelle
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Score moyen par mois (%)</p>
            </div>
            <span style={{
              padding: '4px 12px',
              background: 'rgba(10,110,189,0.08)',
              color: 'var(--color-brand-primary)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
            }}>
              2025
            </span>
          </div>

          {/* Bar chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '140px' }}>
            {performanceData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%' }}>
                <div style={{
                  flex: 1,
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                }}>
                  <div style={{
                    width: '100%',
                    height: `${(d.score / 100) * 100}%`,
                    background: i === performanceData.length - 1 ? 'var(--gradient-brand)' : 'var(--color-surface-3)',
                    borderRadius: '6px 6px 0 0',
                    transition: 'height 0.6s ease',
                    position: 'relative',
                  }}>
                    {i === performanceData.length - 1 && (
                      <div style={{
                        position: 'absolute',
                        top: '-28px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--color-brand-primary)',
                        color: 'white',
                        fontSize: '0.7rem',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap',
                      }}>
                        {d.score}%
                      </div>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-display)' }}>
                  {d.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div style={{
          background: 'white',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>
            Produits phares
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '20px' }}>Recommandations ce mois</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {topProducts.map((p, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '22px', height: '22px',
                      borderRadius: '50%',
                      background: i === 0 ? '#F2A516' : i === 1 ? 'var(--color-surface-3)' : 'var(--color-surface-2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      color: i === 0 ? 'white' : 'var(--color-text-muted)',
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 500 }}>{p.name}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{p.mentions} fois</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div style={{
        background: 'white',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600 }}>
            Activités récentes
          </h3>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-brand-primary)', cursor: 'pointer', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Voir tout {Icons.chevronRight}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {activities.map((act, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              padding: '14px 0',
              borderBottom: i < activities.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}>
              <div style={{
                width: 38, height: 38,
                borderRadius: '10px',
                background: 'var(--color-surface-1)',
                border: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-brand-primary)',
                flexShrink: 0,
              }}>
                {act.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '3px' }}>
                  {act.action}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{act.detail}</div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {act.time}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        {[
          { label: 'Nouvelle recommandation', icon: Icons.recommandation, href: '/dashboard/delegue/recommandations', color: '#0A6EBD' },
          { label: 'Créer une présentation', icon: Icons.presentation, href: '/dashboard/delegue/presentations', color: '#05B8CC' },
          { label: 'Lancer une simulation', icon: Icons.simulation, href: '/dashboard/delegue/entrainement/simulation', color: '#F2A516' },
        ].map((action, i) => (
          <a key={i} href={action.href} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 18px',
            background: `${action.color}08`,
            border: `1.5px solid ${action.color}20`,
            borderRadius: 'var(--radius-md)',
            color: action.color,
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '0.875rem',
            transition: 'all 0.2s',
            cursor: 'pointer',
            textDecoration: 'none',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${action.color}15`
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = `0 6px 20px ${action.color}20`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = `${action.color}08`
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <span style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{action.icon}</span>
            {action.label}
          </a>
        ))}
      </div>
    </div>
  )
}