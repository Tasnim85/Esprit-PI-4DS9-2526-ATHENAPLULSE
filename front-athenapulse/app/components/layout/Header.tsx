'use client'

import Link from 'next/link'
import { useState } from 'react'

interface HeaderProps {
  sidebarCollapsed: boolean
  user?: {
    nom: string
    prenom: string
    role: string
    avatar?: string
  }
}

// Icônes SVG
const Icons = {
  bell: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  ),
  chevronDown: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  ),
  user: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  ),
  help: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  ),
}

export default function Header({ sidebarCollapsed, user }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const initials = user ? `${user.prenom[0]}${user.nom[0]}` : 'AP'

  const notifications = [
    { id: 1, title: 'Nouvelle recommandation', desc: 'Dr. Martin a consulté vos produits', time: 'Il y a 5 min', unread: true },
    { id: 2, title: 'Session terminée', desc: 'Simulation IA complétée avec 92%', time: 'Il y a 30 min', unread: true },
    { id: 3, title: 'Présentation générée', desc: 'Produit X — prête à télécharger', time: 'Il y a 1h', unread: false },
  ]

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
      right: 0,
      height: 'var(--header-height)',
      background: 'rgba(255,255,255,0.90)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '0 24px',
      zIndex: 90,
      transition: 'left var(--transition-slow)',
    }}>
      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false) }}
            style={{
              width: 38, height: 38,
              borderRadius: 'var(--radius-md)',
              background: showNotifications ? 'var(--color-surface-2)' : 'transparent',
              border: '1.5px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
              color: 'var(--color-text-secondary)',
            }}
            onMouseEnter={e => !showNotifications && (e.currentTarget.style.background = 'var(--color-surface-1)')}
            onMouseLeave={e => !showNotifications && (e.currentTarget.style.background = 'transparent')}
          >
            {Icons.bell}
            <span style={{
              position: 'absolute',
              top: '4px', right: '4px',
              width: '8px', height: '8px',
              borderRadius: '50%',
              background: 'var(--color-error)',
              border: '1.5px solid white',
            }} />
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '320px',
              background: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)',
              zIndex: 200,
              overflow: 'hidden',
              animation: 'scaleIn 0.2s ease',
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem' }}>Notifications</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-brand-primary)', cursor: 'pointer', fontFamily: 'var(--font-display)' }}>Tout lire</span>
              </div>
              {notifications.map(n => (
                <div key={n.id} style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--color-border)',
                  background: n.unread ? 'rgba(10,110,189,0.03)' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = n.unread ? 'rgba(10,110,189,0.03)' : 'white')}
                >
                  {n.unread && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-brand-primary)', marginTop: '5px', flexShrink: 0 }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '3px' }}>{n.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>{n.desc}</div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--color-text-muted)' }}>{n.time}</div>
                  </div>
                </div>
              ))}
              <div style={{ padding: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--color-brand-primary)', fontFamily: 'var(--font-display)', cursor: 'pointer' }}>
                  Voir toutes les notifications
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '5px 10px 5px 5px',
              borderRadius: 'var(--radius-md)',
              background: showProfile ? 'var(--color-surface-2)' : 'transparent',
              border: '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => !showProfile && (e.currentTarget.style.background = 'var(--color-surface-1)')}
            onMouseLeave={e => !showProfile && (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: 'var(--gradient-brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
            }}>
              {initials}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
                {user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                {user?.role || 'Rôle'}
              </div>
            </div>
            <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
              {Icons.chevronDown}
            </span>
          </button>

          {showProfile && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '220px',
              background: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)',
              zIndex: 200,
              overflow: 'hidden',
              animation: 'scaleIn 0.2s ease',
            }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem' }}>
                  {user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  {user?.role}
                </div>
              </div>
              {[
                { icon: Icons.user, label: 'Mon profil', href: '/profile' },
                { icon: Icons.settings, label: 'Paramètres', href: '/settings' },
                { icon: Icons.help, label: 'Aide & FAQ', href: '/faq' },
              ].map(item => (
                <Link key={item.label} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '11px 16px',
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-display)',
                  transition: 'background 0.15s',
                  borderBottom: '1px solid var(--color-border)',
                  textDecoration: 'none',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => setShowProfile(false)}
                >
                  <span style={{ width: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              <Link href="/auth/login" style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 16px',
                color: 'var(--color-error)',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-display)',
                textDecoration: 'none',
              }}>
                <span style={{ width: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icons.logout}</span>
                Déconnexion
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}