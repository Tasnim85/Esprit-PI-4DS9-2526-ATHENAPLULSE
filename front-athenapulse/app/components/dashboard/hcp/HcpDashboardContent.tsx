'use client'

export default function HcpDashboardContent() {
  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, marginBottom: '6px' }}>
          Bonjour, Dr. Sarah 👋
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Bienvenue sur votre espace professionnel de santé
        </p>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Consultations IA', value: '45', change: '+8%', icon: '🩺', color: '#0A6EBD' },
          { label: 'Recommandations', value: '23', change: '+12%', icon: '💡', color: '#05B8CC' },
          { label: 'Fiches produits', value: '156', change: '+4%', icon: '💊', color: '#F2A516' },
          { label: 'Interactions', value: '67', change: '+6%', icon: '📞', color: '#16A34A' },
        ].map((stat, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{
                width: 44, height: 44,
                borderRadius: '12px',
                background: `${stat.color}12`,
                border: `1px solid ${stat.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem',
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

      {/* Quick actions */}
      <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        {[
          { label: 'Consulter l\'IA', icon: '🩺', href: '/dashboard/recommandations', color: '#0A6EBD' },
          { label: 'Catalogue produits', icon: '💊', href: '/dashboard/hcp/produits', color: '#05B8CC' },
          { label: 'Mon historique', icon: '📜', href: '/dashboard/hcp/historique', color: '#F2A516' },
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
            <span style={{ fontSize: '1.3rem' }}>{action.icon}</span>
            {action.label}
          </a>
        ))}
      </div>
    </div>
  )
}