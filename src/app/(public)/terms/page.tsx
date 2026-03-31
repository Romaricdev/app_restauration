'use client'

import { FileText, Scale, AlertCircle, CheckCircle2 } from 'lucide-react'
import { FadeIn } from '@/components/animations'
import { Card, CardContent } from '@/components/ui'

// ============================================
// HERO SECTION
// ============================================

function TermsHero() {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-[#F4A024]/5 via-white to-[#4B4F1E]/5 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F4A024]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#4B4F1E]/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn delay={0.1}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F4A024]/10 rounded-full mb-6 border border-[#F4A024]/20">
            <Scale className="w-5 h-5 text-[#F4A024]" />
            <span className="text-sm font-medium text-[#F4A024]">
              Conditions d'Utilisation
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={0.2} direction="up">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            Conditions Générales d&apos;Utilisation
          </h1>
        </FadeIn>
        <FadeIn delay={0.3} direction="up">
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed text-justify">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </FadeIn>
      </div>
    </section>
  )
}

// ============================================
// CONTENT SECTIONS
// ============================================

const sections = [
  {
    icon: FileText,
    title: '1. Acceptation des Conditions',
    content: `En accédant et en utilisant le site web du Restaurant Central, vous acceptez d'être lié par ces conditions générales d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre site.

Ces conditions s'appliquent à tous les utilisateurs du site, y compris les visiteurs, les clients, et les membres.`,
  },
  {
    icon: CheckCircle2,
    title: '2. Utilisation du Site',
    content: `Vous vous engagez à utiliser notre site de manière légale et appropriée. Il est interdit de :
- Utiliser le site à des fins illégales ou non autorisées
- Tenter d'accéder à des zones non autorisées du site
- Transmettre des virus ou tout code malveillant
- Copier, reproduire ou revendre le contenu du site sans autorisation
- Utiliser des robots ou scripts automatisés pour accéder au site`,
  },
  {
    icon: AlertCircle,
    title: '3. Réservations et Commandes',
    content: `Lorsque vous effectuez une réservation ou passez une commande :
- Vous confirmez que toutes les informations fournies sont exactes
- Vous acceptez de payer le montant total indiqué
- Les réservations sont soumises à disponibilité
- Nous nous réservons le droit d'annuler une réservation en cas de circonstances exceptionnelles
- Les annulations doivent être effectuées au moins 24 heures à l'avance`,
  },
  {
    icon: Scale,
    title: '4. Propriété Intellectuelle',
    content: `Tout le contenu de ce site, incluant mais sans s'y limiter : textes, graphiques, logos, images, et logiciels, est la propriété du Restaurant Central et est protégé par les lois sur la propriété intellectuelle.

Vous n'êtes pas autorisé à reproduire, distribuer, modifier ou créer des œuvres dérivées à partir de ce contenu sans notre autorisation écrite préalable.`,
  },
  {
    icon: AlertCircle,
    title: '5. Limitation de Responsabilité',
    content: `Dans les limites permises par la loi :
- Nous ne garantissons pas que le site sera toujours disponible ou exempt d'erreurs
- Nous ne sommes pas responsables des dommages indirects résultant de l'utilisation du site
- Nous ne garantissons pas l'exactitude complète de toutes les informations affichées
- Les prix et disponibilités peuvent être modifiés sans préavis`,
  },
  {
    icon: FileText,
    title: '6. Modifications des Conditions',
    content: `Nous nous réservons le droit de modifier ces conditions générales à tout moment. Les modifications entreront en vigueur dès leur publication sur le site.

Il est de votre responsabilité de consulter régulièrement ces conditions pour prendre connaissance des éventuelles modifications.`,
  },
]

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function TermsPage() {
  return (
    <>
      <TermsHero />

      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8 sm:space-y-12">
            {sections.map((section, index) => (
              <FadeIn key={section.title} delay={index * 0.1}>
                <Card variant="site" padding="lg">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-[#F4A024]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <section.icon className="w-6 h-6 text-[#F4A024]" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {section.title}
                    </h2>
                  </div>
                  <div className="text-base sm:text-lg text-gray-700 leading-relaxed text-justify whitespace-pre-line">
                    {section.content}
                  </div>
                </Card>
              </FadeIn>
            ))}
          </div>

          {/* Contact Section */}
          <FadeIn delay={0.7}>
            <Card variant="site" padding="lg" className="mt-12 sm:mt-16 bg-gray-50">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Questions sur les Conditions ?
              </h3>
              <p className="text-base sm:text-lg text-gray-700 leading-relaxed text-justify mb-4">
                Si vous avez des questions concernant ces conditions générales d'utilisation, 
                n'hésitez pas à nous contacter.
              </p>
              <div className="space-y-2 text-base sm:text-lg text-gray-700">
                <p><strong>Email :</strong> contact@messofficiers.cm</p>
                <p><strong>Téléphone :</strong> +237 6XX XXX XXX</p>
              </div>
            </Card>
          </FadeIn>
        </div>
      </section>
    </>
  )
}
