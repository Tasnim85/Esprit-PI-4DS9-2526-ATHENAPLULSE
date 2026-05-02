'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

type Role = 'delegue' | 'hcp' | 'administrateur'

// Icônes SVG
const Icons = {
  briefcase: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
  ),
  stethoscope: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 9a3 3 0 0 1-3 3h-1a3 3 0 0 1-3-3V8"></path>
      <path d="M4 18v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2"></path>
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M9 3v4"></path>
      <path d="M15 3v4"></path>
    </svg>
  ),
  settings: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  ),
  check: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  chevronRight: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  ),
  chevronLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  ),
  warning: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  )
}

// Correction ici : JSX.Element → React.ReactNode
const roles: { value: Role; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'delegue', label: 'Délégué Médical', icon: Icons.briefcase, desc: 'Formation & recommandations produits' },
  { value: 'hcp', label: 'Professionnel de Santé', icon: Icons.stethoscope, desc: 'Médecins, pharmaciens & infirmiers' },
  { value: 'administrateur', label: 'Administrateur', icon: Icons.settings, desc: 'Gestion de la plateforme' },
]

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.prenom.trim()) errs.prenom = 'Le prénom est requis'
    if (!form.nom.trim()) errs.nom = 'Le nom est requis'
    if (!form.email.includes('@')) errs.email = 'Email invalide'
    if (form.password.length < 8) errs.password = 'Minimum 8 caractères'
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Les mots de passe ne correspondent pas'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 1400))
    setLoading(false)
    window.location.href = `/dashboard/${selectedRole}`
  }

  return (
    <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
      {/* Logo - Centré */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Link href="/" style={{ display: 'inline-block' }}>
          <Image
            src="/logos/logo-athenapulse.png"
            alt="Athena Pulse"
            width={140}
            height={46}
            priority
          />
        </Link>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {[1, 2].map(s => (
          <div key={s} style={{
            flex: 1, height: '4px', borderRadius: '2px',
            background: s <= step ? 'var(--gradient-brand)' : 'var(--color-surface-3)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      {step === 1 ? (
        <>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, marginBottom: '8px' }}>
            Quel est votre rôle ?
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '28px' }}>
            Sélectionnez votre profil pour personnaliser votre expérience.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
            {roles.map(role => (
              <button
                key={role.value}
                type="button"
                onClick={() => setSelectedRole(role.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${selectedRole === role.value ? 'var(--color-brand-primary)' : 'var(--color-border)'}`,
                  background: selectedRole === role.value ? 'rgba(10,110,189,0.05)' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  boxShadow: selectedRole === role.value ? '0 0 0 3px rgba(10,110,189,0.10)' : 'none',
                }}
              >
                <span style={{
                  width: '44px', height: '44px',
                  background: selectedRole === role.value ? 'rgba(10,110,189,0.10)' : 'var(--color-surface-1)',
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  color: selectedRole === role.value ? 'var(--color-brand-primary)' : 'var(--color-text-muted)',
                }}>
                  {role.icon}
                </span>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: selectedRole === role.value ? 'var(--color-brand-primary)' : 'var(--color-text-primary)',
                  }}>
                    {role.label}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {role.desc}
                  </div>
                </div>
                {selectedRole === role.value && (
                  <div style={{
                    marginLeft: 'auto',
                    width: '20px', height: '20px',
                    borderRadius: '50%',
                    background: 'var(--color-brand-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                  }}>
                    {Icons.check}
                  </div>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => selectedRole && setStep(2)}
            disabled={!selectedRole}
            style={{
              width: '100%',
              padding: '12px',
              background: selectedRole ? 'var(--gradient-brand)' : 'var(--color-surface-3)',
              color: selectedRole ? 'white' : 'var(--color-text-muted)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: selectedRole ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: selectedRole ? 'var(--shadow-brand)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            Continuer {Icons.chevronRight}
          </button>

          {/* Google sign up */}
          <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>ou</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          </div>
          <button style={{
            width: '100%', padding: '11px', background: 'white',
            border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '0.9rem',
            cursor: 'pointer',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            S'inscrire avec Google
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '1rem', display: 'flex', alignItems: 'center' }}
            >
              {Icons.chevronLeft}
            </button>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700 }}>
              Vos informations
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginBottom: '24px', marginLeft: '30px' }}>
            Rôle : {roles.find(r => r.value === selectedRole)?.label}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div className="form-group">
              <label className="form-label">Prénom</label>
              <input type="text" value={form.prenom} onChange={handleChange('prenom')} placeholder="Jean" className="input" style={errors.prenom ? { borderColor: 'var(--color-error)' } : {}} />
              {errors.prenom && <span className="form-error" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{Icons.warning} {errors.prenom}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Nom</label>
              <input type="text" value={form.nom} onChange={handleChange('nom')} placeholder="Dupont" className="input" style={errors.nom ? { borderColor: 'var(--color-error)' } : {}} />
              {errors.nom && <span className="form-error" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{Icons.warning} {errors.nom}</span>}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label">Adresse email</label>
            <input type="email" value={form.email} onChange={handleChange('email')} placeholder="vous@exemple.com" className="input" style={errors.email ? { borderColor: 'var(--color-error)' } : {}} />
            {errors.email && <span className="form-error" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{Icons.warning} {errors.email}</span>}
          </div>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label">Mot de passe</label>
            <input type="password" value={form.password} onChange={handleChange('password')} placeholder="Minimum 8 caractères" className="input" style={errors.password ? { borderColor: 'var(--color-error)' } : {}} />
            {errors.password && <span className="form-error" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{Icons.warning} {errors.password}</span>}
            {form.password && (
              <div style={{ marginTop: '6px' }}>
                <div style={{ height: '4px', background: 'var(--color-surface-3)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: form.password.length < 6 ? '33%' : form.password.length < 10 ? '66%' : '100%',
                    background: form.password.length < 6 ? 'var(--color-error)' : form.password.length < 10 ? 'var(--color-warning)' : 'var(--color-success)',
                    borderRadius: '2px',
                    transition: 'width 0.3s',
                  }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: form.password.length < 6 ? 'var(--color-error)' : form.password.length < 10 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                  {form.password.length < 6 ? 'Faible' : form.password.length < 10 ? 'Moyen' : 'Fort'}
                </span>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Confirmer le mot de passe</label>
            <input type="password" value={form.confirmPassword} onChange={handleChange('confirmPassword')} placeholder="••••••••" className="input" style={errors.confirmPassword ? { borderColor: 'var(--color-error)' } : {}} />
            {errors.confirmPassword && <span className="form-error" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{Icons.warning} {errors.confirmPassword}</span>}
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px',
            background: loading ? 'var(--color-surface-3)' : 'var(--gradient-brand)',
            color: loading ? 'var(--color-text-muted)' : 'white',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : 'var(--shadow-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            {loading ? 'Création du compte...' : 'Créer mon compte →'}
          </button>
        </form>
      )}

      <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        Déjà un compte ?{' '}
        <Link href="/auth/login" style={{ color: 'var(--color-brand-primary)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
          Se connecter
        </Link>
      </p>
    </div>
  )
}