'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { FadeIn, Stagger } from '@/components/animations'
import { BaseModal } from '@/components/modals'

// ============================================
// MOCK GALLERY DATA
// ============================================

const galleryImages = [
  {
    id: 1,
    src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800&auto=format&fit=crop',
    title: 'Intérieur du restaurant',
    category: 'Restaurant',
  },
  {
    id: 2,
    src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop',
    title: 'Salle principale',
    category: 'Restaurant',
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop',
    title: 'Plat signature - Poulet DG',
    category: 'Cuisine',
  },
  {
    id: 4,
    src: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop',
    title: 'Dessert maison',
    category: 'Cuisine',
  },
  {
    id: 5,
    src: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800&auto=format&fit=crop',
    title: 'Événement privé',
    category: 'Événements',
  },
  {
    id: 6,
    src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop',
    title: 'Terrasse extérieure',
    category: 'Restaurant',
  },
  {
    id: 7,
    src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop',
    title: 'Ndolé Royal',
    category: 'Cuisine',
  },
  {
    id: 8,
    src: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop',
    title: 'Bar à cocktails',
    category: 'Restaurant',
  },
  {
    id: 9,
    src: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800&auto=format&fit=crop',
    title: 'Mariage au restaurant',
    category: 'Événements',
  },
]

const categories = ['Tous', 'Restaurant', 'Cuisine', 'Événements']

// ============================================
// HERO SECTION
// ============================================

function GalleryHero() {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-[#F4A024]/5 via-white to-[#4B4F1E]/5 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F4A024]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#4B4F1E]/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn delay={0.1}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            Galerie Photos
          </h1>
        </FadeIn>
        <FadeIn delay={0.2} direction="up">
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed text-justify">
            Découvrez l&apos;ambiance, les plats et les événements du Restaurant Central à travers notre galerie.
          </p>
        </FadeIn>
      </div>
    </section>
  )
}

// ============================================
// IMAGE MODAL
// ============================================

interface ImageModalProps {
  image: typeof galleryImages[0] | null
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
  hasPrevious: boolean
  hasNext: boolean
}

function ImageModal({ image, onClose, onPrevious, onNext, hasPrevious, hasNext }: ImageModalProps) {
  if (!image) return null

  return (
    <BaseModal
      open={!!image}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={image.title}
      description={image.category}
      maxWidth="2xl"
      showCloseButton={false}
      footer={null}
    >
      <div className="relative w-full h-full flex items-center justify-center bg-black/95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          aria-label="Fermer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Navigation Buttons */}
        {hasPrevious && (
          <button
            onClick={onPrevious}
            className="absolute left-4 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            aria-label="Image précédente"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {hasNext && (
          <button
            onClick={onNext}
            className="absolute right-4 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            aria-label="Image suivante"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Image */}
        <div className="relative w-full h-full max-w-7xl mx-auto px-4 flex items-center justify-center">
          <div className="relative w-full h-full max-h-[90vh]">
            <Image
              src={image.src}
              alt={image.title}
              fill
              className="object-contain"
              sizes="100vw"
              quality={95}
            />
          </div>
        </div>

        {/* Image Info */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 text-white text-center">
          <h3 className="text-lg font-semibold">{image.title}</h3>
          <p className="text-sm opacity-90">{image.category}</p>
        </div>
      </div>
    </BaseModal>
  )
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState('Tous')
  const [selectedImage, setSelectedImage] = useState<typeof galleryImages[0] | null>(null)

  const filteredImages = selectedCategory === 'Tous'
    ? galleryImages
    : galleryImages.filter(img => img.category === selectedCategory)

  const currentIndex = selectedImage ? filteredImages.findIndex(img => img.id === selectedImage.id) : -1

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setSelectedImage(filteredImages[currentIndex - 1])
    }
  }

  const handleNext = () => {
    if (currentIndex < filteredImages.length - 1) {
      setSelectedImage(filteredImages[currentIndex + 1])
    }
  }

  return (
    <>
      <GalleryHero />

      {/* Category Filter */}
      <section className="py-8 bg-white border-b border-gray-200 sticky top-[80px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex-shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap min-h-[44px] ${
                  selectedCategory === category
                    ? 'bg-[#F4A024] text-white shadow-lg shadow-[#F4A024]/25'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-[#F4A024]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredImages.length > 0 ? (
            <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {filteredImages.map((image, index) => (
                <FadeIn key={image.id} delay={index * 0.05}>
                  <button
                    onClick={() => setSelectedImage(image)}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                  >
                    <Image
                      src={image.src}
                      alt={image.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      quality={85}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-center px-4">
                        <p className="font-semibold text-lg mb-1">{image.title}</p>
                        <p className="text-sm opacity-90">{image.category}</p>
                      </div>
                    </div>
                  </button>
                </FadeIn>
              ))}
            </Stagger>
          ) : (
            <FadeIn>
              <div className="text-center py-16">
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Aucune image dans cette catégorie
                </p>
                <p className="text-gray-600">
                  Sélectionnez une autre catégorie pour voir plus de photos.
                </p>
              </div>
            </FadeIn>
          )}
        </div>
      </section>

      {/* Image Modal */}
      <ImageModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={currentIndex > 0}
        hasNext={currentIndex < filteredImages.length - 1}
      />
    </>
  )
}
