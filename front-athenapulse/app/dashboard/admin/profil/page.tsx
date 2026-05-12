// app/dashboard/admin/profil/page.tsx
'use client'

import { useState } from 'react'
import DashboardLayout from '../../../components/layout/DashboardLayout'

interface AdminProfile {
  nom: string
  prenom: string
  email: string
  role: string
  telephone: string
  departement: string
  avatar?: string
  dateCreation: string
  derniereConnexion: string
}

export default function AdminProfilePage() {
  // Mock data - replace with actual API call later
  const [profile, setProfile] = useState<AdminProfile>({
    nom: 'Admin',
    prenom: 'Super',
    email: 'admin@athenapulse.com',
    role: 'Administrateur',
    telephone: '+216 12 345 678',
    departement: 'IT & Analytics',
    dateCreation: '01/01/2024',
    derniereConnexion: new Date().toLocaleDateString('fr-FR')
  })

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(profile)

  const handleSave = () => {
    setProfile(formData)
    setIsEditing(false)
    // TODO: Add API call to save profile
    alert('Profil mis à jour avec succès!')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <DashboardLayout role="administrateur">
      <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            fontWeight: 700,
            background: 'var(--gradient-brand)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: '8px',
          }}>
            Mon profil
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Gérez vos informations personnelles et préférences
          </p>
        </div>

        {/* Profile Card */}
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {/* Cover Image / Header */}
          <div style={{
            height: '120px',
            background: 'linear-gradient(135deg, #0D1B2A 0%, #0A3D62 100%)',
            position: 'relative',
          }}>
            {/* Avatar */}
            <div style={{
              position: 'absolute',
              bottom: '-40px',
              left: '40px',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'var(--gradient-brand)',
              border: '4px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-md)',
            }}>
              <span style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                color: 'white',
              }}>
                {profile.prenom[0]}{profile.nom[0]}
              </span>
            </div>
          </div>

          {/* Profile Content */}
          <div style={{ padding: '60px 32px 32px 32px' }}>
            {/* User Info */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                marginBottom: '4px',
              }}>
                {profile.prenom} {profile.nom}
              </h2>
              <p style={{
                color: 'var(--color-brand-primary)',
                fontWeight: 500,
                marginBottom: '16px',
              }}>
                {profile.role}
              </p>
              <div style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
              }}>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  style={{
                    padding: '8px 20px',
                    background: isEditing ? 'var(--color-error)' : 'var(--gradient-brand)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  {isEditing ? 'Annuler' : '✏️ Modifier le profil'}
                </button>
                {isEditing && (
                  <button
                    onClick={handleSave}
                    style={{
                      padding: '8px 20px',
                      background: 'var(--color-success)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 500,
                      fontSize: '0.85rem',
                    }}
                  >
                    💾 Enregistrer
                  </button>
                )}
              </div>
            </div>

            {/* Information Sections */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
            }}>
              {/* Personal Information */}
              <div style={{
                background: 'var(--color-surface-1)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
              }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>👤</span> Informations personnelles
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                      Prénom
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                          fontSize: '0.9rem',
                          fontFamily: 'var(--font-body)',
                        }}
                      />
                    ) : (
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        {profile.prenom}
                      </p>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                      Nom
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                          fontSize: '0.9rem',
                        }}
                      />
                    ) : (
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        {profile.nom}
                      </p>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                      Email
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                          fontSize: '0.9rem',
                        }}
                      />
                    ) : (
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                        {profile.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                      Téléphone
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="telephone"
                        value={formData.telephone}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                          fontSize: '0.9rem',
                        }}
                      />
                    ) : (
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                        {profile.telephone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div style={{
                background: 'var(--color-surface-1)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
              }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>💼</span> Informations professionnelles
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                      Rôle
                    </label>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                      {profile.role}
                    </p>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                      Département
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="departement"
                        value={formData.departement}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                          fontSize: '0.9rem',
                        }}
                      />
                    ) : (
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                        {profile.departement}
                      </p>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                      Membre depuis
                    </label>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                      {profile.dateCreation}
                    </p>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                      Dernière connexion
                    </label>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                      {profile.derniereConnexion}
                    </p>
                  </div>
                </div>
              </div>

              {/* Security & Preferences */}
              <div style={{
                background: 'var(--color-surface-1)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
              }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>🔒</span> Sécurité & Préférences
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <button
                    onClick={() => alert('Fonctionnalité à venir: Changer le mot de passe')}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'white',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 500,
                      fontSize: '0.85rem',
                      color: 'var(--color-text-primary)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--color-surface-2)'
                      e.currentTarget.style.borderColor = 'var(--color-brand-primary)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'white'
                      e.currentTarget.style.borderColor = 'var(--color-border)'
                    }}
                  >
                    🔑 Changer le mot de passe
                  </button>

                  <button
                    onClick={() => alert('Fonctionnalité à venir: Notifications')}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'white',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 500,
                      fontSize: '0.85rem',
                      color: 'var(--color-text-primary)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--color-surface-2)'
                      e.currentTarget.style.borderColor = 'var(--color-brand-primary)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'white'
                      e.currentTarget.style.borderColor = 'var(--color-border)'
                    }}
                  >
                    🔔 Préférences de notifications
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Êtes-vous sûr de vouloir vous déconnecter?')) {
                        window.location.href = '/auth/login'
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#fee2e2',
                      border: '1px solid #fecaca',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 500,
                      fontSize: '0.85rem',
                      color: '#dc2626',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#fecaca'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#fee2e2'
                    }}
                  >
                    🚪 Déconnexion
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}