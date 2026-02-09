/**
 * Client Campay (Mobile Money MTN / Orange) — usage serveur uniquement.
 * Doc : https://demo.campay.net — Erreurs : ER101 (téléphone), ER102 (opérateur), ER201 (montant entier), ER301 (solde).
 * Auth : jeton permanent (CLÉS DE L'APPLICATION) ou username/password pour jeton temporaire.
 */

const CAMPAY_BASE_URL_DEV = 'https://demo.campay.net'
const CAMPAY_BASE_URL_PROD = 'https://api.campay.net'
const API_PREFIX = '/api'

function getBaseUrl(): string {
  if (process.env.CAMPAY_BASE_URL?.trim()) {
    return process.env.CAMPAY_BASE_URL.trim().replace(/\/$/, '')
  }
  return process.env.CAMPAY_ENVIRONMENT === 'PROD'
    ? CAMPAY_BASE_URL_PROD
    : CAMPAY_BASE_URL_DEV
}

let cachedToken: string | null = null
let tokenExpiresAt = 0

export interface CampayCollectInput {
  amount: number
  currency?: string
  from: string
  description: string
  external_reference: string
}

export interface CampayCollectResult {
  reference: string
  status?: string
  transaction_reference?: string
}

export interface CampayTransactionStatus {
  reference: string
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED'
  amount?: number
  currency?: string
  operator?: string
}

/** Retourne le token : CAMPAY_TOKEN (permanent) ou jeton obtenu via username/password. */
async function getToken(): Promise<string> {
  const permanentToken = process.env.CAMPAY_TOKEN?.trim()
  if (permanentToken) {
    return permanentToken
  }
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken
  }
  const username = process.env.CAMPAY_APP_USERNAME
  const password = process.env.CAMPAY_APP_PASSWORD
  if (!username || !password) {
    throw new Error(
      'Configurez CAMPAY_TOKEN (jeton permanent dans CLÉS DE L\'APPLICATION) ou CAMPAY_APP_USERNAME et CAMPAY_APP_PASSWORD'
    )
  }
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}${API_PREFIX}/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Campay token failed: ${res.status} ${text}`)
  }
  const data = (await res.json()) as { token?: string }
  if (!data.token) {
    throw new Error('Campay token response missing token')
  }
  cachedToken = data.token
  tokenExpiresAt = Date.now() + 55 * 60 * 1000
  return cachedToken
}

/**
 * Lance un collect (demande de paiement sur le téléphone du client).
 * ER101 : téléphone doit commencer par l'indicatif pays (ex. 237xxxxxxxxx).
 * ER201 : montant entier, pas de décimales.
 */
export async function campayCollect(input: CampayCollectInput): Promise<CampayCollectResult> {
  const token = await getToken()
  const baseUrl = getBaseUrl()
  const from = input.from.replace(/\s/g, '').replace(/^\+/, '')
  const amount = Math.round(Number(input.amount))
  if (Number.isNaN(amount) || amount <= 0) {
    throw new Error('Campay collect: amount must be a positive integer')
  }
  const body = {
    amount,
    currency: input.currency ?? 'XAF',
    from: from.startsWith('237') ? from : `237${from.replace(/^0/, '')}`,
    description: input.description,
    external_reference: input.external_reference,
  }
  const res = await fetch(`${baseUrl}${API_PREFIX}/collect/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let data: {
    reference?: string
    status?: string
    transaction_reference?: string
    error?: string
    message?: string
    detail?: string
  } = {}
  try {
    data = text ? (JSON.parse(text) as typeof data) : {}
  } catch {
    // Réponse non-JSON (ex. page d'erreur HTML)
  }
  if (!res.ok) {
    const msg =
      data.error ?? data.message ?? data.detail ?? text?.slice(0, 200) ?? `Campay collect: ${res.status}`
    throw new Error(msg)
  }
  if (!data.reference) {
    throw new Error(data.error ?? data.message ?? 'Campay collect: pas de reference dans la reponse')
  }
  return {
    reference: data.reference,
    status: data.status,
    transaction_reference: data.transaction_reference,
  }
}

/**
 * Vérifie l'état d'une transaction collect (paiement Mobile Money).
 * Doc Campay : GET /api/transaction/(reference)/ — pas utilities/transaction (réservé airtime).
 */
export async function campayGetTransactionStatus(reference: string): Promise<CampayTransactionStatus> {
  const token = await getToken()
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}${API_PREFIX}/transaction/${encodeURIComponent(reference)}/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
  })
  const text = await res.text()
  let data: {
    reference?: string
    status?: string
    amount?: number
    currency?: string
    operator?: string
    message?: string
  } = {}
  try {
    data = text ? (JSON.parse(text) as typeof data) : {}
  } catch {
    if (!res.ok) {
      throw new Error(`Campay transaction status failed: ${res.status} ${text?.slice(0, 100)}`)
    }
  }
  if (!res.ok) {
    const msg = (data as { message?: string }).message ?? text?.slice(0, 200) ?? `Campay transaction status: ${res.status}`
    throw new Error(msg)
  }
  const status = (data.status as CampayTransactionStatus['status']) ?? 'PENDING'
  return {
    reference: data.reference ?? reference,
    status: status === 'SUCCESSFUL' || status === 'FAILED' ? status : 'PENDING',
    amount: data.amount,
    currency: data.currency,
    operator: data.operator,
  }
}
