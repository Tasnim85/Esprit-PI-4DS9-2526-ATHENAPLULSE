'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import DashboardLayout from '@/app/components/layout/DashboardLayout'

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageType = 'query' | 'result' | 'error' | 'info'

type Message = {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  type?: MessageType
}

type Product = {
  id: string
  name: string
  brand: string
  form: string
  phase: string
  symptoms: string[]
  score: number
  rank: number
}

type ProductDetails = {
  produit: string
  gamme: string
  indication: string
  posologie: string
  symptoms_spacy_lemmatized: string
  form: string
  phase: string
}

type SearchMode = 'symptom' | 'product'

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const AUTOCOMPLETE_DEBOUNCE_MS = 220
const API_HEALTH_TIMEOUT_MS = 3_500
const SEARCH_TIMEOUT_MS = 12_000
const AUTOCOMPLETE_TIMEOUT_MS = 4_500
const MAX_SUGGESTIONS = 8
const MAX_PRODUCTS = 10
const MAX_SYMPTOM_TAGS = 10

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  text:
    '👋 Bonjour / Hello. Je suis l\'assistant AthenaPulse.\n\n' +
    '✅ Je traite uniquement les demandes liées à la recommandation de produits pharmaceutiques.\n' +
    '✅ I only handle pharmaceutical product recommendations.\n\n' +
    'Choisissez un mode / Choose a mode :\n' +
    '• Symptôme / Symptom — décrivez ce que vous ressentez / describe what you feel\n' +
    '• Produit / Product — recherchez puis sélectionnez un produit / search then select a product',
  isUser: false,
  timestamp: new Date(),
  type: 'info',
}


const OFF_TOPIC_PATTERNS: RegExp[] = [
  /quelle heure|heure est|il est quelle|what time is it|what's the time/i,
  /météo|meteo|weather|forecast/i,
  /blague|joke|raconte.*blague|tell me a joke/i,
  /politique|président|president|élection|election|politics/i,
  /\b(code|bug|erreur|programme|javascript|python|compile|script|programming)\b/i,
  /bourse|bitcoin|crypto|nft|stock market/i,
]

const SYMPTOM_KEYWORDS = [
  // French
  'acné', 'peau', 'sèche', 'grasse', 'rougeur', 'irritation', 'démangeaison',
  'chute', 'cheveux', 'pellicule', 'fatigue', 'stress', 'digestion', 'ballonnement',
  'douleur', 'articulation', 'musculaire', 'jambe', 'lourde', 'vergeture',
  'cicatrice', 'transpiration', 'allergie', 'immunité', 'ménopause', 'migraine',
  'toux', 'rhume', 'gorge', 'nez', 'incontinence', 'insomnie', 'sommeil',
  'anxiété', 'anxiete', 'depression', 'dépression', 'cholestérol', 'cholesterol',
  'poids', 'obésité', 'obesite', 'diabète', 'diabete', 'hypertension',
  // English
  'acne', 'dry skin', 'oily skin', 'redness', 'itching', 'itch',
  'hair loss', 'dandruff', 'fatigue', 'tiredness', 'stress', 'digestion', 'bloating',
  'pain', 'joint pain', 'muscle pain', 'heavy legs', 'stretch marks',
  'scar', 'sweating', 'allergy', 'immunity', 'menopause', 'migraine', 'headache',
  'cough', 'cold', 'throat', 'nose', 'incontinence', 'insomnia', 'sleep',
  'anxiety', 'depression', 'cholesterol', 'weight', 'obesity', 'diabetes',
  'hypertension', 'high blood pressure', 'constipation', 'diarrhea', 'nausea',
  'vomiting', 'fever', 'inflammation', 'swelling', 'acidity', 'heartburn'
]


const SYMPTOM_SUGGESTIONS = [
  // French
  { label: '🩺 Acné', query: 'acné', id: 'acne-fr' },
  { label: '💧 Peau sèche', query: 'peau sèche', id: 'dry-skin-fr' },
  { label: '💇 Chute de cheveux', query: 'chute de cheveux', id: 'hair-loss-fr' },
  { label: '🔥 Rougeurs', query: 'rougeurs', id: 'redness-fr' },
  { label: '😴 Fatigue', query: 'fatigue', id: 'fatigue-fr' },
  { label: '🍽️ Digestion', query: 'digestion', id: 'digestion-fr' },
  { label: '🦵 Jambes lourdes', query: 'jambes lourdes', id: 'heavy-legs-fr' },
  { label: '😰 Stress', query: 'stress', id: 'stress-fr' },
  // English
  { label: '🇬🇧 Acne', query: 'acne', id: 'acne-en' },
  { label: '🇬🇧 Dry skin', query: 'dry skin', id: 'dry-skin-en' },
  { label: '🇬🇧 Hair loss', query: 'hair loss', id: 'hair-loss-en' },
  { label: '🇬🇧 Fatigue', query: 'fatigue', id: 'fatigue-en' },
  { label: '🇬🇧 Joint pain', query: 'joint pain', id: 'joint-pain-en' },
  { label: '🇬🇧 Anxiety', query: 'anxiety', id: 'anxiety-en' },
  { label: '🇬🇧 Insomnia', query: 'insomnia', id: 'insomnia-en' },
  { label: '🇬🇧 Headache', query: 'headache', id: 'headache-en' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

function isMedicalQuery(query: string): boolean {
  const lower = query.toLowerCase().trim()
  if (lower.length < 2) return false
  
  // Greetings in both languages
  const greetings = [
    'bonjour', 'salut', 'cava', 'ca va', 'hello', 'hi', 'hey', 'merci', 'thanks',
    'good morning', 'good afternoon', 'good evening', 'bye', 'goodbye', 'au revoir'
  ]
  for (const g of greetings) {
    if (lower === g || lower === g + 's') return false
  }
  
  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(lower)) return false
  }
  
  return SYMPTOM_KEYWORDS.some(kw => lower.includes(kw))
}

function getRankMeta(rank: number) {
  if (rank === 1) return { label: 'Top recommandation', icon: '🏆', color: '#0A6EBD', bg: '#e8f4f8', border: '#0A6EBD' }
  if (rank === 2) return { label: 'Excellent choix',    icon: '⭐', color: '#16a34a', bg: '#dcfce7', border: '#16a34a' }
  if (rank === 3) return { label: 'Très pertinent',    icon: '✅', color: '#0891b2', bg: '#cffafe', border: '#0891b2' }
  return                { label: 'À considérer',       icon: '📌', color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db' }
}

// ─── Custom hooks ─────────────────────────────────────────────────────────────

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)

const BrainIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.04-4.79A3 3 0 0 1 5 9.5a3 3 0 0 1 .5-1.67 2.5 2.5 0 0 1 4-2.83z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.04-4.79A3 3 0 0 0 19 9.5a3 3 0 0 0-.5-1.67 2.5 2.5 0 0 0-4-2.83z" />
  </svg>
)

const PillIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.5 2 2 14.5a4 4 0 0 0 5.5 5.5L22 9.5a4 4 0 0 0-5.5-5.5Z" />
    <line x1="8.5" y1="15.5" x2="15.5" y2="8.5" />
  </svg>
)

const LayersIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
)

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

// ─── Sub-components ───────────────────────────────────────────────────────────

const TypingIndicator = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
    <div style={avatarStyle}>🤖</div>
    <div style={{ padding: '14px 18px', background: '#f1f5f9', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: '5px', alignItems: 'center' }}>
      {[0, 0.18, 0.36].map((delay, i) => (
        <span key={i} style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#0A6EBD', animation: `apBounce 1.1s ${delay}s infinite ease-in-out` }} />
      ))}
    </div>
  </div>
)

const avatarStyle: React.CSSProperties = {
  width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
  background: 'linear-gradient(135deg, #0A6EBD 0%, #0D1B2A 100%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
}

function ChatMessage({ msg }: { msg: Message }) {
  const isUser = msg.isUser
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '16px', gap: '10px', alignItems: 'flex-end', animation: 'apSlideIn 0.25s ease-out' }}>
      {!isUser && <div style={avatarStyle}>🤖</div>}
      <div style={{
        maxWidth: '78%',
        padding: '12px 16px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser
          ? 'linear-gradient(135deg, #0A6EBD, #0d5fa5)'
          : msg.type === 'error' ? '#fff7ed' : '#f1f5f9',
        color: isUser ? 'white' : msg.type === 'error' ? '#92400e' : '#1e293b',
        fontSize: '0.875rem',
        lineHeight: 1.6,
        whiteSpace: 'pre-line',
        border: msg.type === 'error' ? '1px solid #fed7aa' : 'none',
        boxShadow: isUser ? '0 2px 12px rgba(10,110,189,0.25)' : '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        {msg.text}
      </div>
    </div>
  )
}

// ─── API Layer ────────────────────────────────────────────────────────────────

async function apiHealth(baseUrl: string): Promise<boolean> {
  try {
    await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(API_HEALTH_TIMEOUT_MS) })
    return true
  } catch {
    return false
  }
}

async function apiRecommend(baseUrl: string, query: string): Promise<Product[]> {
  const res = await fetch(`${baseUrl}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, top_k: MAX_PRODUCTS }),
    signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`API Error ${res.status}: ${res.statusText}`)
  const data: { results?: Array<{ produit: string; gamme?: string; form?: string; phase?: string; symptoms?: string; similarity_score?: number }> } = await res.json()
  if (!data.results?.length) return []

  const seen = new Map<string, Product>()
  for (const item of data.results) {
    if (!seen.has(item.produit)) {
      seen.set(item.produit, {
        id: `${item.produit}-${seen.size}`,
        name: item.produit,
        brand: item.gamme || 'VITAL',
        form: item.form || 'Non spécifié',
        phase: item.phase || 'Non spécifiée',
        symptoms: (item.symptoms ?? '').split(', ').map(s => s.trim()).filter(Boolean),
        score: item.similarity_score ?? 0,
        rank: seen.size + 1,
      })
    }
  }
  return Array.from(seen.values())
}

async function apiProductDetails(baseUrl: string, name: string): Promise<ProductDetails | null> {
  try {
    const res = await fetch(`${baseUrl}/products/${encodeURIComponent(name)}`, {
      signal: AbortSignal.timeout(AUTOCOMPLETE_TIMEOUT_MS),
    })
    if (!res.ok) return null
    return await res.json() as ProductDetails
  } catch {
    return null
  }
}

async function apiProductSuggestions(baseUrl: string, query: string): Promise<string[]> {
  try {
    const res = await fetch(`${baseUrl}/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, top_k: MAX_SUGGESTIONS }),
      signal: AbortSignal.timeout(AUTOCOMPLETE_TIMEOUT_MS),
    })
    if (!res.ok) return []
    const data = await res.json()
    if (!data.results?.length) return []
    const seen = new Set<string>()
    const suggestions: string[] = []
    for (const item of data.results) {
      if (!seen.has(item.produit) && item.produit.toLowerCase().includes(query.toLowerCase())) {
        seen.add(item.produit)
        suggestions.push(item.produit)
      }
      if (suggestions.length >= MAX_SUGGESTIONS) break
    }
    return suggestions
  } catch {
    return []
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RecommandationsPage() {
  const [mode, setMode] = useState<SearchMode>('symptom')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounced(query, AUTOCOMPLETE_DEBOUNCE_MS)

  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isApiAvailable, setIsApiAvailable] = useState(true)

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isSuggestLoading, setIsSuggestLoading] = useState(false)
  const [isSuggestOpen, setIsSuggestOpen] = useState(false)
  const [highlightedIdx, setHighlightedIdx] = useState(-1)
  const [selectedProductName, setSelectedProductName] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Health check
  useEffect(() => {
    apiHealth(API_BASE_URL).then(ok => setIsApiAvailable(ok))
  }, [])

  // Autocomplete fetch - only in product mode
  useEffect(() => {
    let cancelled = false
    if (mode !== 'product') {
      setSuggestions([])
      setIsSuggestOpen(false)
      return
    }
    const q = debouncedQuery.trim()
    if (q.length < 2) {
      setSuggestions([])
      setIsSuggestOpen(false)
      return
    }
    setIsSuggestLoading(true)
    apiProductSuggestions(API_BASE_URL, q)
      .then(list => {
        if (cancelled) return
        setSuggestions(list)
        setIsSuggestOpen(list.length > 0)
        setHighlightedIdx(list.length === 1 ? 0 : -1)
      })
      .catch(() => {
        if (!cancelled) { setSuggestions([]); setIsSuggestOpen(false) }
      })
      .finally(() => { if (!cancelled) setIsSuggestLoading(false) })
    return () => { cancelled = true }
  }, [debouncedQuery, mode])

  const addMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, { ...msg, id: generateId(), timestamp: new Date() }])
  }, [])

  const submitQuery = useCallback(async (searchQuery: string) => {
    addMessage({ text: searchQuery, isUser: true, type: 'query' })
    setIsLoading(true)
    setProducts([])
    try {
      const results = await apiRecommend(API_BASE_URL, searchQuery)
      setProducts(results)
      addMessage(
  results.length === 0
    ? {
        text: `❓ Aucun résultat pour "${searchQuery}" / No results for "${searchQuery}".\n\n💡 Essayez / Try:\n• un symptôme plus précis / a more specific symptom\n• un autre nom de produit / another product name`,
        isUser: false,
        type: 'error',
      }
    : {
        text: `🎯 ${results.length} produit(s) trouvé(s) pour "${searchQuery}" / product(s) found for "${searchQuery}". Consultez la liste à droite / Check the list on the right.`,
        isUser: false,
        type: 'result',
      }
)
    } catch (err) {
      console.error('[AthenaPulse] Recommend error:', err)
      addMessage({
        text: '⚠️ Erreur technique. Veuillez réessayer dans quelques secondes.',
        isUser: false,
        type: 'error',
      })
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }, [addMessage])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isApiAvailable || isLoading) return
    const userQuery = query.trim()
    if (!userQuery) return
    setIsSuggestOpen(false)

    if (mode === 'product') {
      if (!selectedProductName) {
        addMessage({ text: userQuery, isUser: true, type: 'query' })
        addMessage({ 
          text: `🤖 En mode Produit, veuillez sélectionner un produit dans la liste de suggestions.\n\n💡 Tapez les premières lettres puis choisissez une suggestion.`, 
          isUser: false, 
          type: 'error' 
        })
        setQuery('')
        return
      }
      setQuery('')
      setSelectedProductName(null)
      await submitQuery(selectedProductName)
      return
    }

    if (!isMedicalQuery(userQuery)) {
  addMessage({ text: userQuery, isUser: true, type: 'query' })
  addMessage({ 
    text: `🤖 Je suis l'assistant AthenaPulse, dédié exclusivement aux recommandations de produits pharmaceutiques.\n\n` +
      `I am AthenaPulse assistant, dedicated exclusively to pharmaceutical product recommendations.\n\n` +
      `Je peux vous aider uniquement avec : / I can only help you with:\n` +
      `• Recherche par symptôme / Symptom search (ex: acné/acne, fatigue, douleur/pain...)\n` +
      `• Recherche par produit / Product search\n\n` +
      `🔍 Décrivez un symptôme médical en français ou en anglais. / Describe a medical symptom in French or English.`, 
    isUser: false, 
    type: 'error' 
  })
  setQuery('')
  return
}

    setQuery('')
    await submitQuery(userQuery)
  }, [isApiAvailable, isLoading, query, mode, selectedProductName, addMessage, submitQuery])

  const handleSuggestionClick = useCallback(async (suggestion: string) => {
    setIsSuggestOpen(false)
    setSelectedProductName(suggestion)
    setQuery('')
    await submitQuery(suggestion)
  }, [submitQuery])

  const handleViewDetails = useCallback(async (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
    setIsLoadingDetails(true)
    setProductDetails(null)
    try {
      const details = await apiProductDetails(API_BASE_URL, product.name)
      setProductDetails(details)
    } catch {
      setProductDetails(null)
    } finally {
      setIsLoadingDetails(false)
    }
  }, [])

  const handleModeSwitch = useCallback((newMode: SearchMode) => {
    setMode(newMode)
    setQuery('')
    setSuggestions([])
    setIsSuggestOpen(false)
    setSelectedProductName(null)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mode !== 'product' || !isSuggestOpen || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Escape') {
      setIsSuggestOpen(false)
    } else if (e.key === 'Enter' && highlightedIdx >= 0) {
      e.preventDefault()
      handleSuggestionClick(suggestions[highlightedIdx])
    }
  }, [mode, isSuggestOpen, suggestions, highlightedIdx, handleSuggestionClick])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedProduct(null)
    setProductDetails(null)
  }, [])

  const inputPlaceholder = mode === 'symptom'
  ? 'Ex : acné, fatigue, douleur / e.g., acne, fatigue, pain…'
  : 'Tapez un nom de produit / Type a product name puis sélectionnez / then select…'

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout role="hcp">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        @keyframes apBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30%            { transform: translateY(-9px); }
        }
        @keyframes apSlideIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes apFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes apScaleIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes apPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(10,110,189,0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(10,110,189,0); }
        }

        .ap-card-hover {
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }
        .ap-card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(10,110,189,0.12) !important;
        }
        .ap-btn-primary {
          transition: opacity 0.15s, transform 0.15s;
        }
        .ap-btn-primary:not(:disabled):hover {
          opacity: 0.92;
          transform: translateY(-1px);
        }
        .ap-suggest-item:hover {
          background: #eff6ff !important;
        }
        .ap-chip:hover {
          background: #dbeafe !important;
          color: #1d4ed8 !important;
        }
        .ap-scrollbar::-webkit-scrollbar { width: 5px; }
        .ap-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .ap-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
        .ap-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        .ap-input:focus {
          border-color: #0A6EBD !important;
          box-shadow: 0 0 0 3px rgba(10,110,189,0.12) !important;
        }

        body { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 4px', fontFamily: "'DM Sans', sans-serif" }}>

        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
            background: 'linear-gradient(135deg, #0A6EBD 0%, #0D1B2A 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(10,110,189,0.35)',
            animation: 'apPulse 3s infinite',
          }}>
            <BrainIcon />
          </div>
          <div>
            <h1 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '1.75rem', fontWeight: 800, margin: 0,
              background: 'linear-gradient(135deg, #0A6EBD 0%, #0D1B2A 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
            }}>
              AthenaPulse Assistant
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '3px 0 0', fontWeight: 400 }}>
              Recommandations pharmaceutiques intelligentes · Symptôme &amp; Produit
            </p>
          </div>
        </header>

        {/* API unavailable banner */}
        {!isApiAvailable && (
          <div style={{
            background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '12px',
            padding: '14px 18px', marginBottom: '18px', display: 'flex', alignItems: 'flex-start', gap: '10px',
          }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
            <div>
              <strong style={{ color: '#92400e', fontSize: '0.875rem' }}>Service temporairement indisponible</strong>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#b45309' }}>
                Vérifiez que l'API FastAPI est démarrée sur <code style={{ background: '#fef3c7', padding: '1px 5px', borderRadius: '4px' }}>{API_BASE_URL}</code>.
              </p>
            </div>
          </div>
        )}

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 460px', gap: '20px' }}>

          {/* ── Left: Chat panel ── */}
          <div style={{
            background: 'white', borderRadius: '18px',
            border: '1px solid #e2e8f0',
            display: 'flex', flexDirection: 'column',
            height: 'calc(100vh - 215px)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}>

            {/* Chat messages */}
            <div className="ap-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px' }}>
              {messages.map((msg) => <ChatMessage key={msg.id} msg={msg} />)}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Mode toggle + quick suggestions */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid #f1f5f9' }}>
              {/* Mode row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Mode de recherche
                </span>
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '3px' }}>
                  {(['symptom', 'product'] as SearchMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleModeSwitch(m)}
                      style={{
                        padding: '5px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                        fontSize: '0.75rem', fontWeight: 600,
                        background: mode === m ? 'white' : 'transparent',
                        color: mode === m ? '#0A6EBD' : '#64748b',
                        boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.15s',
                      }}
                    >
                      {m === 'symptom' ? '🩺 Symptôme' : '💊 Produit'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick chips (symptom mode only) */}
              {mode === 'symptom' && (
  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
    {SYMPTOM_SUGGESTIONS.map(({ label, query: q, id }) => (
      <button
        key={id}  // Use unique id instead of q
        type="button"
        className="ap-chip"
        onClick={() => { setQuery(q); inputRef.current?.focus() }}
        style={{
          padding: '5px 12px', background: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: '999px', fontSize: '0.72rem', cursor: 'pointer',
          color: '#2563eb', fontWeight: 500, transition: 'all 0.15s',
        }}
      >
        {label}
      </button>
    ))}
  </div>
)}
              
              {mode === 'product' && (
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.4, background: '#f8fafc', padding: '6px 10px', borderRadius: '8px' }}>
                  💡 Tapez un nom de produit puis <strong>sélectionnez une suggestion</strong> dans la liste.
                </p>
              )}
            </div>

            {/* Input form */}
            <form
              onSubmit={handleSubmit}
              style={{ padding: '14px 18px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px', position: 'relative' }}
            >
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                  <SearchIcon />
                </div>
                <input
                  ref={inputRef}
                  className="ap-input"
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    if (mode === 'product') { 
                      setIsSuggestOpen(true)
                      setSelectedProductName(null)
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  onBlur={() => setTimeout(() => setIsSuggestOpen(false), 150)}
                  onFocus={() => { if (mode === 'product' && suggestions.length > 0) setIsSuggestOpen(true) }}
                  placeholder={inputPlaceholder}
                  disabled={!isApiAvailable}
                  autoComplete="off"
                  spellCheck={false}
                  style={{
                    width: '100%', padding: '11px 14px 11px 36px',
                    border: '1px solid #e2e8f0', borderRadius: '11px',
                    fontSize: '0.875rem', outline: 'none',
                    color: '#1e293b', background: isApiAvailable ? 'white' : '#f8fafc',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                />

                {/* Autocomplete dropdown - only in product mode */}
                {mode === 'product' && isSuggestOpen && (isSuggestLoading || suggestions.length > 0) && (
                  <div
                    ref={suggestContainerRef}
                    role="listbox"
                    style={{
                      position: 'absolute', left: 0, right: 0, bottom: 'calc(100% + 6px)',
                      background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 100,
                      animation: 'apFadeIn 0.15s ease-out',
                    }}
                  >
                    {isSuggestLoading ? (
                      <div style={{ padding: '11px 14px', fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0A6EBD', display: 'inline-block', animation: 'apBounce 1s infinite' }} />
                        Recherche de produits…
                      </div>
                    ) : (
                      suggestions.map((s, idx) => (
                        <button
                          key={s}
                          role="option"
                          aria-selected={idx === highlightedIdx}
                          className="ap-suggest-item"
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSuggestionClick(s)}
                          onMouseEnter={() => setHighlightedIdx(idx)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            width: '100%', textAlign: 'left', padding: '10px 14px',
                            border: 'none', background: idx === highlightedIdx ? '#eff6ff' : 'white',
                            color: '#1e293b', cursor: 'pointer', fontSize: '0.85rem',
                            borderBottom: idx < suggestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                            transition: 'background 0.1s',
                          }}
                        >
                          <PillIcon />
                          <span style={{ fontWeight: idx === highlightedIdx ? 600 : 400 }}>{s}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="ap-btn-primary"
                disabled={isLoading || !query.trim() || !isApiAvailable || (mode === 'product' && !selectedProductName && suggestions.length > 0 && !suggestions.some(s => s.toLowerCase() === query.trim().toLowerCase()))}
                style={{
                  padding: '0 22px',
                  background: 'linear-gradient(135deg, #0A6EBD 0%, #0D1B2A 100%)',
                  border: 'none', borderRadius: '11px', color: 'white',
                  fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '7px',
                  opacity: isLoading || !query.trim() || !isApiAvailable ? 0.5 : 1,
                  boxShadow: '0 2px 8px rgba(10,110,189,0.3)',
                  transition: 'opacity 0.15s, transform 0.15s, box-shadow 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                Envoyer <SendIcon />
              </button>
            </form>
          </div>

          {/* ── Right: Results panel ── */}
          <div style={{
            background: 'white', borderRadius: '18px',
            border: '1px solid #e2e8f0',
            height: 'calc(100vh - 215px)',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}>
            {/* Panel header */}
            <div style={{
              padding: '14px 18px',
              background: 'linear-gradient(135deg, #0A6EBD 0%, #0D1B2A 100%)',
              color: 'white',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '0.95rem', fontWeight: 700, margin: 0, letterSpacing: '-0.2px' }}>
                  Recommandations AthenaPulse
                </h3>
                <span style={{
                  background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '999px',
                  fontSize: '0.7rem', fontWeight: 600, backdropFilter: 'blur(4px)',
                }}>
                  {products.length} produit{products.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p style={{ fontSize: '0.7rem', opacity: 0.7, margin: '3px 0 0', fontWeight: 400 }}>
                Sélectionnez un résultat pour voir ses détails
              </p>
            </div>

            {/* Product list */}
            <div className="ap-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
              {products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', animation: 'apFadeIn 0.3s ease-out' }}>
                  <div style={{ fontSize: '52px', marginBottom: '14px', opacity: 0.35 }}>💊</div>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>Aucune recommandation</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '8px' }}>
                    Choisissez un mode puis lancez une recherche.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {products.map((product) => {
                    const meta = getRankMeta(product.rank)
                    return (
                      <div
                        key={product.id}
                        className="ap-card-hover"
                        style={{
                          padding: '16px', borderRadius: '14px',
                          border: product.rank === 1 ? `2px solid ${meta.border}` : '1px solid #e2e8f0',
                          background: product.rank === 1 ? '#f0f9ff' : 'white',
                          animation: 'apFadeIn 0.3s ease-out',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Rank badge */}
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          background: meta.bg, padding: '3px 10px', borderRadius: '999px',
                          marginBottom: '10px',
                        }}>
                          <span style={{ fontSize: '0.7rem' }}>{meta.icon}</span>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            {meta.label}
                          </span>
                        </div>

                        {/* Product name */}
                        <h4 style={{
                          fontFamily: "'Syne', sans-serif",
                          fontSize: '1rem', fontWeight: 700, color: '#0A6EBD',
                          margin: '0 0 10px', letterSpacing: '-0.2px',
                        }}>
                          {product.name}
                        </h4>

                        {/* Form / Phase */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                          {[
                            { icon: <PillIcon />, label: 'Forme', value: product.form },
                            { icon: <LayersIcon />, label: 'Phase', value: product.phase.replace('Phase ', 'P') },
                          ].map(({ icon, label, value }) => (
                            <div key={label} style={{
                              flex: 1, display: 'flex', alignItems: 'center', gap: '7px',
                              background: '#f8fafc', borderRadius: '9px', padding: '8px 10px',
                            }}>
                              <span style={{ color: '#64748b' }}>{icon}</span>
                              <div>
                                <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
                                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e293b', marginTop: '1px' }}>{value}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Symptom tags */}
                        {product.symptoms.length > 0 && (
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                              Indications
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                              {product.symptoms.slice(0, MAX_SYMPTOM_TAGS).map((sym, i) => (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: '0.68rem', padding: '3px 9px',
                                    background: '#eff6ff', border: '1px solid #bfdbfe',
                                    borderRadius: '999px', color: '#2563eb', fontWeight: 500,
                                  }}
                                >
                                  {sym}
                                </span>
                              ))}
                              {product.symptoms.length > MAX_SYMPTOM_TAGS && (
                                <span style={{ fontSize: '0.68rem', padding: '3px 9px', background: '#f1f5f9', borderRadius: '999px', color: '#64748b' }}>
                                  +{product.symptoms.length - MAX_SYMPTOM_TAGS}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleViewDetails(product)}
                            style={{
                              flex: 1, padding: '8px 0',
                              background: 'white', border: '1px solid #e2e8f0',
                              borderRadius: '8px', color: '#0A6EBD',
                              fontSize: '0.73rem', fontWeight: 600, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                              transition: 'border-color 0.15s, background 0.15s',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#eff6ff'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#93c5fd' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0' }}
                          >
                            📄 Fiche détaillée
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Product Details Modal ── */}
      {isModalOpen && selectedProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Fiche produit : ${selectedProduct.name}`}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            animation: 'apFadeIn 0.2s ease-out',
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: 'white', borderRadius: '20px',
              maxWidth: '580px', width: 'calc(100% - 32px)',
              maxHeight: '85vh', overflow: 'auto',
              animation: 'apScaleIn 0.2s ease-out',
              boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{
              padding: '18px 22px',
              background: 'linear-gradient(135deg, #0A6EBD 0%, #0D1B2A 100%)',
              borderRadius: '20px 20px 0 0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
              <div>
                <p style={{ margin: '0 0 3px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                  Fiche produit
                </p>
                <h3 style={{ fontFamily: "'Syne', sans-serif", margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'white', letterSpacing: '-0.3px' }}>
                  {selectedProduct.name}
                </h3>
              </div>
              <button
                onClick={closeModal}
                aria-label="Fermer"
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'white', display: 'flex', transition: 'background 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.25)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)' }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '22px' }}>
              {isLoadingDetails ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '16px' }}>
                    {[0, 0.18, 0.36].map((d, i) => (
                      <span key={i} style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#0A6EBD', display: 'inline-block', animation: `apBounce 1.1s ${d}s infinite` }} />
                    ))}
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>Chargement des détails…</p>
                </div>
              ) : productDetails ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <section>
                    <h4 style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700, margin: '0 0 6px' }}>
                      Indication thérapeutique
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.6, margin: 0 }}>
                      {productDetails.indication || 'Information non disponible.'}
                    </p>
                  </section>

                  <div style={{ height: '1px', background: '#f1f5f9' }} />

                  <section>
                    <h4 style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700, margin: '0 0 6px' }}>
                      Posologie recommandée
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.6, margin: 0 }}>
                      {productDetails.posologie || 'Selon prescription médicale.'}
                    </p>
                  </section>

                  <div style={{ height: '1px', background: '#f1f5f9' }} />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    {[
                      { label: 'Forme galénique', value: productDetails.form || selectedProduct.form },
                      { label: 'Phase', value: productDetails.phase || selectedProduct.phase },
                      { label: 'Laboratoire', value: productDetails.gamme || selectedProduct.brand },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>{label}</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0A6EBD' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <section>
                    <h4 style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700, margin: '0 0 6px' }}>
                      Indication thérapeutique
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.6, margin: 0 }}>
                      {selectedProduct.symptoms.length > 0 
                        ? `Traitement indiqué pour : ${selectedProduct.symptoms.join(', ')}`
                        : 'Information non disponible.'}
                    </p>
                  </section>

                  <div style={{ height: '1px', background: '#f1f5f9' }} />

                  <section>
                    <h4 style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700, margin: '0 0 6px' }}>
                      Posologie recommandée
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.6, margin: 0 }}>
                      Selon prescription médicale. Consultez votre médecin ou pharmacien.
                    </p>
                  </section>

                  <div style={{ height: '1px', background: '#f1f5f9' }} />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    {[
                      { label: 'Forme galénique', value: selectedProduct.form },
                      { label: 'Phase', value: selectedProduct.phase },
                      { label: 'Laboratoire', value: selectedProduct.brand },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>{label}</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0A6EBD' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedProduct.symptoms.length > 0 && (
                    <>
                      <div style={{ height: '1px', background: '#f1f5f9' }} />
                      <section>
                        <h4 style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700, margin: '0 0 6px' }}>
                          Symptômes associés
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {selectedProduct.symptoms.map((sym, i) => (
                            <span key={i} style={{ fontSize: '0.75rem', padding: '4px 12px', background: '#eff6ff', borderRadius: '20px', color: '#2563eb' }}>
                              {sym}
                            </span>
                          ))}
                        </div>
                      </section>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div style={{ padding: '14px 22px 18px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  flex: 1, padding: '10px',
                  background: 'white', border: '1px solid #e2e8f0',
                  borderRadius: '10px', color: '#64748b',
                  fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}