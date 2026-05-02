'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

// Icônes SVG
const Icons = {
  eye: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  eyeOff: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  ),
  chevronRight: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate API call
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    // Redirect based on role (mock: go to delegate dashboard)
    window.location.href = '/dashboard/delegue'
  }

  return (
    <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
      {/* Logo top - Centré */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
          <Image
            src="/logos/logo-athenapulse.png"
            alt="Athena Pulse"
            width={140}
            height={46}
            priority
          />
        </Link>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.75rem',
          fontWeight: 700,
          marginBottom: '8px',
          color: 'var(--color-text-primary)',
        }}>
          Bon retour
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>
          Connectez-vous à votre espace Athena Pulse
        </p>
      </div>

      {/* Google button */}
      <button style={{
        width: '100%',
        padding: '11px 20px',
        background: 'white',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        fontFamily: 'var(--font-display)',
        fontWeight: 500,
        fontSize: '0.9rem',
        color: 'var(--color-text-primary)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-sm)',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--color-brand-primary)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(10,110,189,0.10)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--color-border)'
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continuer avec Google
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-display)' }}>ou</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Email */}
        <div className="form-group">
          <label className="form-label">Adresse email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            required
            className="input"
          />
        </div>

        {/* Password */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label">Mot de passe</label>
            <Link href="/auth/forgot-password" style={{
              fontSize: '0.8rem',
              color: 'var(--color-brand-primary)',
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
            }}>
              Mot de passe oublié ?
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="input"
              style={{ paddingRight: '48px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              {showPassword ? Icons.eyeOff : Icons.eye}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: loading ? 'var(--color-surface-3)' : 'var(--gradient-brand)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: loading ? 'none' : 'var(--shadow-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: 16, height: 16,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              Connexion...
            </>
          ) : (
            <>
              Se connecter {Icons.chevronRight}
            </>
          )}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '28px', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        Pas encore de compte ?{' '}
        <Link href="/auth/register" style={{
          color: 'var(--color-brand-primary)',
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
        }}>
          S'inscrire
        </Link>
      </p>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}