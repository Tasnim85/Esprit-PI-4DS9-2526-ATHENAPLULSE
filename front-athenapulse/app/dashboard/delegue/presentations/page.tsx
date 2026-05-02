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

  // Mock API call to generate presentation/rapport
  const generateContent = async (product: string, indicationText: string, type: GenerationType): Promise<GeneratedContent> => {
    await new Promise(resolve => setTimeout(resolve, 2000))

    const productData: Record<string, ProductData> = {
      'cardio-x': {
        name: 'Cardio-X',
        fullName: 'Cardio-X 50mg/100mg',
        class: 'Antihypertenseur - Inhibiteur de l\'enzyme de conversion',
        indications: ['Hypertension artérielle sévère', 'Prévention des AVC', 'Insuffisance cardiaque chronique', 'Néphropathie diabétique'],
        dosage: '1 comprimé par jour, matin ou soir',
        mechanism: 'Inhibiteur de l\'ECA avec action prolongée 24h. Diminue la pression artérielle en relaxant les vaisseaux sanguins.',
        efficacy: 'Réduction moyenne de 25-30 mmHg (systolique) et 15-20 mmHg (diastolique)',
        sideEffects: ['Vertiges légers (5%)', 'Fatigue (3%)', 'Toux sèche (1%)', 'Hyperkaliémie rare'],
        contraindications: ['Grossesse', 'Sténose bilatérale des artères rénales', 'Antécédent d\'œdème de Quincke'],
        studies: 'Étude HOPE-2024 : réduction de 32% des événements cardiovasculaires majeurs sur 12 mois',
        price: '385 DH / boîte de 30 comprimés',
        presentation: 'Boîte de 30 comprimés sous blister',
      },
      'neuro-b': {
        name: 'Neuro-B Plus',
        fullName: 'Neuro-B Plus Gélules',
        class: 'Complément alimentaire neurologique',
        indications: ['Neuropathies périphériques', 'Fatigue chronique', 'Troubles de la mémoire légers', 'Prévention cognitive'],
        dosage: '1 à 2 gélules par jour pendant les repas',
        mechanism: 'Association synergique de vitamines B12, B6, acide folique et alpha-lipoïque pour le soutien nerveux.',
        efficacy: 'Amélioration de 65% des symptômes neuropathiques après 8 semaines',
        sideEffects: ['Nausées légères (2%)', 'Urine colorée (sans danger)', 'Réactions allergiques rares'],
        contraindications: ['Hypersensibilité à l\'un des composants'],
        studies: 'Étude VITA-Neuro (2025) : réduction de 47% de la fatigue chez 82% des patients',
        price: '225 DH / flacon de 60 gélules',
        presentation: 'Flacon de 60 gélules',
      },
      'fibromed': {
        name: 'Fibromed',
        fullName: 'Fibromed 75mg',
        class: 'Antidouleur - Modulateur des neurotransmetteurs',
        indications: ['Fibromyalgie', 'Douleurs chroniques diffuses', 'Troubles du sommeil associés'],
        dosage: '1 comprimé matin et soir. Augmentation progressive sur 2 semaines',
        mechanism: 'Module la transmission de la douleur au niveau du SNC. Augmente les niveaux de sérotonine et noradrénaline.',
        efficacy: 'Réduction de 55% des scores de douleur après 12 semaines',
        sideEffects: ['Nausées (8%)', 'Sécheresse buccale (6%)', 'Somnolence (10%)', 'Prise de poids modérée'],
        contraindications: ['Allergie connue', 'Insuffisance hépatique sévère'],
        studies: 'Étude FIBRO-2024 : amélioration de la qualité de vie chez 78% des patients',
        price: '420 DH / boîte de 28 comprimés',
        presentation: 'Boîte de 28 comprimés sous blister',
      },
    }

    const lowerProduct = product.toLowerCase()
    let data: ProductData = productData['cardio-x']
    if (lowerProduct.includes('neuro')) data = productData['neuro-b']
    else if (lowerProduct.includes('fibro')) data = productData['fibromed']

    if (type === 'presentation') {
      const slides: Slide[] = [
        {
          title: 'Introduction',
          content: `# ${data.fullName}\n\n## Une innovation thérapeutique pour ${indicationText || data.indications[0]}\n\n**Classe thérapeutique :** ${data.class}\n\n**Présentation :** ${data.presentation}`,
        },
        {
          title: 'Mécanisme d\'action',
          content: `## Mécanisme d'action\n\n${data.mechanism}\n\n### Points clés :\n- Action prolongée 24h\n- Biodisponibilité optimale\n- Métabolisation hépatique sécurisée`,
        },
        {
          title: 'Indications et Efficacité',
          content: `## Indications thérapeutiques\n\n${data.indications.map((i: string) => `- ${i}`).join('\n')}\n\n### Efficacité clinique\n\n${data.efficacy}\n\n${data.studies}`,
        },
        {
          title: 'Posologie et Administration',
          content: `## Posologie recommandée\n\n${data.dosage}\n\n### Points d'attention :\n- À prendre à heure fixe\n- Avec ou sans nourriture\n- Ne pas dépasser la dose prescrite\n- Suivi régulier recommandé`,
        },
        {
          title: 'Sécurité et Tolérance',
          content: `## Profil de sécurité\n\n**Effets indésirables fréquents :**\n${data.sideEffects.map((e: string) => `- ${e}`).join('\n')}\n\n**Contre-indications :**\n${data.contraindications.map((c: string) => `- ${c}`).join('\n')}`,
        },
        {
          title: 'Conclusion',
          content: `## Conclusion\n\n${data.fullName} représente une avancée significative dans la prise en charge de ${indicationText || data.indications[0]}.\n\n### Pour en savoir plus :\n- Documentation scientifique disponible\n- Visite médicale sur demande\n- Échantillons gratuits disponibles`,
        },
      ]
      
      return {
        type: 'presentation',
        title: `Présentation - ${data.fullName}`,
        productName: data.name,
        indication: indicationText || undefined,
        generatedAt: new Date(),
        slides: slides,
      }
    } else {
      const sections: Section[] = [
        {
          title: 'Résumé Exécutif',
          content: `${data.fullName} est indiqué dans ${indicationText || data.indications[0]}. Les données cliniques démontrent une efficacité supérieure avec un excellent profil de sécurité.`,
        },
        {
          title: 'Profil du Produit',
          content: `**Dénomination :** ${data.fullName}\n**Classe :** ${data.class}\n**Présentation :** ${data.presentation}\n**Prix :** ${data.price}`,
        },
        {
          title: 'Efficacité Clinique',
          content: `${data.efficacy}\n\n${data.studies}`,
        },
        {
          title: 'Recommandations d\'Utilisation',
          content: `${data.dosage}\n\nPopulation cible : ${data.indications.join(', ')}`,
        },
        {
          title: 'Analyse SWOT',
          content: `**Forces :**\n- Efficacité démontrée\n- Bon profil de sécurité\n- Administration simplifiée\n\n**Opportunités :**\n- Marché en croissance\n- Besoin non satisfait\n\n**Menaces :**\n- Concurrence générique\n- Pression sur les prix`,
        },
        {
          title: 'Conclusion',
          content: `${data.fullName} est une option thérapeutique de premier choix dans ${indicationText || data.indications[0]}. Une adoption rapide est recommandée.`,
        },
      ]
      
      return {
        type: 'rapport',
        title: `Rapport Médical - ${data.fullName}`,
        productName: data.name,
        indication: indicationText || undefined,
        generatedAt: new Date(),
        sections: sections,
      }
    }
  }

  // Générer et télécharger un fichier PPTX
  const generatePPTX = async () => {
    if (!generatedContent || generatedContent.type !== 'presentation' || !generatedContent.slides) return

    const PptxGenJS = (await import('pptxgenjs')).default
    const pptx = new PptxGenJS()

    pptx.defineLayout({ name: 'WIDE', width: 10, height: 5.625 })
    pptx.layout = 'WIDE'

    const slide1 = pptx.addSlide()
    slide1.addText(generatedContent.title, {
      x: 0.5, y: 1.5, w: 9, h: 1.5,
      fontSize: 32, bold: true, color: '0A6EBD',
      align: 'center',
    })
    slide1.addText(`Produit: ${generatedContent.productName}`, {
      x: 0.5, y: 3.2, w: 9, h: 0.5,
      fontSize: 16, align: 'center',
    })
    if (generatedContent.indication) {
      slide1.addText(`Indication: ${generatedContent.indication}`, {
        x: 0.5, y: 3.8, w: 9, h: 0.5,
        fontSize: 14, align: 'center', italic: true,
      })
    }
    slide1.addText(`Généré le ${generatedContent.generatedAt.toLocaleDateString('fr-FR')}`, {
      x: 0.5, y: 4.8, w: 9, h: 0.4,
      fontSize: 11, align: 'center', color: '666666',
    })

    generatedContent.slides.forEach((slide, idx) => {
      const slideContent = pptx.addSlide()
      slideContent.addText(slide.title, {
        x: 0.5, y: 0.3, w: 9, h: 0.6,
        fontSize: 24, bold: true, color: '0A6EBD',
      })
      
      const lines = slide.content.split('\n')
      let yPos = 1.1
      
      lines.forEach((line) => {
        if (line.startsWith('# ')) {
          slideContent.addText(line.substring(2), { x: 0.5, y: yPos, w: 9, h: 0.5, fontSize: 20, bold: true })
          yPos += 0.6
        } else if (line.startsWith('## ')) {
          slideContent.addText(line.substring(3), { x: 0.5, y: yPos, w: 9, h: 0.4, fontSize: 18, bold: true, color: '05B8CC' })
          yPos += 0.5
        } else if (line.startsWith('- ')) {
          slideContent.addText(line.substring(2), { x: 0.8, y: yPos, w: 8.7, h: 0.35, fontSize: 12, bullet: true })
          yPos += 0.4
        } else if (line.trim() && !line.startsWith('**')) {
          slideContent.addText(line, { x: 0.5, y: yPos, w: 9, h: 0.35, fontSize: 13 })
          yPos += 0.45
        }
      })
    })

    const lastSlide = pptx.addSlide()
    lastSlide.addText('Merci pour votre attention', { x: 0.5, y: 2, w: 9, h: 1, fontSize: 28, bold: true, align: 'center' })
    lastSlide.addText('Des questions ? Notre équipe est à votre disposition', { x: 0.5, y: 3.2, w: 9, h: 0.5, fontSize: 14, align: 'center', italic: true })

    await pptx.writeFile({ fileName: `${generatedContent.productName}_presentation.pptx` })
  }

  // Générer et télécharger un fichier PDF
  const generatePDF = async () => {
    if (!generatedContent || generatedContent.type !== 'rapport' || !generatedContent.sections) return

    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF()
    let yPos = 20

    const addText = (text: string, size: number, isBold = false, isItalic = false) => {
      const lines = pdf.splitTextToSize(text, 170)
      if (yPos + (lines.length * (size * 0.35)) > 280) {
        pdf.addPage()
        yPos = 20
      }
      pdf.setFont('helvetica', isBold ? 'bold' : isItalic ? 'italic' : 'normal')
      pdf.setFontSize(size)
      pdf.text(lines, 20, yPos)
      yPos += lines.length * (size * 0.35) + 4
    }

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(24)
    pdf.setTextColor(10, 110, 189)
    pdf.text(generatedContent.title, 20, yPos)
    yPos += 15

    pdf.setFontSize(11)
    pdf.setTextColor(100, 100, 100)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Produit: ${generatedContent.productName}`, 20, yPos)
    yPos += 7
    if (generatedContent.indication) {
      pdf.text(`Indication: ${generatedContent.indication}`, 20, yPos)
      yPos += 7
    }
    pdf.text(`Généré le: ${generatedContent.generatedAt.toLocaleDateString('fr-FR')}`, 20, yPos)
    yPos += 15

    pdf.setDrawColor(200, 200, 200)
    pdf.line(20, yPos, 190, yPos)
    yPos += 10

    generatedContent.sections.forEach((section) => {
      if (yPos > 250) {
        pdf.addPage()
        yPos = 20
      }
      
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(16)
      pdf.setTextColor(10, 110, 189)
      pdf.text(section.title, 20, yPos)
      yPos += 10
      
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(11)
      pdf.setTextColor(0, 0, 0)
      
      const lines = section.content.split('\n')
      lines.forEach((line) => {
        if (line.startsWith('**')) {
          const plainText = line.replace(/\*\*/g, '')
          addText(plainText, 11, true)
        } else if (line.startsWith('- ')) {
          addText(`• ${line.substring(2)}`, 11)
        } else if (line.trim()) {
          addText(line, 11)
        }
      })
      yPos += 5
    })

    pdf.addPage()
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(20)
    pdf.setTextColor(10, 110, 189)
    pdf.text('Rapport généré par AthenaPulse', 20, 100, { align: 'center' })
    pdf.setFontSize(12)
    pdf.setTextColor(100, 100, 100)
    pdf.text('Pour toute question, contactez notre équipe médicale', 20, 120, { align: 'center' })

    pdf.save(`${generatedContent.productName}_rapport.pdf`)
  }

  const handleDownload = () => {
    if (generationType === 'presentation') {
      generatePPTX()
    } else {
      generatePDF()
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
                    {generatedContent.type === 'presentation' && generatedContent.slides ? (
                      <div>
                        {generatedContent.slides.map((slide, idx) => (
                          <div key={idx} style={{
                            marginBottom: '32px',
                            padding: '20px',
                            background: 'var(--color-surface-1)',
                            borderRadius: 'var(--radius-md)',
                            borderLeft: `4px solid var(--color-brand-primary)`,
                          }}>
                            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--color-brand-primary)' }}>
                              Slide {idx + 1}: {slide.title}
                            </h3>
                            <div style={{ fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                              {slide.content.split('\n').map((line, i) => {
                                if (line.startsWith('# ')) return <h1 key={i} style={{ fontSize: '1.3rem', margin: '12px 0 8px' }}>{line.slice(2)}</h1>
                                if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: '1.1rem', margin: '10px 0 6px', color: 'var(--color-brand-primary)' }}>{line.slice(3)}</h2>
                                if (line.startsWith('- ')) return <li key={i} style={{ marginLeft: '20px' }}>{line.slice(2)}</li>
                                if (line.startsWith('**') && line.endsWith('**')) return <strong key={i}>{line.slice(2, -2)}</strong>
                                return line ? <p key={i} style={{ margin: '6px 0' }}>{line}</p> : <br key={i} />
                              })}
                            </div>
                          </div>
                        ))}
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
                      </div>
                    ) : null}

                    {/* Download button */}
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
                        {Icons.download} Télécharger {generatedContent.type === 'presentation' ? 'la présentation (PPTX)' : 'le rapport (PDF)'}
                      </button>
                    </div>
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