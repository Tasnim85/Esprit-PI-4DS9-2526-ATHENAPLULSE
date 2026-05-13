'use client'

import type { Metadata } from 'next'
import Image from 'next/image'

// Icônes SVG
const Icons = {
  robot: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11v-3a5 5 0 0 1 10 0v3"></path>
      <circle cx="9" cy="15" r="1.5"></circle>
      <circle cx="15" cy="15" r="1.5"></circle>
    </svg>
  ),
  chart: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3"></path>
      <path d="M12 2v8"></path>
      <path d="m8 6 4-4 4 4"></path>
    </svg>
  ),
  target: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="6"></circle>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>
  ),
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
    }}>
      {/* Left: Form side */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px',
        background: 'var(--color-surface-0)',
        overflowY: 'auto',
      }}>
        {children}
      </div>

      {/* Right: Visual side */}
      <div style={{
        background: 'linear-gradient(135deg, #0D1B2A 0%, #0A3D62 50%, #0A6EBD 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse at 30% 40%, rgba(5,184,204,0.18) 0%, transparent 60%),
            radial-gradient(ellipse at 70% 70%, rgba(242,165,22,0.10) 0%, transparent 60%)
          `,
          pointerEvents: 'none',
        }} />

        {/* Floating circles */}
        {[120, 200, 300, 400].map((size, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: '50%',
            border: `1px solid rgba(255,255,255,${0.04 + i * 0.01})`,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }} />
        ))}

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '360px' }}>
          {/* Logo - Image centrée */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '24px',
            animation: 'float 6s ease-in-out infinite',
          }}>
            <Image
              src="/logos/logo-athenapulse.png"
              alt="Athena Pulse"
              width={140}
              height={80}
              priority
            />
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.8rem',
            fontWeight: 700,
            color: 'white',
            marginBottom: '12px',
          }}>
            Athena<span style={{ color: '#05B8CC' }}>Pulse</span>
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.60)',
            fontSize: '0.95rem',
            lineHeight: 1.8,
            marginBottom: '40px',
          }}>
            La plateforme intelligente qui accompagne les professionnels de santé dans leur quotidien.
          </p>

          {/* Feature pills - Sans emojis */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: Icons.robot, text: 'Avatar IA interactif' },
              { icon: Icons.chart, text: 'Recommandations personnalisées' },
              { icon: Icons.target, text: 'Suivi des performances' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '12px',
                padding: '12px 16px',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
              }}>
                <span style={{
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#05B8CC',
                }}>
                  {item.icon}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem', fontFamily: 'var(--font-display)', fontWeight: 500 }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '48px',
            padding: '16px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }}>
              © 2026 Laboratoires Vital · Athena Pulse
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  )
}