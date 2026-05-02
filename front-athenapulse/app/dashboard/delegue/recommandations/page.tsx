'use client'

import { useState, useRef, useEffect } from 'react'
import DashboardLayout from '@/app/components/layout/DashboardLayout'

type RecommendationType = 'product' | 'symptom'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface Recommendation {
  id: string
  productName: string
  category: string
  confidence: number
  description: string
  indications: string[]
  dosage: string
  sideEffects: string[]
}

// Icônes SVG
const Icons = {
  pill: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2 2 14.5a4 4 0 0 0 5.5 5.5L22 9.5a4 4 0 0 0-5.5-5.5Z"></path>
      <path d="M9 12 12 9"></path>
    </svg>
  ),
  stethoscope: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 9a3 3 0 0 1-3 3h-1a3 3 0 0 1-3-3V8"></path>
      <path d="M4 18v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  chat: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  ),
  target: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="6"></circle>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>
  ),
  lightbulb: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6"></path>
      <path d="M10 22h4"></path>
      <path d="M12 2a7 7 0 0 0-7 7c0 2.4 1.2 4.5 3 5.7V17h8v-2.3c1.8-1.3 3-3.4 3-5.7a7 7 0 0 0-7-7z"></path>
    </svg>
  ),
  presentation: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>
  ),
  chevronRight: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  ),
  send: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  ),
  warning: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  ),
}

export default function RecommandationsPage() {
  const [activeTab, setActiveTab] = useState<RecommendationType>('product')
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Bonjour ! Je suis votre assistant IA. Décrivez-moi le produit que vous recherchez ou les symptômes du patient, je vous ferai une recommandation personnalisée.',
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mock API call to get recommendations
  const getRecommendations = async (query: string, type: RecommendationType): Promise<Recommendation[]> => {
    await new Promise(resolve => setTimeout(resolve, 1500))

    const mockRecommendations: Record<string, Recommendation[]> = {
      default: [
        {
          id: '1',
          productName: 'Cardio-X',
          category: 'Cardiologie',
          confidence: 94,
          description: 'Traitement innovant pour l\'hypertension artérielle sévère. Agoniste des récepteurs à l\'angiotensine II de dernière génération.',
          indications: ['Hypertension artérielle sévère', 'Prévention des AVC', 'Insuffisance cardiaque'],
          dosage: '1 comprimé par jour, matin ou soir',
          sideEffects: ['Vertiges légers', 'Fatigue', 'Toux sèche (rare)'],
        },
        {
          id: '2',
          productName: 'Neuro-B Plus',
          category: 'Neurologie',
          confidence: 88,
          description: 'Complément alimentaire pour la santé neurologique. Formulé avec des vitamines B12, B6 et acide folique.',
          indications: ['Neuropathies périphériques', 'Fatigue chronique', 'Troubles de la mémoire légers'],
          dosage: '1 à 2 gélules par jour pendant les repas',
          sideEffects: ['Nausées légères', 'Urine colorée (sans danger)'],
        },
        {
          id: '3',
          productName: 'OmegaCare',
          category: 'Nutrition',
          confidence: 82,
          description: 'Oméga-3 haute concentration pour la santé cardiovasculaire et cognitive.',
          indications: ['Prévention cardiovasculaire', 'Santé cognitive', 'Inflammations chroniques'],
          dosage: '2 gélules par jour avec les repas',
          sideEffects: ['Goût de poisson', 'Éructations'],
        },
      ],
      fièvre: [
        {
          id: '1',
          productName: 'Paracétamol Forte',
          category: 'Antalgique',
          confidence: 96,
          description: 'Antipyrétique et antalgique de référence pour la fièvre modérée à sévère.',
          indications: ['Fièvre > 38.5°C', 'Douleurs légères à modérées', 'Maux de tête'],
          dosage: '500-1000 mg toutes les 4-6 heures (max 3g/jour)',
          sideEffects: ['Rare à dose thérapeutique', 'Hépatotoxicité en surdosage'],
        },
        {
          id: '2',
          productName: 'Ibuprofène',
          category: 'AINS',
          confidence: 91,
          description: 'Anti-inflammatoire non stéroïdien efficace contre la fièvre et l\'inflammation.',
          indications: ['Fièvre inflammatoire', 'Douleurs articulaires', 'Maux de gorge'],
          dosage: '200-400 mg toutes les 6-8 heures',
          sideEffects: ['Irritation gastrique', 'Vertiges'],
        },
      ],
      toux: [
        {
          id: '1',
          productName: 'Touxex',
          category: 'Antitussif',
          confidence: 93,
          description: 'Sirop antitussif pour toux sèche irritative.',
          indications: ['Toux sèche', 'Irritation gorge', 'Toux nocturne'],
          dosage: '10 ml, 3 fois par jour',
          sideEffects: ['Somnolence', 'Sécheresse buccale'],
        },
      ],
      cardio: [
        {
          id: '1',
          productName: 'Cardio-X',
          category: 'Cardiologie',
          confidence: 94,
          description: 'Traitement innovant pour l\'hypertension artérielle sévère.',
          indications: ['Hypertension artérielle sévère', 'Prévention des AVC', 'Insuffisance cardiaque'],
          dosage: '1 comprimé par jour',
          sideEffects: ['Vertiges légers', 'Fatigue'],
        },
      ],
      neuro: [
        {
          id: '1',
          productName: 'Neuro-B Plus',
          category: 'Neurologie',
          confidence: 88,
          description: 'Complément alimentaire pour la santé neurologique.',
          indications: ['Neuropathies périphériques', 'Fatigue chronique', 'Troubles de la mémoire légers'],
          dosage: '1 à 2 gélules par jour',
          sideEffects: ['Nausées légères'],
        },
      ],
    }

    const lowerQuery = query.toLowerCase()
    if (lowerQuery.includes('fièvre') || lowerQuery.includes('fievre') || lowerQuery.includes('température')) {
      return mockRecommendations.fièvre
    } else if (lowerQuery.includes('toux')) {
      return mockRecommendations.toux
    } else if (lowerQuery.includes('cardio') || lowerQuery.includes('coeur') || lowerQuery.includes('cœur')) {
      return mockRecommendations.cardio
    } else if (lowerQuery.includes('neuro') || lowerQuery.includes('nerf')) {
      return mockRecommendations.neuro
    } else {
      return mockRecommendations.default
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    const results = await getRecommendations(userMessage.text, activeTab)
    setRecommendations(results)

    const aiMessage = results.length > 0
      ? `J'ai analysé votre demande et j'ai trouvé ${results.length} recommandation(s) pour vous. Voici les produits les plus pertinents :`
      : 'Je n\'ai pas trouvé de produits correspondant à votre recherche. Pouvez-vous reformuler votre demande ?'
    
    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: aiMessage,
      isUser: false,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, aiResponse])
    setIsLoading(false)
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
            Assistant Recommandations IA
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Obtenez des recommandations produits basées sur les symptômes ou le nom du produit
          </p>
        </div>

        {/* Main content grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
          
          {/* Left column - Chat/Input area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Type selector (produit/symptômes) */}
            <div style={{
              background: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
            }}>
              <div style={{ display: 'flex', gap: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={activeTab === 'product'}
                    onChange={() => setActiveTab('product')}
                    style={{ accentColor: 'var(--color-brand-primary)', width: '18px', height: '18px' }}
                  />
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {Icons.pill} Nom du produit
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={activeTab === 'symptom'}
                    onChange={() => setActiveTab('symptom')}
                    style={{ accentColor: 'var(--color-brand-primary)', width: '18px', height: '18px' }}
                  />
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {Icons.stethoscope} Symptômes
                  </span>
                </label>
              </div>
            </div>

            {/* Chat messages area */}
            <div style={{
              background: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              height: '460px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-surface-1)',
              }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {Icons.chat} Conversation avec l'assistant
                </span>
              </div>
              
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: msg.isUser ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{
                      maxWidth: '80%',
                      padding: '12px 16px',
                      borderRadius: msg.isUser 
                        ? '16px 16px 4px 16px' 
                        : '16px 16px 16px 4px',
                      background: msg.isUser 
                        ? 'var(--gradient-brand)' 
                        : 'var(--color-surface-1)',
                      color: msg.isUser ? 'white' : 'var(--color-text-primary)',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{
                      padding: '12px 20px',
                      borderRadius: '16px 16px 16px 4px',
                      background: 'var(--color-surface-1)',
                      display: 'flex',
                      gap: '6px',
                    }}>
                      <span className="dot-animation">●</span>
                      <span className="dot-animation" style={{ animationDelay: '0.2s' }}>●</span>
                      <span className="dot-animation" style={{ animationDelay: '0.4s' }}>●</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input form */}
              <form onSubmit={handleSubmit} style={{
                padding: '16px 20px',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                gap: '12px',
              }}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={activeTab === 'product' 
                    ? "Ex: Cardio-X, paracétamol, Neuro-B..." 
                    : "Ex: Fièvre, toux, maux de tête, fatigue..."}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-body)',
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
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  style={{
                    padding: '0 28px',
                    background: 'var(--gradient-brand)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    cursor: (isLoading || !inputValue.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (isLoading || !inputValue.trim()) ? 0.6 : 1,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  Envoyer {Icons.send}
                </button>
              </form>
            </div>

            {/* Quick suggestions */}
            <div style={{
              background: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '12px' }}>
                Suggestions rapides :
              </span>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {activeTab === 'product' ? (
                  <>
                    {['Cardio-X', 'Neuro-B Plus', 'OmegaCare'].map(suggestion => (
                      <button
                        key={suggestion}
                        onClick={() => setInputValue(suggestion)}
                        style={{
                          padding: '6px 14px',
                          background: 'var(--color-surface-1)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'var(--color-brand-light)'
                          e.currentTarget.style.borderColor = 'var(--color-brand-primary)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'var(--color-surface-1)'
                          e.currentTarget.style.borderColor = 'var(--color-border)'
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    {['Fièvre et maux de tête', 'Toux persistante', 'Fatigue chronique'].map(suggestion => (
                      <button
                        key={suggestion}
                        onClick={() => setInputValue(suggestion)}
                        style={{
                          padding: '6px 14px',
                          background: 'var(--color-surface-1)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'var(--color-brand-light)'
                          e.currentTarget.style.borderColor = 'var(--color-brand-primary)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'var(--color-surface-1)'
                          e.currentTarget.style.borderColor = 'var(--color-border)'
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right column - Recommendations results */}
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
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #0D1B2A, #0A3D62)',
                color: 'white',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  {Icons.target}
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600 }}>
                    Recommandations personnalisées
                  </h3>
                </div>
                <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                  Basées sur votre demande et données cliniques
                </p>
              </div>

              <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '20px' }}>
                {recommendations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '3rem', display: 'block', marginBottom: '16px', color: 'var(--color-brand-primary)' }}>
                      {Icons.lightbulb}
                    </div>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                      Aucune recommandation pour le moment.
                    </p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                      Commencez une conversation ci-contre.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {recommendations.map((rec, index) => (
                      <div
                        key={rec.id}
                        style={{
                          padding: '20px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          animation: `fadeInUp 0.3s ease-out ${index * 0.1}s both`,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                          e.currentTarget.style.borderColor = 'var(--color-brand-primary)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                          e.currentTarget.style.borderColor = 'var(--color-border)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div>
                            <span style={{
                              fontSize: '0.65rem',
                              color: 'var(--color-text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}>
                              {rec.category}
                            </span>
                            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-brand-primary)', marginTop: '4px' }}>
                              {rec.productName}
                            </h4>
                          </div>
                          <div style={{
                            padding: '4px 10px',
                            background: `rgba(10, 110, 189, 0.12)`,
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.7rem',
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            color: 'var(--color-brand-primary)',
                          }}>
                            {rec.confidence}% match
                          </div>
                        </div>
                        
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '14px', lineHeight: 1.6 }}>
                          {rec.description}
                        </p>
                        
                        <div style={{ marginBottom: '12px' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                            Indications
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                            {rec.indications.map((ind, idx) => (
                              <span key={idx} style={{
                                padding: '4px 10px',
                                background: 'rgba(10,110,189,0.06)',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.7rem',
                                color: 'var(--color-brand-primary)',
                              }}>
                                {ind}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div style={{ marginBottom: '12px', background: 'var(--color-surface-1)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                            Posologie recommandée
                          </span>
                          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                            {rec.dosage}
                          </p>
                        </div>
                        
                        <details style={{ fontSize: '0.75rem', marginBottom: '16px' }}>
                          <summary style={{ cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.7rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {Icons.warning} Voir les effets secondaires
                          </summary>
                          <ul style={{ marginTop: '8px', marginLeft: '20px', color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
                            {rec.sideEffects.map((effect, idx) => (
                              <li key={idx} style={{ marginBottom: '4px' }}>{effect}</li>
                            ))}
                          </ul>
                        </details>
                        
                        <button style={{
                          marginTop: '4px',
                          width: '100%',
                          padding: '10px',
                          background: 'var(--gradient-brand)',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          color: 'white',
                          fontFamily: 'var(--font-display)',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'scale(1.02)'
                          e.currentTarget.style.boxShadow = 'var(--shadow-brand)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                        >
                          {Icons.presentation} Générer une présentation
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .dot-animation {
          animation: bounce 1.4s infinite ease-in-out;
          display: inline-block;
          font-size: 0.8rem;
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
        }
      `}</style>
    </DashboardLayout>
  )
}