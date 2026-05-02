'use client'

import { useState, useRef, useEffect } from 'react'
import DashboardLayout from '@/app/components/layout/DashboardLayout'

type Level = 'debutant' | 'intermediaire' | 'avance' | 'expert'
type Categorie = 'pharmacien' | 'parapharmacien' | 'medecin'
type SpecialiteMedecin = 'cardiologue' | 'neurologue' | 'generaliste' | 'pediatre' | 'dermatologue' | 'gynecologue' | 'rhumatologue'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface Evaluation {
  score: number
  feedback: string[]
  strengths: string[]
  improvements: string[]
  recommendations: string[]
}

const levels: { value: Level; label: string; color: string; description: string }[] = [
  { value: 'debutant', label: 'Debutant', color: '#16A34A', description: 'Decouverte des produits et argumentaires de base' },
  { value: 'intermediaire', label: 'Intermédiaire', color: '#0A6EBD', description: 'Maîtrise des arguments clés' },
  { value: 'avance', label: 'Avancé', color: '#F2A516', description: 'Gestion des objections complexes' },
  { value: 'expert', label: 'Expert', color: '#DC2626', description: 'Simulations réalistes avancées' },
]

const categories: { value: Categorie; label: string; description: string }[] = [
  { value: 'pharmacien', label: 'Pharmacien', description: 'Professionnel en pharmacie d\'officine' },
  { value: 'parapharmacien', label: 'Parapharmacien', description: 'Conseiller en parapharmacie' },
  { value: 'medecin', label: 'Médecin', description: 'Professionnel de santé médical' },
]

const specialitesMedecin: { value: SpecialiteMedecin; label: string; description: string }[] = [
  { value: 'cardiologue', label: 'Cardiologue', description: 'Spécialiste du système cardiovasculaire' },
  { value: 'neurologue', label: 'Neurologue', description: 'Spécialiste du système nerveux' },
  { value: 'generaliste', label: 'Médecin Généraliste', description: 'Médecine générale' },
  { value: 'pediatre', label: 'Pédiatre', description: 'Spécialiste des enfants' },
  { value: 'dermatologue', label: 'Dermatologue', description: 'Spécialiste de la peau' },
  { value: 'gynecologue', label: 'Gynécologue', description: 'Spécialiste de la femme' },
  { value: 'rhumatologue', label: 'Rhumatologue', description: 'Spécialiste des articulations' },
]

// Icônes SVG
const Icons = {
  doctor: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  pharmacie: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="6" width="16" height="12" rx="2"></rect>
      <path d="M12 9v6"></path>
      <path d="M9 12h6"></path>
    </svg>
  ),
  parapharmacie: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2 2 14.5a4 4 0 0 0 5.5 5.5L22 9.5a4 4 0 0 0-5.5-5.5Z"></path>
      <path d="M9 12 12 9"></path>
    </svg>
  ),
  send: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  ),
  book: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>
  ),
}

// Scénarios de simulation
const scenarios: Record<string, Record<Level, { doctorName: string; context: string; questions: string[] }>> = {
  pharmacien: {
    debutant: {
      doctorName: 'Pharmacien Dupont',
      context: 'M. Dupont, pharmacien en officine, veut connaître les produits qu\'il peut recommander à ses clients.',
      questions: [
        'Pour quel type de clients ce produit est-il adapté ?',
        'Quel est le prix ?',
        'Y a-t-il des promotions ?'
      ]
    },
    intermediaire: {
      doctorName: 'Pharmacien Petit',
      context: 'M. Petit a une clientèle âgée. Il veut des produits bien tolérés.',
      questions: [
        'Quels sont les effets secondaires fréquents ?',
        'Peut-on l\'associer à d\'autres médicaments ?',
        'Quelle est la durée de traitement recommandée ?'
      ]
    },
    avance: {
      doctorName: 'Pharmacien Roux',
      context: 'M. Roux gère une grande pharmacie. Il a besoin d\'arguments de vente pour ses conseillers.',
      questions: [
        'Quels sont les 3 arguments de vente principaux ?',
        'Comment le positionner face à la concurrence ?',
        'Avez-vous des supports pour nos conseillers ?'
      ]
    },
    expert: {
      doctorName: 'Pharmacien Lambert',
      context: 'M. Lambert est un pharmacien très technique. Il veut tous les détails scientifiques.',
      questions: [
        'Quelle est la stabilité du produit dans le temps ?',
        'Avez-vous des études de bioéquivalence ?',
        'Comment se passe le stockage ?'
      ]
    }
  },
  parapharmacien: {
    debutant: {
      doctorName: 'Conseillère Sophie',
      context: 'Sophie, conseillère en parapharmacie, veut des produits naturels et bien tolérés.',
      questions: [
        'Ce produit est-il naturel ?',
        'Convient-il aux peaux sensibles ?',
        'Quel est le prix ?'
      ]
    },
    intermediaire: {
      doctorName: 'Conseillère Emma',
      context: 'Emma cherche des produits pour sa clientèle exigeante.',
      questions: [
        'Quels sont les ingrédients clés ?',
        'Combien de temps avant de voir les résultats ?',
        'Y a-t-il des garanties ?'
      ]
    },
    avance: {
      doctorName: 'Conseillère Laura',
      context: 'Laura est une experte en parapharmacie. Elle veut une formation pour son équipe.',
      questions: [
        'Pouvez-vous nous former sur ce produit ?',
        'Avez-vous des études cliniques ?',
        'Comment se différencie-t-il des autres ?'
      ]
    },
    expert: {
      doctorName: 'Pharmacien Nicolas',
      context: 'Nicolas est responsable du rayon parapharmacie. Il veut des arguments techniques.',
      questions: [
        'Quel est le pourcentage d\'ingrédients actifs ?',
        'Quelle est la stabilité du principe actif ?',
        'Avez-vous des études dermatologiques ?'
      ]
    }
  },
  cardiologue: {
    debutant: {
      doctorName: 'Dr. Martin',
      context: 'Vous rencontrez le Dr. Martin, cardiologue dans un CHU. Il prescrit déjà des antihypertenseurs mais cherche une alternative plus efficace avec moins d\'effets secondaires.',
      questions: [
        'Bonjour Docteur, je vous présente Cardio-X, notre nouvel antihypertenseur',
        'Quels sont les avantages par rapport aux traitements existants ?',
        'Quel est le profil de sécurité ?'
      ]
    },
    intermediaire: {
      doctorName: 'Dr. Laurent',
      context: 'Le Dr. Laurent est un cardiologue exigeant. Il utilise déjà des IEC mais n\'est pas satisfait des effets secondaires.',
      questions: [
        'Votre produit est-il remboursé ?',
        'Quelle est l\'étude clinique phare ?',
        'Comparé au traitement standard, quels sont les avantages ?'
      ]
    },
    avance: {
      doctorName: 'Pr. Dubois',
      context: 'Le Professeur Dubois est un leader d\'opinion. Il est très occupé et n\'a que 5 minutes pour vous écouter. Il connaît déjà la molécule.',
      questions: [
        'Donnez-moi un argument différenciant en 30 secondes',
        'Quels sont les résultats sur la mortalité cardiovasculaire ?',
        'Pourquoi choisir votre produit plutôt que le générique ?'
      ]
    },
    expert: {
      doctorName: 'Dr. Chen',
      context: 'Le Dr. Chen est un cardiologue chercheur. Elle a lu toutes les publications et veut tester votre expertise sur les détails du mécanisme d\'action.',
      questions: [
        'Parlez-moi de l\'affinité du récepteur AT1',
        'Quelle est la demi-vie du produit ?',
        'Y a-t-il des interactions avec les anticoagulants ?'
      ]
    }
  },
  neurologue: {
    debutant: {
      doctorName: 'Dr. Bernard',
      context: 'Le Dr. Bernard, neurologue, traite des patients souffrant de neuropathies. Il utilise des compléments alimentaires classiques.',
      questions: [
        'Quels sont les bienfaits de Neuro-B Plus ?',
        'Combien de temps avant de voir des résultats ?',
        'Y a-t-il des contre-indications ?'
      ]
    },
    intermediaire: {
      doctorName: 'Dr. Fontaine',
      context: 'Le Dr. Fontaine est spécialisé dans les neuropathies diabétiques. Il a besoin de preuves solides.',
      questions: [
        'Avez-vous des études sur les neuropathies diabétiques ?',
        'Quel est le dosage recommandé ?',
        'Le produit est-il bien toléré ?'
      ]
    },
    avance: {
      doctorName: 'Pr. Moreau',
      context: 'Le Professeur Moreau est un neurologue reconnu. Il est intéressé par l\'approche multimodale.',
      questions: [
        'Quel est le mécanisme synergique des composants ?',
        'Quelle est la biodisponibilité comparée aux autres formes ?',
        'Peut-on l\'associer à d\'autres traitements ?'
      ]
    },
    expert: {
      doctorName: 'Dr. Kone',
      context: 'Le Dr. Kone est une neurologue chercheuse. Elle veut tester votre connaissance approfondie du produit.',
      questions: [
        'Parlez-moi de l\'absorption intestinale des composants',
        'Quelle est la preuve du passage de la barrière hémato-encéphalique ?',
        'Avez-vous des données à long terme ?'
      ]
    }
  },
  generaliste: {
    debutant: {
      doctorName: 'Dr. Robert',
      context: 'Le Dr. Robert est un généraliste de campagne. Il reçoit beaucoup de patients hypertendus.',
      questions: [
        'En quoi votre produit est différent ?',
        'Est-ce que c\'est bien remboursé ?',
        'Comment ça se prend ?'
      ]
    },
    intermediaire: {
      doctorName: 'Dr. Marchand',
      context: 'Le Dr. Marchand est un généraliste exigeant. Il veut des arguments solides.',
      questions: [
        'Quelles études appuient votre produit ?',
        'Quel est le profil de tolérance ?',
        'Peut-on l\'utiliser en première intention ?'
      ]
    },
    avance: {
      doctorName: 'Dr. Weber',
      context: 'Le Dr. Weber est un généraliste prescripteur influent. Il veut des données concrètes.',
      questions: [
        'Quelle est la réduction moyenne constatée ?',
        'Quels patients sont les meilleurs candidats ?',
        'Comment gérez-vous les non-répondeurs ?'
      ]
    },
    expert: {
      doctorName: 'Dr. Petit',
      context: 'Le Dr. Petit est un généraliste chercheur. Il veut des détails très précis.',
      questions: [
        'Parlez-moi de la pharmacocinétique',
        'Avez-vous des données en vie réelle ?',
        'Quelle est la place dans les recommandations ?'
      ]
    }
  },
  pediatre: {
    debutant: {
      doctorName: 'Dr. Simon',
      context: 'Le Dr. Simon, pédiatre, cherche des solutions adaptées aux enfants.',
      questions: [
        'Ce produit est-il adapté aux enfants ?',
        'Quel est le dosage pédiatrique ?',
        'Y a-t-il des effets secondaires spécifiques ?'
      ]
    },
    intermediaire: {
      doctorName: 'Dr. Laurent',
      context: 'Le Dr. Laurent soigne beaucoup d\'enfants allergiques.',
      questions: [
        'Peut-on l\'utiliser chez les enfants asthmatiques ?',
        'Quelle est la forme la plus adaptée ?',
        'Le goût est-il acceptable ?'
      ]
    },
    avance: {
      doctorName: 'Pr. Garnier',
      context: 'Le Professeur Garnier est un pédiatre hospitalier reconnu.',
      questions: [
        'Avez-vous des études pédiatriques ?',
        'Comment ajuster la dose selon le poids ?',
        'Y a-t-il des interactions avec les vaccins ?'
      ]
    },
    expert: {
      doctorName: 'Dr. Fontaine',
      context: 'Le Dr. Fontaine est pédiatre chercheur en néonatalogie.',
      questions: [
        'Quelle est la sécurité chez le nouveau-né ?',
        'Avez-vous des données de pharmacovigilance pédiatrique ?',
        'Comment se fait la métabolisation chez l\'enfant ?'
      ]
    }
  },
  dermatologue: {
    debutant: {
      doctorName: 'Dr. Roche',
      context: 'Le Dr. Roche, dermatologue, cherche des traitements topiques efficaces.',
      questions: [
        'Quelle est la texture du produit ?',
        'Convient-il aux peaux sensibles ?',
        'Combien de temps avant les premiers résultats ?'
      ]
    },
    intermediaire: {
      doctorName: 'Dr. Bernard',
      context: 'Le Dr. Bernard traite beaucoup d\'acné sévère.',
      questions: [
        'Y a-t-il un risque d\'irritation ?',
        'Peut-on l\'associer à d\'autres traitements ?',
        'Quelle est la galénique ?'
      ]
    },
    avance: {
      doctorName: 'Pr. Lemarchand',
      context: 'Le Professeur Lemarchand est dermatologue dans un CHU.',
      questions: [
        'Avez-vous des études sur l\'efficacité à long terme ?',
        'Quel est le mécanisme d\'action sur la peau ?',
        'Comment se compare-t-il aux traitements de référence ?'
      ]
    },
    expert: {
      doctorName: 'Dr. Weiss',
      context: 'Le Dr. Weiss est dermatologue chercheur en immunologie cutanée.',
      questions: [
        'Quel est l\'impact sur le microbiome cutané ?',
        'Avez-vous des données de pénétration cutanée ?',
        'Quelle est la stabilité de la formule ?'
      ]
    }
  },
  gynecologue: {
    debutant: {
      doctorName: 'Dr. Moreau',
      context: 'Le Dr. Moreau, gynécologue, s\'intéresse à vos produits pour ses patientes.',
      questions: [
        'Ce produit est-il adapté à la femme enceinte ?',
        'Quels sont les bénéfices pour mes patientes ?',
        'Y a-t-il des contre-indications ?'
      ]
    },
    intermediaire: {
      doctorName: 'Dr. Lefevre',
      context: 'Le Dr. Lefevre a une clientèle de femmes ménopausées.',
      questions: [
        'Peut-on l\'utiliser pendant la grossesse ?',
        'Quelle est la sécurité d\'emploi à long terme ?',
        'Y a-t-il des interactions avec les traitements hormonaux ?'
      ]
    },
    avance: {
      doctorName: 'Pr. Dubois',
      context: 'Le Professeur Dubois est gynécologue médical réputé.',
      questions: [
        'Avez-vous des études spécifiques aux femmes ?',
        'Comment se positionne votre produit face aux alternatives ?',
        'Quel est le rapport bénéfice/risque ?'
      ]
    },
    expert: {
      doctorName: 'Dr. Meunier',
      context: 'Le Dr. Meunier est chercheur en gynécologie endocrinienne.',
      questions: [
        'Quel est l\'impact sur le cycle hormonal ?',
        'Avez-vous des données en fertilité ?',
        'Comment se fait le métabolisme hépatique ?'
      ]
    }
  },
  rhumatologue: {
    debutant: {
      doctorName: 'Dr. Leroy',
      context: 'Le Dr. Leroy, rhumatologue, traite des patients souffrant de douleurs chroniques.',
      questions: [
        'Quel est le mécanisme d\'action antalgique ?',
        'Quelle est la posologie recommandée ?',
        'Le produit est-il bien toléré ?'
      ]
    },
    intermediaire: {
      doctorName: 'Dr. Martin',
      context: 'Le Dr. Martin a une clientèle de patients arthrosiques.',
      questions: [
        'Quelle est l\'efficacité sur la douleur ?',
        'Peut-on l\'associer aux AINS ?',
        'Quand commence-t-on à voir les effets ?'
      ]
    },
    avance: {
      doctorName: 'Pr. Rousseau',
      context: 'Le Professeur Rousseau est rhumatologue hospitalier.',
      questions: [
        'Avez-vous des études sur la polyarthrite rhumatoïde ?',
        'Comment agit-il sur l\'inflammation ?',
        'Quelle est la place de votre produit dans la stratégie thérapeutique ?'
      ]
    },
    expert: {
      doctorName: 'Dr. Girard',
      context: 'Le Dr. Girard est chercheur en rhumatologie clinique.',
      questions: [
        'Quelle est l\'action sur les cytokines ?',
        'Avez-vous des données d\'imagerie ?',
        'Quelle est la preuve de l\'effet structural ?'
      ]
    }
  }
}

export default function EntrainementPage() {
  const [step, setStep] = useState<'config' | 'consultation' | 'evaluation'>('config')
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Categorie | null>(null)
  const [selectedSpecialite, setSelectedSpecialite] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getScenarioKey = (): string => {
    if (selectedCategory === 'pharmacien') return 'pharmacien'
    if (selectedCategory === 'parapharmacien') return 'parapharmacien'
    if (selectedCategory === 'medecin' && selectedSpecialite) return selectedSpecialite
    return 'generaliste'
  }

  const startConsultation = () => {
    if (!selectedLevel || !selectedCategory) return
    if (selectedCategory === 'medecin' && !selectedSpecialite) return

    const scenarioKey = getScenarioKey()
    const scenario = scenarios[scenarioKey][selectedLevel]
    
    setMessages([
      {
        id: '1',
        text: `${scenario.doctorName} : "${scenario.context}"\n\nLe docteur vous accueille dans son cabinet. Comment souhaitez-vous commencer ?`,
        isUser: false,
        timestamp: new Date(),
      }
    ])
    setStep('consultation')
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
    setInputValue('')
    setIsLoading(true)

    await new Promise(resolve => setTimeout(resolve, 1500))

    const scenarioKey = getScenarioKey()
    const scenario = scenarios[scenarioKey][selectedLevel!]
    const currentQuestion = scenario.questions[currentQuestionIndex]
    const isLastQuestion = currentQuestionIndex >= scenario.questions.length - 1

    let doctorResponse = ''
    
    if (!isLastQuestion) {
      doctorResponse = `${scenario.doctorName} : "${currentQuestion}"\n\nLe docteur attend votre réponse...`
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      doctorResponse = `${scenario.doctorName} : "Merci pour cet échange. Je vais analyser nos interactions et vous faire un retour détaillé."\n\nLa consultation est terminée. Génération de l'évaluation...`
      
      const evaluationResult = await generateEvaluation(inputValue, selectedLevel!)
      setEvaluation(evaluationResult)
      setStep('evaluation')
    }

    const doctorMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: doctorResponse,
      isUser: false,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, doctorMessage])
    setIsLoading(false)
  }

  const generateEvaluation = async (lastAnswer: string, level: Level): Promise<Evaluation> => {
    await new Promise(resolve => setTimeout(resolve, 1000))

    const levelScore = {
      debutant: { min: 40, max: 70 },
      intermediaire: { min: 55, max: 80 },
      avance: { min: 65, max: 90 },
      expert: { min: 75, max: 95 },
    }

    const baseScore = Math.floor(Math.random() * (levelScore[level].max - levelScore[level].min + 1) + levelScore[level].min)
    
    return {
      score: baseScore,
      feedback: [
        'Vous avez montré une bonne compréhension du produit',
        'Votre écoute active était satisfaisante',
        'Vous avez su répondre aux objections principales',
      ],
      strengths: [
        'Maîtrise des informations clés du produit',
        'Communication claire et professionnelle',
        'Capacité à reformuler les besoins du médecin',
      ],
      improvements: [
        baseScore < 70 ? 'Approfondir la connaissance des études cliniques' : null,
        baseScore < 75 ? 'Travailler la gestion des objections complexes' : null,
        baseScore < 80 ? 'Pratiquer la conclusion de l\'entretien' : null,
      ].filter(Boolean) as string[],
      recommendations: [
        'Revoir la fiche produit en détail',
        'Pratiquer des simulations supplémentaires',
        baseScore < 70 ? 'Consulter les ressources de formation avancée' : 'Préparer un argumentaire différenciant',
      ].filter(Boolean) as string[],
    }
  }

  const restartTraining = () => {
    setStep('config')
    setSelectedLevel(null)
    setSelectedCategory(null)
    setSelectedSpecialite(null)
    setMessages([])
    setEvaluation(null)
    setCurrentQuestionIndex(0)
  }

  return (
    <DashboardLayout role="delegue">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
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
            Simulation d'entretien médical
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Entraînez-vous avec des professionnels de santé virtuels et améliorez vos compétences commerciales
          </p>
        </div>

        {/* Step 1: Configuration */}
        {step === 'config' && (
          <div>
            {/* Level selection */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>
                Niveau de difficulté
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {levels.map(level => (
                  <button
                    key={level.value}
                    onClick={() => setSelectedLevel(level.value)}
                    style={{
                      padding: '20px',
                      background: selectedLevel === level.value ? `${level.color}15` : 'white',
                      border: `2px solid ${selectedLevel === level.value ? level.color : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-lg)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: 700, 
                      color: selectedLevel === level.value ? level.color : 'var(--color-text-primary)',
                      marginBottom: '8px'
                    }}>
                      {level.label}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {level.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Category selection */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>
                Catégorie du professionnel
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {categories.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => {
                      setSelectedCategory(cat.value)
                      setSelectedSpecialite(null)
                    }}
                    style={{
                      padding: '20px',
                      background: selectedCategory === cat.value ? 'rgba(10,110,189,0.05)' : 'white',
                      border: `2px solid ${selectedCategory === cat.value ? 'var(--color-brand-primary)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-lg)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                      {cat.value === 'pharmacien' && Icons.pharmacie}
                      {cat.value === 'parapharmacien' && Icons.parapharmacie}
                      {cat.value === 'medecin' && Icons.doctor}
                    </div>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{cat.label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{cat.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Specialite selection (only for medecin) */}
            {selectedCategory === 'medecin' && (
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>
                  Spécialité médicale
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  {specialitesMedecin.map(spec => (
                    <button
                      key={spec.value}
                      onClick={() => setSelectedSpecialite(spec.value)}
                      style={{
                        padding: '16px',
                        background: selectedSpecialite === spec.value ? 'rgba(10,110,189,0.05)' : 'white',
                        border: `2px solid ${selectedSpecialite === spec.value ? 'var(--color-brand-primary)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>{spec.label}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{spec.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Start button */}
            <button
              onClick={startConsultation}
              disabled={!selectedLevel || !selectedCategory || (selectedCategory === 'medecin' && !selectedSpecialite)}
              style={{
                width: '100%',
                padding: '16px',
                background: (!selectedLevel || !selectedCategory || (selectedCategory === 'medecin' && !selectedSpecialite)) ? 'var(--color-surface-3)' : 'var(--gradient-brand)',
                color: (!selectedLevel || !selectedCategory || (selectedCategory === 'medecin' && !selectedSpecialite)) ? 'var(--color-text-muted)' : 'white',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: (!selectedLevel || !selectedCategory || (selectedCategory === 'medecin' && !selectedSpecialite)) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Démarrer la simulation
            </button>
          </div>
        )}

        {/* Step 2: Consultation - À implémenter avec les mêmes modifications (suppression emojis) */}
        {step === 'consultation' && (
          <div style={{
            background: 'white',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 24px',
              background: 'linear-gradient(135deg, #0D1B2A, #0A3D62)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selectedCategory === 'pharmacien' && Icons.pharmacie}
                {selectedCategory === 'parapharmacien' && Icons.parapharmacie}
                {selectedCategory === 'medecin' && Icons.doctor}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                  Simulation avec {selectedCategory === 'medecin' ? specialitesMedecin.find(s => s.value === selectedSpecialite)?.label || 'Médecin' : selectedCategory === 'pharmacien' ? 'Pharmacien' : 'Parapharmacien'}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                  Niveau {levels.find(l => l.value === selectedLevel)?.label}
                </div>
              </div>
            </div>

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
                      marginRight: '12px',
                      flexShrink: 0,
                    }}>
                      {selectedCategory === 'pharmacien' && Icons.pharmacie}
                      {selectedCategory === 'parapharmacien' && Icons.parapharmacie}
                      {selectedCategory === 'medecin' && Icons.doctor}
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
                      : 'var(--color-surface-1)',
                    color: msg.isUser ? 'white' : 'var(--color-text-primary)',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--gradient-brand)',
                    marginRight: '12px',
                    flexShrink: 0,
                  }} />
                  <div style={{
                    padding: '12px 20px',
                    borderRadius: '18px',
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

            <form onSubmit={handleSubmit} style={{
              padding: '20px 24px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              gap: '12px',
              background: 'white',
            }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Votre réponse..."
                style={{
                  flex: 1,
                  padding: '12px 16px',
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                Envoyer {Icons.send}
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Evaluation */}
        {step === 'evaluation' && evaluation && (
          <div>
            <div style={{
              background: 'linear-gradient(135deg, #0D1B2A, #0A3D62)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              textAlign: 'center',
              marginBottom: '24px',
              color: 'white',
            }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '8px' }}>
                Score global
              </div>
              <div style={{
                fontSize: '4rem',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                marginBottom: '8px',
              }}>
                {evaluation.score}%
              </div>
              <div style={{
                width: '200px',
                height: '8px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '4px',
                margin: '0 auto',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${evaluation.score}%`,
                  height: '100%',
                  background: evaluation.score >= 80 ? '#16A34A' : evaluation.score >= 60 ? '#F2A516' : '#DC2626',
                  borderRadius: '4px',
                  transition: 'width 1s ease',
                }} />
              </div>
              <div style={{ fontSize: '0.8rem', marginTop: '12px', opacity: 0.7 }}>
                {evaluation.score >= 80 ? 'Excellent !' : evaluation.score >= 60 ? 'Bon travail, continuez !' : 'À améliorer, ne vous découragez pas !'}
              </div>
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={{
                background: 'white',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
              }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {Icons.check} Points forts
                </h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {evaluation.strengths.map((s, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', fontSize: '0.9rem' }}>
                      {Icons.check} {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{
                background: 'white',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
              }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: '#F2A516', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {Icons.warning} Axes d'amélioration
                </h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {evaluation.improvements.map((imp, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', fontSize: '0.9rem' }}>
                      {Icons.warning} {imp}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{
                background: 'white',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
              }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--color-brand-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {Icons.book} Recommandations
                </h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {evaluation.recommendations.map((rec, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', fontSize: '0.9rem' }}>
                      {Icons.book} {rec}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={restartTraining}
                style={{
                  padding: '14px',
                  background: 'var(--gradient-brand)',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  color: 'white',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  marginTop: '8px',
                }}
              >
                Recommencer une simulation
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
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