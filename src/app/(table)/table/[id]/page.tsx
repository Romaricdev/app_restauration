'use client'

import { use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent, Button, Badge } from '@/components/ui'

const SITE_LOGO_URL = 'https://nlpizsiqsanewubknrsu.supabase.co/storage/v1/object/public/images/images_public/logo.png'

interface TablePageProps {
  params: Promise<{ id: string }>
}

export default function TablePage({ params }: TablePageProps) {
  const { id } = use(params)
  const tableNumber = parseInt(id, 10)

  return (
    <div className="min-h-screen bg-gradient-to-br from-site-olive-accent to-[#2D2F12] flex items-center justify-center p-6">
      <Card variant="elevated" className="max-w-md w-full p-8 text-center">
        {/* Logo du site */}
        <div className="relative w-36 h-12 sm:w-44 sm:h-14 mx-auto mb-6">
          <Image
            src={SITE_LOGO_URL}
            alt=""
            fill
            className="object-contain"
            priority
            sizes="(max-width: 640px) 144px, 176px"
            unoptimized
          />
        </div>

        {/* Title */}
        <h1 className="font-poppins text-2xl font-bold text-site-text-primary mb-2">
          Bienvenue au Restaurant Central
        </h1>
        
        <p className="text-site-text-secondary mb-6">
          Vous êtes installé à la
        </p>

        {/* Table Number */}
        <div className="mb-8">
          <Badge
            variant="default"
            size="lg"
            className="text-2xl px-6 py-3 font-bold bg-[#4B4F1E]/10 text-[#4B4F1E]"
          >
            Table {tableNumber}
          </Badge>
        </div>

        {/* Instructions */}
        <CardContent className="bg-site-background-muted rounded-xl p-6 mb-8 text-left">
          <h3 className="font-semibold text-site-text-primary mb-3">
            Comment commander ?
          </h3>
          <ol className="space-y-2 text-sm text-site-text-secondary">
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-site-primary text-white text-xs flex items-center justify-center flex-shrink-0">1</span>
              Parcourez notre menu
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-site-primary text-white text-xs flex items-center justify-center flex-shrink-0">2</span>
              Ajoutez vos plats au panier
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-site-primary text-white text-xs flex items-center justify-center flex-shrink-0">3</span>
              Validez votre commande
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-site-primary text-white text-xs flex items-center justify-center flex-shrink-0">4</span>
              Nous vous servons à table !
            </li>
          </ol>
        </CardContent>

        {/* CTA */}
        <Link href={`/table/${id}/menu`}>
          <Button variant="site-primary" size="lg" className="w-full gap-2">
            Voir le menu
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>

        {/* Footer */}
        <p className="text-xs text-site-text-secondary mt-6">
          Besoin d&apos;aide ? Appelez un serveur.
        </p>
      </Card>
    </div>
  )
}
