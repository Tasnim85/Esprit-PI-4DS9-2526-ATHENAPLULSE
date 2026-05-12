'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'

const Icons = {
  robot: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11v-3a5 5 0 0 1 10 0v3"></path><circle cx="9" cy="15" r="1.5"></circle><circle cx="15" cy="15" r="1.5"></circle></svg>),
  chart: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3"></path><path d="M12 2v8"></path><path d="m8 6 4-4 4 4"></path></svg>),
  target: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>),
  trending: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 6v6h-6"></path><path d="M17 7 3 21"></path></svg>),
  pill: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2 2 14.5a4 4 0 0 0 5.5 5.5L22 9.5a4 4 0 0 0-5.5-5.5Z"></path><path d="M9 12 12 9"></path><path d="M15 6 18 3"></path></svg>),
  lock: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>),
  user: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>),
  stethoscope: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 9a3 3 0 0 1-3 3h-1a3 3 0 0 1-3-3V8"></path><path d="M4 18v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2"></path><circle cx="12" cy="12" r="3"></circle><path d="M9 3v4"></path><path d="M15 3v4"></path></svg>),
  pharmacy: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="6" width="16" height="12" rx="2"></rect><path d="M12 9v6"></path><path d="M9 12h6"></path></svg>),
  briefcase: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>),
  chevronRight: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>),
  play: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>),
  check: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>),
  menu: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>),
  close: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>),
}

const stats = [
  { value: '2500+', label: 'Délégués formés' },
  { value: '98%', label: 'Taux de satisfaction' },
  { value: '150+', label: 'Produits couverts' },
  { value: '40h', label: 'Économisées / mois' },
]

const features = [
  { icon: Icons.robot, title: 'Avatar IA Interactif', desc: 'Simulez des entretiens médicaux avec un avatar intelligent adaptatif pour renforcer vos compétences commerciales.' },
  { icon: Icons.chart, title: 'Recommandations Produits', desc: 'Obtenez des recommandations personnalisées basées sur les profils des médecins et les données cliniques.' },
  { icon: Icons.target, title: 'Génération de Présentations', desc: 'Créez automatiquement des présentations médicales professionnelles adaptées à votre audience.' },
  { icon: Icons.trending, title: 'Suivi de Performance', desc: 'Analysez vos progrès avec des tableaux de bord détaillés et des indicateurs clés de performance.' },
  { icon: Icons.pill, title: 'Base Médicale Enrichie', desc: 'Accédez à une base de données pharmacologique complète et constamment mise à jour.' },
  { icon: Icons.lock, title: 'Sécurité & Conformité', desc: 'Plateforme conforme aux normes RGPD et aux réglementations du secteur pharmaceutique.' },
]

const roles = [
  { icon: Icons.briefcase, title: 'Délégués Médicaux', color: '#0A6EBD', benefits: ['Formation par simulation IA', 'Recommandations produits intelligentes', 'Génération de présentations', 'Suivi des performances'] },
  { icon: Icons.stethoscope, title: 'Professionnels de Santé', color: '#05B8CC', benefits: ['Consultation avatar IA', 'Accès aux fiches produits', 'Historique des interactions', 'Recommandations personnalisées'] },
  { icon: Icons.pharmacy, title: 'Pharmaciens', color: '#F2A516', benefits: ['Informations produits détaillées', 'Chat avec avatar IA', 'Retours d\'expérience', 'Mises à jour en temps réel'] },
]

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menu on scroll
  useEffect(() => {
    if (scrolled && menuOpen) setMenuOpen(false)
  }, [scrolled])

  return (
    <div style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-primary)' }}>

      {/* ===== NAVBAR ===== */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: '0 24px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled || menuOpen ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrolled || menuOpen ? 'blur(20px)' : 'none',
        borderBottom: scrolled || menuOpen ? '1px solid var(--color-border)' : 'none',
        transition: 'all 0.3s ease',
        boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', zIndex: 2 }}>
          <Image src="/logos/logo-athenapulse.png" alt="Athena Pulse" width={130} height={50} priority style={{ height: 'auto' }} />
        </Link>

        {/* Desktop nav */}
        <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          {['Fonctionnalités', 'Pour qui', 'À propos', 'Contact'].map(item => (
            <a key={item} href={item === 'Fonctionnalités' ? '#features' : item === 'Pour qui' ? '#for-who' : '#'} style={{
              color: scrolled ? 'var(--color-text-secondary)' : 'rgba(255,255,255,0.85)',
              fontFamily: 'var(--font-display)', fontSize: '0.88rem', fontWeight: 500,
              transition: 'color 0.2s', textDecoration: 'none',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = scrolled ? 'var(--color-brand-primary)' : 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = scrolled ? 'var(--color-text-secondary)' : 'rgba(255,255,255,0.85)')}
            >{item}</a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link href="/auth/login" style={{
            padding: '7px 16px', borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '0.85rem',
            color: scrolled ? 'var(--color-brand-primary)' : 'white',
            border: `1.5px solid ${scrolled ? 'var(--color-brand-primary)' : 'rgba(255,255,255,0.5)'}`,
            transition: 'all 0.2s', textDecoration: 'none',
          }}>Se connecter</Link>
          <Link href="/auth/register" style={{
            padding: '7px 18px', borderRadius: 'var(--radius-md)',
            background: 'var(--gradient-brand)', color: 'white',
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.85rem',
            boxShadow: 'var(--shadow-brand)', textDecoration: 'none',
          }}>Commencer</Link>
        </div>

        {/* Mobile hamburger */}
        <button className="nav-mobile" onClick={() => setMenuOpen(!menuOpen)} style={{
          background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px',
          color: scrolled || menuOpen ? 'var(--color-text-primary)' : 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {menuOpen ? Icons.close : Icons.menu}
        </button>
      </nav>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: '64px', left: 0, right: 0, zIndex: 999,
          background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--color-border)',
          padding: '20px 24px 28px',
          display: 'flex', flexDirection: 'column', gap: '16px',
          boxShadow: 'var(--shadow-lg)',
        }}>
          {['Fonctionnalités', 'Pour qui', 'À propos', 'Contact'].map(item => (
            <a key={item} href={item === 'Fonctionnalités' ? '#features' : item === 'Pour qui' ? '#for-who' : '#'}
              onClick={() => setMenuOpen(false)}
              style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500, textDecoration: 'none', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              {item}
            </a>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
            <Link href="/auth/login" onClick={() => setMenuOpen(false)} style={{
              padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '0.95rem',
              color: 'var(--color-brand-primary)',
              border: '1.5px solid var(--color-brand-primary)', textDecoration: 'none',
            }}>Se connecter</Link>
            <Link href="/auth/register" onClick={() => setMenuOpen(false)} style={{
              padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center',
              background: 'var(--gradient-brand)', color: 'white',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem',
              textDecoration: 'none',
            }}>Commencer gratuitement</Link>
          </div>
        </div>
      )}

      {/* ===== HERO ===== */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        background: 'linear-gradient(135deg, #0D1B2A 0%, #0A3D62 50%, #0A6EBD 100%)',
        position: 'relative', overflow: 'hidden', paddingTop: '64px',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 20% 50%, rgba(5,184,204,0.15) 0%, transparent 60%),
                       radial-gradient(ellipse at 80% 20%, rgba(10,110,189,0.20) 0%, transparent 60%),
                       radial-gradient(ellipse at 60% 80%, rgba(242,165,22,0.08) 0%, transparent 60%)`,
          pointerEvents: 'none',
        }} />

        {/* Decorative circles — hidden on mobile */}
        <div className="hero-circles">
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: `${60 + i * 40}px`, height: `${60 + i * 40}px`,
              borderRadius: '50%',
              border: `1px solid rgba(255,255,255,${0.03 + i * 0.01})`,
              top: `${10 + i * 12}%`, right: `${5 + i * 6}%`,
              animation: `float ${4 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }} />
          ))}
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px', width: '100%', position: 'relative', zIndex: 1 }}>
          <div className="hero-grid">

            {/* Left: Content */}
            <div style={{ animation: 'slideUp 0.8s ease forwards' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'rgba(5,184,204,0.15)', border: '1px solid rgba(5,184,204,0.3)',
                borderRadius: 'var(--radius-full)', padding: '6px 14px', marginBottom: '20px',
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#05B8CC', display: 'inline-block', animation: 'pulseSoft 2s ease-in-out infinite' }} />
                <span style={{ color: '#05B8CC', fontSize: '0.78rem', fontFamily: 'var(--font-display)', fontWeight: 500 }}>
                  Powered by Laboratoires Vital
                </span>
              </div>

              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.9rem, 5vw, 3.5rem)',
                fontWeight: 700, color: 'white', lineHeight: 1.15, marginBottom: '18px',
              }}>
                L'IA au service de{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #05B8CC, #F2A516)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>l'excellence médicale</span>
              </h1>

              <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', lineHeight: 1.8, marginBottom: '32px', maxWidth: '500px' }}>
                Athena Pulse accompagne les délégués médicaux et les professionnels de santé avec une intelligence artificielle avancée — formation, recommandations et consultations en temps réel.
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link href="/auth/register" style={{
                  padding: '13px 28px', background: 'var(--gradient-brand)', color: 'white',
                  borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-display)', fontWeight: 600,
                  fontSize: 'clamp(0.85rem, 2vw, 1rem)',
                  boxShadow: '0 8px 32px rgba(10,110,189,0.4)', transition: 'transform 0.2s, box-shadow 0.2s',
                  display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none',
                }}>Démarrer gratuitement {Icons.chevronRight}</Link>
                <a href="#features" style={{
                  padding: '13px 24px', background: 'rgba(255,255,255,0.08)', color: 'white',
                  borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-display)', fontWeight: 500,
                  fontSize: 'clamp(0.85rem, 2vw, 1rem)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none',
                }}>{Icons.play} Voir la démo</a>
              </div>

              {/* Stats */}
              <div className="stats-grid" style={{ marginTop: '44px' }}>
                {stats.map(stat => (
                  <div key={stat.label}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', fontWeight: 700, color: 'white' }}>{stat.value}</div>
                    <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Card */}
            <div style={{ display: 'flex', justifyContent: 'center', animation: 'float 6s ease-in-out infinite' }}>
              <div style={{
                width: '100%', maxWidth: '360px',
                background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
                borderRadius: '28px', border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: '18px', padding: '28px',
                boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
              }}>
                <div style={{
                  width: '90px', height: '90px', borderRadius: '50%',
                  background: 'var(--gradient-brand)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                  boxShadow: '0 0 0 8px rgba(10,110,189,0.15), 0 0 40px rgba(5,184,204,0.3)',
                  animation: 'pulseSoft 3s ease-in-out infinite',
                }}>{Icons.robot}</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'white', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.05rem' }}>Assistant Athena</div>
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', marginTop: '4px' }}>Prêt à vous accompagner</div>
                </div>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { text: 'Bonjour ! Comment puis-je vous aider ?', ai: true },
                    { text: 'Prépare une présentation sur le produit X', ai: false },
                    { text: 'Je génère votre présentation... ✓', ai: true },
                  ].map((msg, i) => (
                    <div key={i} style={{
                      padding: '9px 12px',
                      borderRadius: msg.ai ? '12px 12px 12px 4px' : '12px 12px 4px 12px',
                      background: msg.ai ? 'rgba(255,255,255,0.10)' : 'rgba(10,110,189,0.40)',
                      color: 'rgba(255,255,255,0.90)', fontSize: '0.76rem',
                      alignSelf: msg.ai ? 'flex-start' : 'flex-end', maxWidth: '85%',
                    }}>{msg.text}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" style={{ padding: 'clamp(56px, 8vw, 96px) 0', background: 'var(--color-surface-0)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 64px)' }}>
            <span style={{
              display: 'inline-block', background: 'rgba(10,110,189,0.08)', color: 'var(--color-brand-primary)',
              borderRadius: 'var(--radius-full)', padding: '6px 16px', fontSize: '0.78rem',
              fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '14px',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>Fonctionnalités</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: 700, marginBottom: '14px' }}>
              Tout ce dont vous avez besoin
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'clamp(0.9rem, 2vw, 1.05rem)', maxWidth: '520px', margin: '0 auto' }}>
              Une plateforme complète conçue pour optimiser les interactions dans le secteur pharmaceutique.
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, i) => (
              <div key={i} className="card" style={{ padding: 'clamp(20px, 3vw, 28px)', cursor: 'default' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface-1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '14px', color: 'var(--color-brand-primary)',
                }}>{feature.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(0.95rem, 2vw, 1.05rem)', fontWeight: 600, marginBottom: '10px' }}>{feature.title}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'clamp(0.82rem, 1.5vw, 0.9rem)', lineHeight: 1.7 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOR WHO ===== */}
      <section id="for-who" style={{ padding: 'clamp(56px, 8vw, 96px) 0', background: 'var(--color-surface-1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 64px)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: 700, marginBottom: '14px' }}>
              Conçu pour chaque acteur
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'clamp(0.9rem, 2vw, 1.05rem)', maxWidth: '480px', margin: '0 auto' }}>
              Une expérience adaptée à chaque rôle dans l'écosystème médical.
            </p>
          </div>
          <div className="roles-grid">
            {roles.map((role, i) => (
              <div key={i} style={{
                background: 'white', borderRadius: 'var(--radius-xl)',
                padding: 'clamp(24px, 4vw, 36px) clamp(20px, 3vw, 28px)',
                border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)',
                transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
              >
                <div style={{
                  width: '56px', height: '56px', borderRadius: '14px',
                  background: `${role.color}15`, border: `1px solid ${role.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: role.color, marginBottom: '18px',
                }}>{role.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', fontWeight: 700, color: role.color, marginBottom: '14px' }}>{role.title}</h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {role.benefits.map((b, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-secondary)', fontSize: 'clamp(0.82rem, 1.5vw, 0.9rem)' }}>
                      <span style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: role.color, flexShrink: 0 }}>{Icons.check}</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section style={{
        padding: 'clamp(56px, 8vw, 96px) 24px',
        background: 'linear-gradient(135deg, #0D1B2A 0%, #0A3D62 100%)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(10,110,189,0.2) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '580px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: 700, color: 'white', marginBottom: '14px' }}>
            Prêt à transformer votre pratique ?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 'clamp(0.9rem, 2vw, 1.05rem)', marginBottom: '32px', lineHeight: 1.8 }}>
            Rejoignez les milliers de professionnels qui utilisent déjà Athena Pulse pour optimiser leurs performances.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/register" style={{
              padding: 'clamp(11px, 2vw, 14px) clamp(24px, 4vw, 36px)',
              background: 'var(--gradient-brand)', color: 'white',
              borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 'clamp(0.88rem, 2vw, 1rem)',
              boxShadow: '0 8px 32px rgba(10,110,189,0.5)', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '6px',
            }}>Créer un compte {Icons.chevronRight}</Link>
            <Link href="/auth/login" style={{
              padding: 'clamp(11px, 2vw, 14px) clamp(20px, 3vw, 28px)',
              background: 'rgba(255,255,255,0.08)', color: 'white',
              borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-display)', fontWeight: 500,
              fontSize: 'clamp(0.88rem, 2vw, 1rem)',
              border: '1px solid rgba(255,255,255,0.15)', textDecoration: 'none',
            }}>Se connecter</Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ background: '#080F18', padding: 'clamp(32px, 5vw, 48px) 24px 24px', color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="footer-inner" style={{ marginBottom: '32px' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
              <Image src="/logos/logo-athenapulse.png" alt="Athena Pulse" width={130} height={40} style={{ width: 'auto', height: 'auto' }} />
            </Link>
            <div className="footer-links">
              {['Politique de confidentialité', 'Conditions d\'utilisation', 'Contact', 'À propos'].map(link => (
                <a key={link} href="#" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', transition: 'color 0.2s', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
                >{link}</a>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', textAlign: 'center', fontSize: '0.78rem' }}>
            © 2026 Laboratoires Vital — Athena Pulse. Tous droits réservés.
          </div>
        </div>
      </footer>

      <style jsx>{`
        /* ── Animations ── */
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
        @keyframes pulseSoft { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.05);opacity:0.9} }
        @keyframes slideUp { from{opacity:0;transform:translateY(36px)} to{opacity:1;transform:translateY(0)} }

        /* ── Hero grid ── */
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
        }
        @media (max-width: 860px) {
          .hero-grid {
            grid-template-columns: 1fr;
            gap: 40px;
            text-align: center;
          }
          .hero-grid > div:first-child {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .hero-grid > div:first-child p {
            text-align: center;
            margin: 0 auto 32px;
          }
        }

        /* ── Stats grid ── */
        .stats-grid {
          display: flex;
          gap: clamp(16px, 4vw, 32px);
          flex-wrap: wrap;
        }
        @media (max-width: 860px) {
          .stats-grid { justify-content: center; }
        }

        /* ── Features grid ── */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 1024px) {
          .features-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .features-grid { grid-template-columns: 1fr; }
        }

        /* ── Roles grid ── */
        .roles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 900px) {
          .roles-grid { grid-template-columns: 1fr; max-width: 480px; margin: 0 auto; }
        }

        /* ── Footer ── */
        .footer-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }
        .footer-links {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }
        @media (max-width: 600px) {
          .footer-inner { flex-direction: column; align-items: flex-start; }
          .footer-links { gap: 14px; }
        }

        /* ── Navbar ── */
        .nav-desktop { display: flex; }
        .nav-mobile { display: none; }
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile { display: flex !important; }
        }

        /* ── Hero decorative circles ── */
        @media (max-width: 860px) {
          .hero-circles { display: none; }
        }

        /* ── Card hover ── */
        .card {
          transition: transform 0.2s, box-shadow 0.2s;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          background: var(--color-surface-0);
        }
        .card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }
      `}</style>
    </div>
  )
}