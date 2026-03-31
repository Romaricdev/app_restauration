'use client'

import Image from 'next/image'
import { 
  ChefHat, 
  Award, 
  Users, 
  Heart,
  Clock,
  Utensils,
  Leaf,
  Target
} from 'lucide-react'
import { FadeIn, Stagger } from '@/components/animations'
import { useAppSettings } from '@/hooks'

// ============================================
// HERO SECTION
// ============================================

function AboutHero() {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-[#F4A024]/5 via-white to-[#4B4F1E]/5 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F4A024]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#4B4F1E]/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn delay={0.1}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F4A024]/10 rounded-full mb-6 border border-[#F4A024]/20">
            <ChefHat className="w-5 h-5 text-[#F4A024]" />
            <span className="text-sm font-medium text-[#F4A024]">
              Notre Histoire
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={0.2} direction="up">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            À Propos de Nous
          </h1>
        </FadeIn>
        <FadeIn delay={0.3} direction="up">
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed text-justify">
            Découvrez l&apos;histoire du Restaurant Central, un établissement d&apos;exception 
            alliant tradition culinaire camerounaise et excellence du service.
          </p>
        </FadeIn>
      </div>
    </section>
  )
}

// ============================================
// STORY SECTION
// ============================================

function StorySection() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          <FadeIn>
            <div className="relative h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1000&auto=format&fit=crop"
                alt="Restaurant ambiance"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                quality={90}
              />
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                Notre Histoire
              </h2>
              <div className="space-y-4 text-base sm:text-lg text-gray-600 leading-relaxed text-justify">
                <p>
                  Fondé en 2020, le Restaurant Central est né d&apos;une passion pour la gastronomie 
                  camerounaise et le désir de créer un espace où tradition et modernité se rencontrent.
                </p>
                <p>
                  Notre restaurant est situé au cœur du Quartier Général de Yaoundé, offrant un cadre 
                  élégant et raffiné pour déguster les meilleurs plats de la cuisine locale et internationale.
                </p>
                <p>
                  Nous nous engageons à utiliser uniquement des ingrédients frais et de qualité, 
                  préparés avec soin par notre équipe de chefs expérimentés.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

// ============================================
// VALUES SECTION
// ============================================

const values = [
  {
    icon: Heart,
    title: 'Passion',
    description: 'Une passion authentique pour la gastronomie et le service client d\'exception.',
  },
  {
    icon: Target,
    title: 'Excellence',
    description: 'Nous visons l\'excellence dans chaque plat servi et chaque interaction avec nos clients.',
  },
  {
    icon: Leaf,
    title: 'Qualité',
    description: 'Ingrédients frais, locaux et de première qualité pour une expérience culinaire inoubliable.',
  },
  {
    icon: Users,
    title: 'Tradition',
    description: 'Respect des traditions culinaires camerounaises avec une touche de créativité moderne.',
  },
]

function ValuesSection() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Nos Valeurs
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto text-justify">
              Les principes qui guident notre engagement envers l&apos;excellence culinaire et le service.
            </p>
          </div>
        </FadeIn>

        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {values.map((value, index) => (
            <FadeIn key={value.title} delay={index * 0.1}>
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 text-center">
                <div className="w-16 h-16 bg-[#F4A024]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-[#F4A024]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed text-justify">
                  {value.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

// ============================================
// TEAM SECTION
// ============================================

const teamMembers = [
  {
    name: 'Chef Samuel',
    role: 'Chef Exécutif',
    image: 'https://nlpizsiqsanewubknrsu.supabase.co/storage/v1/object/public/images/images_public/33447.jpg',
    description: '15 ans d\'expérience dans la gastronomie camerounaise et internationale.',
  },
  {
    name: 'Patrice',
    role: 'Directeur de Service',
    image: 'https://nlpizsiqsanewubknrsu.supabase.co/storage/v1/object/public/images/images_public/34939%20%281%29.jpg',
    description: 'Passionné par l\'accueil et l\'expérience client exceptionnelle.',
  },
  {
    name: 'Joseph',
    role: 'Sous-Chef',
    image: 'https://nlpizsiqsanewubknrsu.supabase.co/storage/v1/object/public/images/images_public/62807.jpg',
    description: 'Spécialiste des grillades et des plats traditionnels.',
  },
]

function TeamSection() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Notre Équipe
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto text-justify">
              Rencontrez les talents qui font du Restaurant Central une expérience culinaire unique.
            </p>
          </div>
        </FadeIn>

        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {teamMembers.map((member, index) => (
            <FadeIn key={member.name} delay={index * 0.1}>
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
                <div className="relative h-64 sm:h-72 bg-gradient-to-br from-gray-100 to-gray-200">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={90}
                    unoptimized
                  />
                </div>
                <div className="p-6 sm:p-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                    {member.name}
                  </h3>
                  <p className="text-[#F4A024] font-semibold mb-3">
                    {member.role}
                  </p>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed text-justify">
                    {member.description}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

// ============================================
// ACHIEVEMENTS SECTION
// ============================================

const achievements = [
  { icon: Award, number: '5+', label: 'Années d\'expérience' },
  { icon: Utensils, number: '50+', label: 'Plats au menu' },
  { icon: Users, number: '10K+', label: 'Clients satisfaits' },
  { icon: Clock, number: '24/7', label: 'Service disponible' },
]

function AchievementsSection() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-[#F4A024]/10 to-[#4B4F1E]/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {achievements.map((achievement, index) => (
            <FadeIn key={achievement.label} delay={index * 0.1}>
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <achievement.icon className="w-8 h-8 text-[#F4A024]" />
                </div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                  {achievement.number}
                </div>
                <p className="text-sm sm:text-base text-gray-600 font-medium">
                  {achievement.label}
                </p>
              </div>
            </FadeIn>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <StorySection />
      <ValuesSection />
      <TeamSection />
      <AchievementsSection />
    </>
  )
}
