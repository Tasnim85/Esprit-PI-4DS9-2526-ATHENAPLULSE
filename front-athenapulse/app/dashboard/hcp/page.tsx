import DashboardLayout from '@/app/components/layout/DashboardLayout'

const recentInteractions = [
  { delegate: 'Karim Benali', produit: 'Cardio-X', date: 'Aujourd\'hui 10:30', statut: 'Consultée' },
  { delegate: 'Sara Ouali', produit: 'Neuro-B', date: 'Hier 14:15', statut: 'En attente' },
  { delegate: 'Omar Faris', produit: 'Fibromed', date: '22/05', statut: 'Archivée' },
]

export default function HcpDashboard() {
  return (
    <DashboardLayout role="hcp">
      <div>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, marginBottom: '6px' }}>
            Bonjour, Dr. Sarah 👋
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Votre espace professionnel de santé
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Interactions reçues', value: '47', icon: '🤝', color: '#0A6EBD' },
            { label: 'Produits consultés', value: '23', icon: '💊', color: '#05B8CC' },
            { label: 'Sessions avatar', value: '12', icon: '🤖', color: '#F2A516' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div style={{
                width: 44, height: 44, borderRadius: '12px',
                background: `${s.color}12`, border: `1px solid ${s.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', marginBottom: '16px',
              }}>
                {s.icon}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: s.color, marginBottom: '4px' }}>
                {s.value}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Interactions table */}
        <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem' }}>Interactions récentes</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Délégué</th>
                <th>Produit présenté</th>
                <th>Date</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {recentInteractions.map((row, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'var(--font-display)', fontWeight: 500, color: 'var(--color-text-primary)' }}>{row.delegate}</td>
                  <td>{row.produit}</td>
                  <td>{row.date}</td>
                  <td>
                    <span className={`badge ${row.statut === 'Consultée' ? 'badge-success' : row.statut === 'En attente' ? 'badge-warning' : 'badge-primary'}`}>
                      {row.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick actions */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <a href="/dashboard/hcp/recommandations" style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            padding: '12px 20px',
            background: 'var(--gradient-brand)',
            color: 'white',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-display)',
            fontWeight: 600, fontSize: '0.875rem',
            boxShadow: 'var(--shadow-brand)',
            textDecoration: 'none',
          }}>
            🤖 Consulter l'Avatar Doctor
          </a>
          <a href="/dashboard/hcp/profil" style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            padding: '12px 20px',
            background: 'white',
            border: '1.5px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-display)',
            fontWeight: 500, fontSize: '0.875rem',
            textDecoration: 'none',
          }}>
            👤 Mon profil
          </a>
        </div>
      </div>
    </DashboardLayout>
  )
}