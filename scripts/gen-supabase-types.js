#!/usr/bin/env node
/**
 * Génère les types TypeScript depuis le schéma Supabase.
 * Prérequis: supabase login, .env.local avec NEXT_PUBLIC_SUPABASE_URL.
 * Usage: npm run gen:types
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const root = path.resolve(__dirname, '..')
const envPath = path.join(root, '.env.local')
const outPath = path.join(root, 'src/lib/supabase/database.types.generated.ts')

function readEnv() {
  let content
  try {
    content = fs.readFileSync(envPath, 'utf8')
  } catch {
    console.error('[gen:types] .env.local introuvable. Copiez .env.example en .env.local et définissez NEXT_PUBLIC_SUPABASE_URL.')
    process.exit(1)
  }
  const m = content.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)/m)
  const raw = m ? m[1].trim().replace(/^["']|["']$/g, '') : ''
  if (!raw) {
    console.error('[gen:types] NEXT_PUBLIC_SUPABASE_URL manquant dans .env.local.')
    process.exit(1)
  }
  return raw
}

function extractProjectRef(url) {
  try {
    const u = new URL(url)
    if (u.hostname.endsWith('.supabase.co')) {
      return u.hostname.replace('.supabase.co', '')
    }
  } catch {}
  console.error('[gen:types] URL Supabase invalide. Attendu: https://xxxx.supabase.co')
  process.exit(1)
}

function main() {
  const url = readEnv()
  const projectRef = extractProjectRef(url)

  try {
    const stdout = execSync(
      `npx supabase gen types typescript --project-id "${projectRef}"`,
      { encoding: 'utf8', cwd: root, stdio: ['inherit', 'pipe', 'inherit'] }
    )
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, stdout)
  } catch (e) {
    console.error('[gen:types] Échec. Vérifiez: supabase login, schéma déployé, project-id correct.')
    process.exit(1)
  }
}

main()
