export const CASE_CARD_ORIGIN = 'https://www.trace-li.com'
export const CASE_CARD_SOCIAL_DESCRIPTION_LIMIT = 200

const CASE_CARD_IMAGES = {
  'global-fund': {
    url: '/research/global-fund/charts/06-value-chain-map.png',
    width: 2430,
    height: 1467,
    alt: 'Trace-li value-chain map: intake, rule map, evidence gaps, judgment, and freeze.',
  },
  unfpa: {
    url: '/research/unfpa/charts/04-value-chain-map.png',
    width: 1694,
    height: 896,
    alt: 'Trace-li value-chain map for UNFPA OAIS gaps: intake, rule map, evidence gaps, judgment, and freeze.',
  },
  'ocha-cbpf': {
    url: '/research/ocha-cbpf/charts/06-value-chain-map.png',
    width: 1694,
    height: 896,
    alt: 'Trace-li value-chain map for OCHA CBPF gaps: intake, rule map, evidence gaps, judgment, and freeze.',
  },
} as const

type CaseCardImagePack = keyof typeof CASE_CARD_IMAGES

export function trimSocialDescription(text: string, limit = CASE_CARD_SOCIAL_DESCRIPTION_LIMIT) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= limit) return normalized
  const room = limit - 1
  const slice = normalized.slice(0, room)
  const boundary = slice.lastIndexOf(' ')
  const head = (boundary > 0 ? slice.slice(0, boundary) : slice).replace(/[\s.,;:]+$/u, '')
  return `${head}…`
}

export function caseCardSocialMetadata(card: {
  slug: string
  title: string
  lede: string
  publicationState: 'published' | 'awaiting_founder_freeze'
  packsInForce: readonly { packId: string }[]
}) {
  const packId = card.packsInForce[0]?.packId
  if (!packId || !(packId in CASE_CARD_IMAGES)) {
    throw new Error(`No case-card social image for pack ${packId ?? 'unknown'}.`)
  }
  const image = CASE_CARD_IMAGES[packId as CaseCardImagePack]
  const title = `${card.title} — Trace-li`
  const description = trimSocialDescription(card.lede)
  const url = `${CASE_CARD_ORIGIN}/cases/${card.slug}`
  const indexable = card.publicationState === 'published'
  return {
    title,
    description,
    url,
    image,
    robots: { index: indexable, follow: true as const },
    openGraph: {
      type: 'article' as const,
      title,
      description,
      url,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images: [image],
    },
  }
}
