'use client'

import { useState, useRef, useEffect } from 'react'
import DashboardLayout from '@/app/components/layout/DashboardLayout'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  isTyping?: boolean
}

interface ProductInfo {
  name: string
  description: string
  indications: string[]
  dosage: string
  sideEffects: string[]
  presentation: string
}

export default function AvatarDoctorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Bonjour Docteur ! 👨‍⚕️ Je suis votre assistant médical Athena. Je peux vous présenter des produits, répondre à vos questions sur les traitements, ou vous aider à préparer vos consultations. Comment puis-je vous aider aujourd\'hui ?',
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<ProductInfo | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mock product database
  const getProductInfo = async (query: string): Promise<ProductInfo | null> => {
    await new Promise(resolve => setTimeout(resolve, 1000))

    const products: Record<string, ProductInfo> = {
      'cardio-x': {
        name: 'Cardio-X',
        description: 'Traitement innovant pour l\'hypertension artérielle sévère. Agoniste des récepteurs à l\'angiotensine II de dernière génération avec libération prolongée 24h.',
        indications: ['Hypertension artérielle sévère', 'Prévention des AVC', 'Insuffisance cardiaque chronique', 'Néphropathie diabétique'],
        dosage: '1 comprimé par jour, matin ou soir, avec ou sans nourriture',
        sideEffects: ['Vertiges légers (5%)', 'Fatigue (3%)', 'Toux sèche (1%)', 'Hyperkaliémie rare'],
        presentation: 'Boîte de 30 comprimés - 50mg/100mg',
      },
      'neuro-b': {
        name: 'Neuro-B Plus',
        description: 'Complément alimentaire pour la santé neurologique. Formulé avec des vitamines B12, B6, acide folique et alpha-lipoïque.',
        indications: ['Neuropathies périphériques', 'Fatigue chronique', 'Troubles de la mémoire légers', 'Prévention cognitive'],
        dosage: '1 à 2 gélules par jour pendant les repas',
        sideEffects: ['Nausées légères (2%)', 'Urine colorée (sans danger)', 'Réactions allergiques rares'],
        presentation: 'Flacon de 60 gélules',
      },
      'fibromed': {
        name: 'Fibromed',
        description: 'Traitement de la fibromyalgie. Action sur les neurotransmetteurs impliqués dans la douleur chronique.',
        indications: ['Fibromyalgie', 'Douleurs chroniques diffuses', 'Troubles du sommeil associés'],
        dosage: '1 comprimé matin et soir. Augmentation progressive sur 2 semaines',
        sideEffects: ['Nausées (8%)', 'Sécheresse buccale (6%)', 'Somnolence (10%)'],
        presentation: 'Boîte de 28 comprimés - 75mg',
      },
    }

    const lowerQuery = query.toLowerCase()
    if (lowerQuery.includes('cardio') || lowerQuery.includes('hypertension')) {
      return products['cardio-x']
    } else if (lowerQuery.includes('neuro') || lowerQuery.includes('nerf') || lowerQuery.includes('mémoire')) {
      return products['neuro-b']
    } else if (lowerQuery.includes('fibro') || lowerQuery.includes('douleur')) {
      return products['fibromed']
    }
    return null
  }

  const simulateTyping = async (response: string) => {
    setIsAvatarSpeaking(true)
    const typingMessage: Message = {
      id: Date.now().toString(),
      text: '',
      isUser: false,
      timestamp: new Date(),
      isTyping: true,
    }
    setMessages(prev => [...prev, typingMessage])
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setMessages(prev => prev.filter(m => !m.isTyping))
    const finalMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: response,
      isUser: false,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, finalMessage])
    setIsAvatarSpeaking(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    const query = inputValue
    setInputValue('')
    setIsLoading(true)

    // Check if asking for a product
    const product = await getProductInfo(query)
    
    if (product) {
      setCurrentProduct(product)
      await simulateTyping(`Je vois que vous vous intéressez à ${product.name}. ${product.description}\n\n📋 **Indications :**\n${product.indications.map(i => `• ${i}`).join('\n')}\n\n💊 **Posologie :**\n${product.dosage}\n\n⚠️ **Effets secondaires :**\n${product.sideEffects.map(e => `• ${e}`).join('\n')}\n\n📦 **Présentation :**\n${product.presentation}\n\nSouhaitez-vous que je vous envoie une fiche produit détaillée ?`)
    } else {
      await simulateTyping("Je n'ai pas trouvé de produit correspondant à votre recherche. Pouvez-vous me donner plus de détails sur le produit ou la pathologie qui vous intéresse ? Je peux vous renseigner sur Cardio-X (hypertension), Neuro-B Plus (neurologie) ou Fibromed (douleurs chroniques).")
    }
    
    setIsLoading(false)
  }

  const quickQuestions = [
    'Présentez-moi Cardio-X',
    'Quels sont les effets secondaires de Neuro-B Plus ?',
    'Fibromed pour la fibromyalgie',
    'Posologie de Cardio-X',
  ]

  return (
    <DashboardLayout role="hcp">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header with Avatar */}
        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'var(--gradient-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            margin: '0 auto 16px',
            boxShadow: '0 0 0 8px rgba(10,110,189,0.1), 0 0 40px rgba(5,184,204,0.3)',
            animation: isAvatarSpeaking ? 'pulse 1s ease-in-out infinite' : 'none',
          }}>
            {isAvatarSpeaking ? '🗣️' : '👨‍⚕️'}
          </div>
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
            Avatar Doctor - Athena
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Votre assistant médical virtuel - disponible 24/7
          </p>
        </div>

        {/* Main chat area */}
        <div style={{
          background: 'white',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {/* Chat header */}
          <div style={{
            padding: '16px 24px',
            background: 'linear-gradient(135deg, #0D1B2A, #0A3D62)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span style={{ fontSize: '1.5rem' }}>🤖</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                Assistant Athena - Medical Expert
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                En ligne • Prêt à vous assister
              </div>
            </div>
            {isAvatarSpeaking && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                <span className="voice-wave">●</span>
                <span className="voice-wave" style={{ animationDelay: '0.2s' }}>●</span>
                <span className="voice-wave" style={{ animationDelay: '0.4s' }}>●</span>
              </div>
            )}
          </div>

          {/* Messages */}
          <div style={{
            height: '450px',
            overflowY: 'auto',
            padding: '24px',
            background: 'var(--color-surface-0)',
          }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.isUser ? 'flex-end' : 'flex-start',
                  marginBottom: '16px',
                }}
              >
                {!msg.isUser && (
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--gradient-brand)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    marginRight: '12px',
                    flexShrink: 0,
                  }}>
                    👨‍⚕️
                  </div>
                )}
                <div style={{
                  maxWidth: '70%',
                  padding: '12px 18px',
                  borderRadius: msg.isUser 
                    ? '18px 18px 4px 18px' 
                    : '18px 18px 18px 4px',
                  background: msg.isUser 
                    ? 'var(--gradient-brand)' 
                    : 'white',
                  color: msg.isUser ? 'white' : 'var(--color-text-primary)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  border: msg.isUser ? 'none' : '1px solid var(--color-border)',
                }}>
                  {msg.isTyping ? (
                    <span className="typing-dots">...</span>
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {msg.text.split('\n').map((line, i) => (
                        <p key={i} style={{ margin: '4px 0' }}>{line}</p>
                      ))}
                    </div>
                  )}
                </div>
                {msg.isUser && (
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#0A6EBD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    marginLeft: '12px',
                    flexShrink: 0,
                    color: 'white',
                  }}>
                    👤
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick questions */}
          <div style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--color-border)',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface-1)',
          }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInputValue(q)}
                  style={{
                    padding: '6px 14px',
                    background: 'white',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--color-brand-primary)'
                    e.currentTarget.style.background = 'rgba(10,110,189,0.05)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border)'
                    e.currentTarget.style.background = 'white'
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} style={{
            padding: '20px 24px',
            display: 'flex',
            gap: '12px',
            background: 'white',
          }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Posez votre question sur un produit, une pathologie ou un traitement..."
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
                gap: '8px',
              }}
            >
              {isLoading ? '...' : 'Envoyer →'}
            </button>
          </form>
        </div>

        {/* Features footer */}
        <div style={{
          marginTop: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
        }}>
          {[
            { icon: '💊', title: 'Informations produits', desc: 'Fiches détaillées, posologies, indications' },
            { icon: '📋', title: 'Consultations préparées', desc: 'Résumés pour vos rendez-vous' },
            { icon: '🔒', title: 'Données confidentielles', desc: 'Respect du secret médical' },
          ].map((feature, i) => (
            <div key={i} style={{
              padding: '16px',
              background: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{feature.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>
                {feature.title}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{feature.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        .voice-wave {
          animation: wave 1s ease-in-out infinite;
          display: inline-block;
          font-size: 1rem;
        }
        @keyframes wave {
          0%, 100% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        .typing-dots {
          animation: blink 1.4s infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </DashboardLayout>
  )
}