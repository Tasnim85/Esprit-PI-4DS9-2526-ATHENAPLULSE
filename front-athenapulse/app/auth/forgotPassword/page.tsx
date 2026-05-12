'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setSent(true)
  }

  return (
    <div style={{ maxWidth: '380px', width: '100%', margin: '0 auto' }}>
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
        <div style={{ width: 36, height: 36, background: 'var(--color-brand-light)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📈</div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem' }}>
          Athena<span style={{ color: 'var(--color-brand-secondary)' }}>Pulse</span>
        </span>
      </Link>

      {!sent ? (
        <>
          <div style={{
            width: '56px', height: '56px',
            background: 'rgba(10,110,189,0.08)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem',
            marginBottom: '24px',
          }}>
            🔐
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', fontWeight: 700, marginBottom: '10px' }}>
            Mot de passe oublié ?
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '32px' }}>
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px',
              background: loading ? 'var(--color-surface-3)' : 'var(--gradient-brand)',
              color: loading ? 'var(--color-text-muted)' : 'white',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-display)', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : 'var(--shadow-brand)',
            }}>
              {loading ? 'Envoi...' : 'Envoyer le lien →'}
            </button>
          </form>
        </>
      ) : (
        <div style={{ textAlign: 'center', animation: 'scaleIn 0.4s ease' }}>
          <div style={{
            width: '72px', height: '72px',
            background: 'rgba(22,163,74,0.10)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
            margin: '0 auto 24px',
          }}>
            ✉️
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>
            Email envoyé !
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.8, marginBottom: '32px' }}>
            Un lien de réinitialisation a été envoyé à <strong style={{ color: 'var(--color-text-primary)' }}>{email}</strong>.
            Vérifiez votre boîte de réception.
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
            Vous n'avez pas reçu l'email ?{' '}
            <button
              onClick={() => setSent(false)}
              style={{ background: 'none', border: 'none', color: 'var(--color-brand-primary)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600 }}
            >
              Réessayer
            </button>
          </p>
        </div>
      )}

      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <Link href="/auth/login" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          ← Retour à la connexion
        </Link>
      </div>
    </div>
  )
}