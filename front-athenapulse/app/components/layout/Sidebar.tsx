'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

type Role = 'delegue' | 'hcp' | 'administrateur'

interface SidebarProps {
  role: Role
  collapsed: boolean
  onToggle: () => void
}

// Icônes SVG pour la navigation
const NavIcons = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"></path>
      <path d="M4 16 9 9l4 4 7-8"></path>
    </svg>
  ),
  alia: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  recommandations: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3"></path>
      <path d="M12 2v8"></path>
      <path d="m8 6 4-4 4 4"></path>
    </svg>
  ),
  presentations: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  ),
  simulations: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="6"></circle>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>
  ),
  profil: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  avatarDoctor: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11v-3a5 5 0 0 1 10 0v3"></path>
      <circle cx="9" cy="15" r="1.5"></circle>
      <circle cx="15" cy="15" r="1.5"></circle>
    </svg>
  ),
  utilisateurs: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  chart: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3"></path>
      <path d="M12 2v8"></path>
      <path d="m8 6 4-4 4 4"></path>
      <line x1="4" y1="20" x2="20" y2="20"></line>
    </svg>
  ),
  parametres: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  ),
  chevronLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  ),
  chevronRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  ),
}

// Builds the ALIA redirect URL, appending the JWT so the avatar app can
// identify the user without requiring a separate login.
function buildAliaUrl(base: string, token: string | null): string {
  if (!token) return base
  const separator = base.includes('?') ? '&' : '?'
  return `${base}${separator}token=${encodeURIComponent(token)}`
}

export default function Sidebar({ role, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { token } = useAuth()

  // Navigation items — ALIA hrefs are plain strings; we inject the token below
  // for external links only (http://localhost:3000/…).
  const navigationItems = {
    delegue: [
      { href: '/dashboard/delegue', label: 'Tableau de bord', icon: NavIcons.dashboard, external: false },
      { href: 'http://localhost:3000/delegue', label: 'ALIA', icon: NavIcons.alia, external: true },
      { href: '/dashboard/delegue/recommandations', label: 'Athena Recherche', icon: NavIcons.recommandations, external: false },
      { href: '/dashboard/delegue/presentations', label: 'Athena Présentations', icon: NavIcons.presentations, external: false },
      { href: '/dashboard/delegue/entrainement', label: 'Athena Académie', icon: NavIcons.simulations, external: false },
      { href: '/dashboard/delegue/profil', label: 'Mon profil', icon: NavIcons.profil, external: false },
    ],
    hcp: [
      { href: '/dashboard/hcp', label: 'Tableau de bord', icon: NavIcons.dashboard, external: false },
      { href: 'http://localhost:3000/hcp', label: 'ALIA', icon: NavIcons.alia, external: true },
      { href: '/dashboard/hcp/recommandations', label: 'Athena Recherche', icon: NavIcons.recommandations, external: false },
      { href: '/dashboard/hcp/profil', label: 'Mon profil', icon: NavIcons.profil, external: false },
    ],
    administrateur: [
      { href: '/dashboard/admin', label: 'Tableau de bord', icon: NavIcons.dashboard, external: false },
      { href: '/dashboard/admin/reportDeleg', label: 'Suivi delegués', icon: NavIcons.chart, external: false },
      { href: 'http://localhost:3000', label: 'ALIA', icon: NavIcons.alia, external: true },
      { href: '/dashboard/admin/profil', label: 'Mon profil', icon: NavIcons.profil, external: false },
    ],
  }

  const items = navigationItems[role] || navigationItems.delegue

  return (
    <aside style={{
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
      background: 'linear-gradient(180deg, #0D1B2A 0%, #0A3D62 100%)',
      color: 'white',
      transition: 'width var(--transition-slow)',
      zIndex: 1001,
      overflow: 'hidden',
      boxShadow: '2px 0 20px rgba(0,0,0,0.1)',
    }}>

      {/* Logo / Brand */}
      <div style={{
        height: 'var(--header-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        {!collapsed && (
          <Link
            href={role === 'delegue' ? '/dashboard/delegue' : role === 'hcp' ? '/dashboard/hcp' : '/dashboard/admin'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', width: '100%' }}
          >
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'white' }}>
              Athena<span style={{ color: '#05B8CC' }}>Pulse</span>
            </span>
          </Link>
        )}
        <button
          onClick={onToggle}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: '8px',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.7)',
            transition: 'all 0.2s',
            ...(collapsed ? {} : { position: 'absolute', right: '16px' }),
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
        >
          {collapsed ? NavIcons.chevronRight : NavIcons.chevronLeft}
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((item) => {
          // For external ALIA links, inject the JWT into the URL
          const resolvedHref = item.external ? buildAliaUrl(item.href, token) : item.href
          const isActive = pathname === item.href

          const linkStyle: React.CSSProperties = {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: isActive ? 'rgba(5,184,204,0.15)' : 'transparent',
            border: isActive ? '1px solid rgba(5,184,204,0.3)' : '1px solid transparent',
            color: isActive ? '#05B8CC' : 'rgba(255,255,255,0.7)',
            transition: 'all 0.2s',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-display)',
            fontWeight: isActive ? 600 : 500,
            justifyContent: collapsed ? 'center' : 'flex-start',
            textDecoration: 'none',
          }

          const iconStyle: React.CSSProperties = {
            width: '20px',
            height: '20px',
            minWidth: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isActive ? '#05B8CC' : 'rgba(255,255,255,0.6)',
          }

          // External links open in the same tab (window.location) so the
          // browser sends the token in the URL to the avatar app.
          if (item.external) {
            return (
              <a key={item.href} href={resolvedHref} style={linkStyle}>
                <span style={iconStyle}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </a>
            )
          }

          return (
            <Link key={item.href} href={resolvedHref} style={linkStyle}>
              <span style={iconStyle}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}