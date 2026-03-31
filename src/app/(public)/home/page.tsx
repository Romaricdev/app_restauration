'use client'

import Link from 'next/link'
import Image from 'next/image'
import { 
  Clock, 
  MapPin, 
  Phone,
  Calendar,
  Utensils,
  ArrowRight,
  Leaf,
  Award,
  Users,
  Wine,
  ChefHat,
  PartyPopper,
  Coffee
} from 'lucide-react'
import { FadeIn, Stagger } from '@/components/animations'
import { useAppSettings, useDailyMenuItems } from '@/hooks'

// ============================================
// COMPONENTS
// ============================================

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* 1. Background Image Full Screen */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://nlpizsiqsanewubknrsu.supabase.co/storage/v1/object/public/images/images_public/9920.jpg"
          alt="Ambiance gastronomique au Restaurant Central"
          fill
          className="object-cover"
          priority
          quality={95}
        />
        {/* 2. Overlay Sombre (50%) pour lisibilité */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* 3. Contenu Texte */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 flex flex-col justify-center h-full">
        <div className="max-w-4xl mx-auto lg:mx-0 text-center lg:text-left mt-16 sm:mt-0">
          
          {/* Titre Principal */}
          <FadeIn delay={0.2} direction="up">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight tracking-tight drop-shadow-sm">
              L’Excellence Culinaire
              <span className="block text-[#F4A024] mt-2">Camerounaise</span>
            </h1>
          </FadeIn>

          {/* Sous-titre */}
          <FadeIn delay={0.4} direction="up">
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-100 mb-8 sm:mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light drop-shadow-sm opacity-90">
              Une expérience gastronomique raffinée au cœur de Yaoundé.
            </p>
          </FadeIn>

          {/* Call To Action Buttons */}
          <FadeIn delay={0.6} direction="up">
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6 w-full sm:w-auto">
              <Link
                href="/reservation"
                className="w-full sm:w-auto px-8 py-4 bg-[#F4A024] text-white font-semibold text-base sm:text-lg rounded-full hover:bg-[#d88d1f] transition-all duration-300 shadow-lg hover:shadow-[#F4A024]/20 transform hover:-translate-y-0.5 text-center min-w-[200px]"
              >
                Réserver une Table
              </Link>
              <Link
                href="/menu"
                className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white text-white font-semibold text-base sm:text-lg rounded-full hover:bg-white hover:text-gray-900 transition-all duration-300 text-center min-w-[200px]"
              >
                Découvrir le Menu
              </Link>
            </div>
          </FadeIn>

        </div>
      </div>
      
      {/* Scroll indicator subtil */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block z-20 opacity-70">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-white rounded-full" />
        </div>
      </div>
    </section>
  )
}

function AboutSection() {
  return (
    <section className="py-12 sm:py-16 md:py-14 lg:py-24 xl:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-16 xl:gap-20 items-center">
          <FadeIn>
            {/* Image Side */}
            <div className="relative order-2 md:order-1 w-full">
              <div className="relative w-full aspect-[4/3] sm:aspect-[4/5] md:aspect-[3/4] lg:aspect-[4/5] min-h-[300px] sm:min-h-[360px] md:min-h-[420px] lg:min-h-[480px] overflow-hidden bg-white">
                {/* Image du restaurant - Centrée avec ajustement pour compenser l'espace vide */}
                <Image
                  src="https://nlpizsiqsanewubknrsu.supabase.co/storage/v1/object/public/images/images_public/407802468_025431af-6f8a-41e7-94af-f5162e915f64-removebg-preview.png"
                  alt="Intérieur élégant du Restaurant Central"
                  fill
                  className="object-contain"
                  style={{ objectPosition: '55% center' }}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  quality={90}
                  unoptimized
                />
                
                {/* Decorative badge - Masqué sur mobile, visible à partir de la tablette */}
                <div className="hidden md:flex absolute bottom-4 right-4 md:-bottom-6 md:-right-6 w-28 sm:w-28 md:w-32 md:h-32 bg-[#F4A024] rounded-xl sm:rounded-2xl items-center justify-center shadow-xl z-10">
                  <div className="text-center text-white">
                    <p className="text-2xl md:text-3xl font-bold">15</p>
                    <p className="text-xs">Ans</p>
                  </div>
                </div>
              </div>
              {/* Decorative element - Masqué sur tablette pour éviter les chevauchements */}
              <div className="hidden lg:block absolute -top-8 -left-8 w-24 h-24 border-2 border-[#F4A024]/30 rounded-2xl -z-10" />
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            {/* Content Side */}
            <div className="order-1 md:order-2">
            <span className="inline-block px-4 py-2 bg-[#F4A024]/10 text-[#F4A024] text-sm sm:text-base font-semibold rounded-full mb-3 sm:mb-4 md:mb-5">
              Notre Histoire
            </span>
            
            <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4 sm:mb-6 md:mb-6">
              Une Tradition Culinaire
              <span className="text-[#F4A024]"> Camerounaise</span>
            </h2>

            <div className="space-y-4 sm:space-y-5 text-gray-600 leading-relaxed text-base sm:text-lg max-w-prose">
              <p className="text-base sm:text-lg text-justify">
                Depuis plus de quinze ans, le <strong className="text-gray-900">Restaurant Central</strong> perpétue 
                l&apos;excellence de la gastronomie camerounaise dans un cadre alliant élégance et authenticité.
              </p>
              <p className="text-justify">
                Notre établissement est né d&apos;une passion : celle de faire découvrir les saveurs 
                riches et variées de notre patrimoine culinaire. Chaque plat raconte une histoire, 
                chaque recette est un héritage transmis de génération en génération.
              </p>
              <p className="text-justify">
                Notre chef et son équipe sélectionnent minutieusement les meilleurs ingrédients 
                locaux pour créer des expériences gustatives mémorables. Des épices parfumées aux 
                viandes tendres, en passant par les poissons frais du jour, nous mettons un point 
                d&apos;honneur à respecter les traditions tout en y apportant une touche de modernité.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-8 mt-6 sm:mt-8 md:mt-8 lg:mt-12 pt-4 sm:pt-6 md:pt-6 lg:pt-10 border-t border-gray-200">
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#F4A024]/10 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-[#F4A024]" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-900">Produits Frais</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#F4A024]/10 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 text-[#F4A024]" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-900">Chef Étoilé</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#F4A024]/10 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#F4A024]" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-900">Service VIP</p>
              </div>
            </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

function ServicesSection() {
  const services = [
    {
      title: "Réservation de Table",
      description: "Planifiez vos déjeuners et dîners en toute simplicité. Réservez votre table en ligne pour un moment de partage sans attente.",
      icon: Calendar,
    },
    {
      title: "Location de Salles",
      description: "Mariages, séminaires ou banquets : nos salles spacieuses et équipées sont disponibles pour accueillir tous vos grands événements.",
      icon: PartyPopper,
    },
    {
      title: "Cuisine d'Excellence",
      description: "Savourez des repas de qualité supérieure, préparés avec passion par nos chefs à partir de produits frais et locaux.",
      icon: Utensils,
    },
    {
      title: "Service Traiteur",
      description: "L'expertise gastronomique du Mess s'invite chez vous. Une prestation sur mesure pour sublimer vos réceptions privées.",
      icon: ChefHat,
    },
  ]

  return (
    <section className="py-12 sm:py-16 md:py-14 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <span className="inline-block px-4 py-1.5 bg-[#F4A024]/10 text-[#F4A024] text-sm font-semibold rounded-full mb-4">
              Nos Services
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
              Une Offre Complète
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Du simple repas à l'organisation de grands événements, nous mettons notre savoir-faire à votre service.
            </p>
          </div>
        </FadeIn>

        <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {services.map((service, index) => (
            <div 
              key={index}
              className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100 hover:border-[#F4A024]/20"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#F4A024]/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#F4A024] transition-colors duration-300">
                <service.icon className="w-6 h-6 sm:w-7 sm:h-7 text-[#F4A024] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 group-hover:text-[#F4A024] transition-colors">
                {service.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed text-justify">
                {service.description}
              </p>
            </div>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

function MenuSection() {
  const { menuItems, loading, error } = useDailyMenuItems()

  // Formater le prix en FCFA
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price) + ' FCFA'
  }

  return (
    <section className="relative py-12 sm:py-16 md:py-14 lg:py-24 xl:py-32 bg-white overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeIn>
          <div className="text-center mb-8 sm:mb-12 md:mb-10 lg:mb-20">
            <span className="inline-block px-4 py-1.5 bg-[#F4A024]/20 text-[#F4A024] text-sm font-semibold rounded-full mb-4 sm:mb-5 md:mb-5">
              Sélection du Chef
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-4">
              Notre Carte du Jour
            </h2>
            <p className="text-sm sm:text-base md:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto text-justify break-words px-2">
              Explorez notre menu soigneusement élaboré, mettant en valeur 
              les meilleures saveurs de la cuisine camerounaise.
            </p>
          </div>
        </FadeIn>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-600">Chargement du menu du jour...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600">Erreur: {error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && menuItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">Aucun menu du jour disponible pour le moment.</p>
          </div>
        )}

        {/* Menu Items Grid */}
        {!loading && !error && menuItems.length > 0 && (
          <Stagger className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 hover:border-[#F4A024]/50 transition-all duration-300 group shadow-sm hover:shadow-lg"
              >
                {/* Product Image */}
                <div className="aspect-square bg-gray-100 rounded-lg sm:rounded-xl mb-3 sm:mb-4 flex items-center justify-center overflow-hidden relative">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      quality={90}
                      unoptimized
                    />
                  ) : (
                    <Utensils className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 group-hover:text-[#F4A024]/50 transition-colors" />
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mt-1 mb-2 line-clamp-2">{item.name}</h3>
                {item.description && (
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-sm sm:text-base text-[#F4A024] font-bold">{formatPrice(item.price)}</p>
                  {!item.available && (
                    <span className="text-xs text-red-600 font-medium">Indisponible</span>
                  )}
                </div>
              </div>
            ))}
          </Stagger>
        )}

        {/* View Full Menu CTA */}
        {!loading && !error && menuItems.length > 0 && (
          <FadeIn delay={0.3}>
            <div className="text-center mt-8 sm:mt-12 md:mt-10 lg:mt-20">
              <Link
                href="/menu"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-[#F4A024] text-white font-semibold text-sm sm:text-base rounded-xl hover:bg-[#C97F16] transition-colors min-h-[48px]"
              >
                Voir le Menu Complet
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </div>
          </FadeIn>
        )}
      </div>
    </section>
  )
}

function GallerySection() {
  return (
    <section className="py-12 sm:py-16 md:py-14 lg:py-24 xl:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeIn>
          <div className="text-center mb-8 sm:mb-12 md:mb-10 lg:mb-20">
            <span className="inline-block px-4 py-2 bg-[#F4A024]/10 text-[#F4A024] text-sm sm:text-base font-semibold rounded-full mb-4 sm:mb-5 md:mb-5">
              Galerie
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-4">
              Découvrez Notre Univers
            </h2>
            <p className="text-sm sm:text-base md:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto text-justify">
              Plongez dans l&apos;ambiance chaleureuse et élégante du Restaurant Central.
            </p>
          </div>
        </FadeIn>

        {/* Gallery Grid - cartes homogènes */}
        <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
          {[
            {
              src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop',
              alt: "Salle à manger élégante du restaurant",
            },
            {
              src: 'https://nlpizsiqsanewubknrsu.supabase.co/storage/v1/object/public/images/images_public/407745033_05dbafde-b769-43ad-909e-a3ab5f6dd7ea-removebg-preview.png',
              alt: "Table dressée élégante au Restaurant Central",
            },
            {
              src: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800&auto=format&fit=crop',
              alt: "Terrasse du restaurant",
            },
          ].map((image, idx) => (
            <div
              key={image.src}
              className="aspect-[4/3] md:aspect-[3/2] bg-gray-200 rounded-xl sm:rounded-2xl md:rounded-2xl lg:rounded-3xl overflow-hidden relative group"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                quality={90}
                priority={idx === 0}
                unoptimized={image.src.includes('supabase.co')}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </div>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

function InfoSection() {
  const { restaurantInfo } = useAppSettings()

  // Convertir les horaires en format pour l'affichage
  const hours = [
    { days: 'Lundi - Vendredi', time: restaurantInfo.openingHours.weekdays },
    { days: 'Samedi - Dimanche', time: restaurantInfo.openingHours.weekends },
  ]

  return (
    <section className="py-12 sm:py-16 md:py-14 lg:py-24 xl:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeIn>
          <div className="text-center mb-8 sm:mb-12 md:mb-10 lg:mb-20">
            <span className="inline-block px-4 py-2 bg-[#F4A024]/10 text-[#F4A024] text-sm sm:text-base font-semibold rounded-full mb-4 sm:mb-5 md:mb-5">
              Informations Pratiques
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-4">
              Venez Nous Rendre Visite
            </h2>
          </div>
        </FadeIn>

        {/* Info Cards */}
        <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 md:gap-6 lg:gap-10">
          {/* Contact Card */}
          <div className="bg-gray-50 rounded-xl sm:rounded-2xl md:rounded-2xl lg:rounded-3xl p-5 sm:p-6 md:p-6 lg:p-8 text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-[#F4A024]/10 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-5">
              <Phone className="w-6 h-6 sm:w-7 sm:h-7 md:w-7 md:h-7 lg:w-8 lg:h-8 text-[#F4A024]" />
            </div>
            <h3 className="text-base sm:text-lg md:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-3">Contact</h3>
            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-600">
              <a 
                href={`tel:${restaurantInfo.phone.replace(/\s/g, '')}`}
                className="block hover:text-[#F4A024] transition-colors py-1"
              >
                {restaurantInfo.phone}
              </a>
              <a 
                href={`mailto:${restaurantInfo.email}`}
                className="block hover:text-[#F4A024] transition-colors py-1 break-all"
              >
                {restaurantInfo.email}
              </a>
            </div>
          </div>

          {/* Hours Card */}
          <div className="bg-gray-50 rounded-xl sm:rounded-2xl md:rounded-2xl lg:rounded-3xl p-5 sm:p-6 md:p-6 lg:p-8 text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-[#F4A024]/10 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-5">
              <Clock className="w-6 h-6 sm:w-7 sm:h-7 md:w-7 md:h-7 lg:w-8 lg:h-8 text-[#F4A024]" />
            </div>
            <h3 className="text-base sm:text-lg md:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-3">Horaires</h3>
            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
              {hours.map((schedule, index) => (
                <div key={index} className="text-gray-600">
                  <p className="font-medium text-gray-900">{schedule.days}</p>
                  <p>{schedule.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Location Card */}
          <div className="bg-gray-50 rounded-xl sm:rounded-2xl md:rounded-2xl lg:rounded-3xl p-5 sm:p-6 md:p-6 lg:p-8 text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-[#F4A024]/10 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-5">
              <MapPin className="w-6 h-6 sm:w-7 sm:h-7 md:w-7 md:h-7 lg:w-8 lg:h-8 text-[#F4A024]" />
            </div>
            <h3 className="text-base sm:text-lg md:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-3">Localisation</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              {restaurantInfo.address}
            </p>
            <a 
              href="https://maps.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 text-sm sm:text-base text-[#F4A024] font-medium hover:underline py-2 min-h-[44px]"
            >
              Voir sur la carte
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </Stagger>

        {/* CTA Banner */}
        <FadeIn delay={0.2}>
          <div className="mt-8 sm:mt-12 md:mt-10 lg:mt-20 bg-[#F4A024] rounded-xl sm:rounded-2xl md:rounded-2xl lg:rounded-3xl p-6 sm:p-8 md:p-8 lg:p-12 text-center">
            <h3 className="text-lg sm:text-xl md:text-xl lg:text-3xl font-bold text-white mb-3 sm:mb-4 md:mb-5">
              Prêt à Vivre une Expérience Unique ?
            </h3>
            <p className="text-sm sm:text-base md:text-base lg:text-lg text-white/90 mb-6 sm:mb-8 md:mb-8 max-w-2xl mx-auto text-justify">
              Réservez votre table dès maintenant et laissez-nous vous faire découvrir 
              le meilleur de la gastronomie camerounaise.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-6">
              <Link
                href="/reservation"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-[#F4A024] font-semibold text-sm sm:text-base rounded-xl hover:bg-gray-100 transition-colors min-h-[48px]"
              >
                <Calendar className="w-5 h-5" />
                Réserver Maintenant
              </Link>
              <a
                href={`tel:${restaurantInfo.phone.replace(/\s/g, '')}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white/20 text-white font-semibold text-sm sm:text-base rounded-xl hover:bg-white/30 transition-colors border border-white/30 min-h-[48px]"
              >
                <Phone className="w-5 h-5" />
                Nous Appeler
              </a>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <MenuSection />
      <GallerySection />
      <InfoSection />
    </>
  )
}
