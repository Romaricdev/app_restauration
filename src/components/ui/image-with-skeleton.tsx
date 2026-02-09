'use client'

import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'
import { cn } from '@/lib/utils'
import { Skeleton } from './skeleton'

export interface ImageWithSkeletonProps extends Omit<ImageProps, 'onLoad'> {
  /** Classe du conteneur (wrapper) */
  containerClassName?: string
  /** Classe du skeleton (par défaut: même taille que le conteneur) */
  skeletonClassName?: string
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void
}

/**
 * Affiche un skeleton pendant le chargement de l'image, puis l'image une fois chargée.
 * À utiliser dans un conteneur avec dimensions (aspect-square, aspect-video, etc.) ou fill.
 */
export function ImageWithSkeleton({
  containerClassName,
  skeletonClassName,
  className,
  onLoad,
  alt,
  ...imageProps
}: ImageWithSkeletonProps) {
  const [loaded, setLoaded] = useState(false)

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setLoaded(true)
    onLoad?.(e)
  }

  const isFill = imageProps.fill === true
  return (
    <div
      className={cn(
        'relative overflow-hidden',
        isFill && 'absolute inset-0',
        containerClassName
      )}
    >
      {/* Skeleton visible tant que l'image n'est pas chargée */}
      {!loaded && (
        <Skeleton
          className={cn('absolute inset-0 w-full h-full', skeletonClassName)}
          variant="pulse"
        />
      )}
      <Image
        {...imageProps}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        onLoad={handleLoad}
      />
    </div>
  )
}
