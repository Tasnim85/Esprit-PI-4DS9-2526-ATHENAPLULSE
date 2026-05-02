'use client'

import { useState } from 'react'
import DashboardLayout from '@/app/components/layout/DashboardLayout'

type GenerationType = 'presentation' | 'rapport'

interface Slide {
  title: string
  content: string
}

interface Section {
  title: string
  content: string
}

interface GeneratedContent {
  type: GenerationType
  title: string
  content?: string
  slides?: Slide[]
  sections?: Section[]
  productName: string
  indication?: string
  generatedAt: Date
}

interface ProductData {
  name: string
  fullName: string
  class: string
  indications: string[]
  dosage: string
  mechanism: string
  efficacy: string
  sideEffects: string[]
  contraindications: string[]
  studies: string
  price: string
  presentation: string
}

// Icônes SVG
const Icons = {
  presentation: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>
  ),
  report: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>
  ),
  config: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  ),
  sparkles: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  eye: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  download: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  ),
  package: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2 2 14.5a4 4 0 0 0 5.5 5.5L22 9.5a4 4 0 0 0-5.5-5.5Z"></path>
      <path d="M9 12 12 9"></path>
    </svg>
  ),
  target: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="6"></circle>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>
  ),
  calendar: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  ),
  empty: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="12" y1="18" x2="12" y2="12"></line>
      <line x1="9" y1="15" x2="15" y2="15"></line>
    </svg>
  ),
}

export default function PresentationsPage() {
  const [productName, setProductName] = useState('')
  const [indication, setIndication] = useState('')
  const [generationType, setGenerationType] = useState<GenerationType>('presentation')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [activeTab, setActiveTab] = useState<'preview'>('preview')
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [allSlides, setAllSlides] = useState<Array<[string, string]>>([])

  // Appel au backend FastAPI
  const generateContent = async (product: string, indicationText: string, type: GenerationType): Promise<GeneratedContent> => {
    try {
      const response = await fetch('http://localhost:8000/compliance/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          produit: product,
          indication: indicationText || undefined,
        }),
      })

      if (!response.ok) {
        console.error(`API Error: ${response.status}`)
        throw new Error('Erreur lors de la récupération des données')
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error('Génération échouée')
      }

      const slides = data.presentation_slides || {}
      const slidesArray = Object.entries(slides) as [string, string][]
      setAllSlides(slidesArray)
      setCurrentSlideIndex(0)

      if (type === 'presentation') {
        const slideObjects: Slide[] = slidesArray.map(([key, content]) => ({
          title: key.replace(/^slide\d+_/i, '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          content: content as string,
        }))

        return {
          type: 'presentation',
          title: `Présentation - ${product}`,
          productName: product,
          indication: indicationText || undefined,
          generatedAt: new Date(),
          slides: slideObjects,
        }
      } else {
        const sections: Section[] = [
          {
            title: 'Résumé Exécutif',
            content: data.presentation_slides?.slide2_introduction || 'Description du produit',
          },
          {
            title: 'Indications',
            content: data.presentation_slides?.slide3_key_benefit || 'Indications du produit',
          },
          {
            title: 'Mode d\'action',
            content: data.presentation_slides?.slide4_how_it_works || 'Mécanisme d\'action',
          },
          {
            title: 'Posologie',
            content: data.presentation_slides?.slide5_usage || 'Instructions d\'utilisation',
          },
          {
            title: 'Sécurité',
            content: data.presentation_slides?.slide6_safety || 'Profil de sécurité',
          },
        ]

        return {
          type: 'rapport',
          title: `Rapport Médical - ${product}`,
          productName: product,
          indication: indicationText || undefined,
          generatedAt: new Date(),
          sections: sections,
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  const downloadPPTX = async () => {
    if (!generatedContent || generatedContent.type !== 'presentation') return

    try {
      const response = await fetch('http://localhost:8000/compliance/pptx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          produit: generatedContent.productName,
          indication: generatedContent.indication || undefined,
        }),
      })

      if (!response.ok) {
        console.error(`PPTX download failed: ${response.status}`)
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${generatedContent.productName.replace(/\s+/g, '_')}_presentation.pptx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PPTX download failed:', error)
    }
  }

  const downloadReport = async () => {
    if (!generatedContent || generatedContent.type !== 'rapport') return

    try {
      const response = await fetch('http://localhost:8000/compliance/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          produit: generatedContent.productName,
          indication: generatedContent.indication || undefined,
        }),
      })

      if (!response.ok) {
        console.error(`PDF download failed: ${response.status}`)
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${generatedContent.productName.replace(/\s+/g, '_')}_rapport.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF download failed:', error)
    }
  }

  const handleDownload = () => {
    if (generationType === 'presentation') {
      downloadPPTX()
    } else {
      downloadReport()
    }
  }

  const handleGenerate = async () => {
    if (!productName.trim()) return

    setIsGenerating(true)
    const content = await generateContent(productName, indication, generationType)
    setGeneratedContent(content)
    setIsGenerating(false)
  }

  return (
    <DashboardLayout role="delegue">
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '1.8rem', 
            fontWeight: 700, 
            marginBottom: '8px',
            background: 'linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Générateur de Présentations
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Créez des présentations médicales (PPTX) et des rapports professionnels (PDF) en quelques secondes
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
          
          {/* Left panel - Input form */}
          <div>
            <div style={{
              background: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              position: 'sticky',
              top: 'calc(var(--header-height) + 28px)',
            }}>
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #0D1B2A, #0A3D62)',
                color: 'white',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  {Icons.config}
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'white' }}>Configuration</h3>
                </div>
                <p style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '28px', color: 'rgba(255,255,255,0.7)' }}>
                  Remplissez les informations ci-dessous
                </p>
              </div>

              <div style={{ padding: '20px' }}>
                {/* Product name input */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    marginBottom: '8px',
                    color: 'var(--color-text-primary)',
                  }}>
                    Nom du produit *
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Ex: Cardio-X, Neuro-B Plus, Fibromed..."
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = 'var(--color-brand-primary)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(10,110,189,0.1)'
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = 'var(--color-border)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>

                {/* Indication input (optional) */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    marginBottom: '8px',
                    color: 'var(--color-text-primary)',
                  }}>
                    Indication (optionnel)
                  </label>
                  <textarea
                    value={indication}
                    onChange={(e) => setIndication(e.target.value)}
                    placeholder="Ex: Hypertension artérielle sévère, Neuropathies périphériques..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.9rem',
                      fontFamily: 'var(--font-body)',
                      resize: 'vertical',
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = 'var(--color-brand-primary)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(10,110,189,0.1)'
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = 'var(--color-border)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>

                {/* Type selector */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    marginBottom: '12px',
                    color: 'var(--color-text-primary)',
                  }}>
                    Type de génération
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => setGenerationType('presentation')}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: generationType === 'presentation' ? 'var(--gradient-brand)' : 'white',
                        border: `1.5px solid ${generationType === 'presentation' ? 'transparent' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>{Icons.presentation}</div>
                      <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: generationType === 'presentation' ? 'white' : 'var(--color-text-primary)',
                      }}>
                        Présentation (PPTX)
                      </div>
                    </button>
                    <button
                      onClick={() => setGenerationType('rapport')}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: generationType === 'rapport' ? 'var(--gradient-brand)' : 'white',
                        border: `1.5px solid ${generationType === 'rapport' ? 'transparent' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>{Icons.report}</div>
                      <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: generationType === 'rapport' ? 'white' : 'var(--color-text-primary)',
                      }}>
                        Rapport (PDF)
                      </div>
                    </button>
                  </div>
                </div>

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !productName.trim()}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'var(--gradient-brand)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: (isGenerating || !productName.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (isGenerating || !productName.trim()) ? 0.6 : 1,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {isGenerating ? (
                    <>
                      <span className="spinner" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      {Icons.sparkles} Générer {generationType === 'presentation' ? 'la présentation' : 'le rapport'}
                    </>
                  )}
                </button>

                {/* Info message */}
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'rgba(10,110,189,0.05)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.7rem',
                  color: 'var(--color-text-muted)',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}>
                  {Icons.info} Les présentations sont générées en PPTX, les rapports en PDF
                </div>
              </div>
            </div>
          </div>

          {/* Right panel - Generated content */}
          <div>
            <div style={{
              background: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}>
              {/* Preview content */}
              <div style={{ padding: '24px', minHeight: '500px' }}>
                {!generatedContent ? (
                  <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                    <div style={{ fontSize: '4rem', display: 'block', marginBottom: '16px', color: 'var(--color-brand-primary)' }}>
                      {Icons.empty}
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '8px' }}>
                      Aucun contenu généré
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                      Remplissez le formulaire à gauche et cliquez sur "Générer"
                    </p>
                  </div>
                ) : (
                  <div className="preview-content">
                    {/* Header info */}
                    <div style={{
                      background: 'linear-gradient(135deg, #0D1B2A, #0A3D62)',
                      margin: '-24px -24px 24px -24px',
                      padding: '24px',
                      color: 'white',
                    }}>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: '8px', color: 'white' }}>
                        {generatedContent.title}
                      </h2>
                      <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', opacity: 0.8, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{Icons.package} {generatedContent.productName}</span>
                        {generatedContent.indication && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{Icons.target} {generatedContent.indication}</span>}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{Icons.calendar} {generatedContent.generatedAt.toLocaleDateString('fr-FR')}</span>
                        <span>{generationType === 'presentation' ? '📊 PPTX' : '📄 PDF'}</span>
                      </div>
                    </div>

                    {/* Preview content */}
                    {generatedContent.type === 'presentation' && allSlides.length > 0 ? (
                      <div style={{
                        background: '#1a1a1a',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                        marginTop: '16px',
                      }}>
                        {/* Slide Viewer Header */}
                        <div style={{
                          padding: '12px 16px',
                          background: '#0D1B2A',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid #333',
                        }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                            📊 Présentation - Page {currentSlideIndex + 1} sur {allSlides.length}
                          </div>
                          <button
                            onClick={handleDownload}
                            style={{
                              padding: '6px 14px',
                              background: 'white',
                              color: '#0D1B2A',
                              border: 'none',
                              borderRadius: '4px',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = '#05B8CC'
                              e.currentTarget.style.color = 'white'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'white'
                              e.currentTarget.style.color = '#0D1B2A'
                            }}
                          >
                            📥 Télécharger
                          </button>
                        </div>

                        {/* Slide Content */}
                        <div style={{
                          padding: '40px',
                          minHeight: '400px',
                          background: 'white',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          color: '#333',
                        }}>
                          {allSlides[currentSlideIndex] && (
                            <div style={{ width: '100%', textAlign: 'center' }}>
                              <div style={{
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                color: '#0A6EBD',
                                marginBottom: '16px',
                                textTransform: 'none',
                                letterSpacing: '1px',
                              }}>
                                {allSlides[currentSlideIndex][0]
                                  .replace(/^slide\d+_/i, '')
                                  .split('_')
                                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                  .join(' ')}
                              </div>
                              <div style={{
                                fontSize: '1rem',
                                lineHeight: 1.8,
                                color: '#555',
                                whiteSpace: 'pre-wrap',
                                wordWrap: 'break-word',
                                maxWidth: '800px',
                                margin: '0 auto',
                              }}>
                                {allSlides[currentSlideIndex][1]}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Navigation Controls */}
                        <div style={{
                          padding: '16px',
                          background: '#0D1B2A',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          borderTop: '1px solid #333',
                        }}>
                          <button
                            onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                            disabled={currentSlideIndex === 0}
                            style={{
                              padding: '8px 16px',
                              background: currentSlideIndex === 0 ? '#555' : '#05B8CC',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontWeight: 600,
                              cursor: currentSlideIndex === 0 ? 'not-allowed' : 'pointer',
                              opacity: currentSlideIndex === 0 ? 0.5 : 1,
                              transition: 'all 0.2s',
                            }}
                          >
                            ← Précédent
                          </button>

                          <div style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                          }}>
                            {Array.from({ length: allSlides.length }).map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setCurrentSlideIndex(i)}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  padding: 0,
                                  background: currentSlideIndex === i ? '#05B8CC' : '#444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  fontSize: '0.8rem',
                                }}
                                onMouseEnter={e => {
                                  if (currentSlideIndex !== i) {
                                    e.currentTarget.style.background = '#666'
                                  }
                                }}
                                onMouseLeave={e => {
                                  if (currentSlideIndex !== i) {
                                    e.currentTarget.style.background = '#444'
                                  }
                                }}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => setCurrentSlideIndex(Math.min(allSlides.length - 1, currentSlideIndex + 1))}
                            disabled={currentSlideIndex === allSlides.length - 1}
                            style={{
                              padding: '8px 16px',
                              background: currentSlideIndex === allSlides.length - 1 ? '#555' : '#05B8CC',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontWeight: 600,
                              cursor: currentSlideIndex === allSlides.length - 1 ? 'not-allowed' : 'pointer',
                              opacity: currentSlideIndex === allSlides.length - 1 ? 0.5 : 1,
                              transition: 'all 0.2s',
                            }}
                          >
                            Suivant →
                          </button>
                        </div>
                      </div>
                    ) : generatedContent.type === 'rapport' && generatedContent.sections ? (
                      <div>
                        {generatedContent.sections.map((section, idx) => (
                          <div key={idx} style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, marginBottom: '12px', color: 'var(--color-brand-primary)' }}>
                              {section.title}
                            </h3>
                            <div style={{ fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                              {section.content.split('\n').map((line, i) => {
                                if (line.startsWith('**')) return <strong key={i}>{line.slice(2, -2)}</strong>
                                if (line.startsWith('- ')) return <li key={i} style={{ marginLeft: '20px' }}>{line.slice(2)}</li>
                                return line ? <p key={i} style={{ margin: '6px 0' }}>{line}</p> : <br key={i} />
                              })}
                            </div>
                          </div>
                        ))}
                        
                        {/* Download button for PDF */}
                        <div style={{
                          marginTop: '32px',
                          paddingTop: '24px',
                          borderTop: '1px solid var(--color-border)',
                          textAlign: 'center',
                        }}>
                          <button
                            onClick={handleDownload}
                            style={{
                              padding: '12px 32px',
                              background: 'var(--gradient-brand)',
                              border: 'none',
                              borderRadius: 'var(--radius-md)',
                              color: 'white',
                              fontFamily: 'var(--font-display)',
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '10px',
                              transition: 'transform 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            {Icons.download} Télécharger le rapport (PDF)
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .preview-content {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </DashboardLayout>
  )
}