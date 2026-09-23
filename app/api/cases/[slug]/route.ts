import { getCaseCard, listCaseCardSlugs } from '@/lib/case-cards/catalog'

type RouteParams = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return listCaseCardSlugs().map(slug => ({ slug }))
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { slug } = await params
  const card = getCaseCard(slug)
  if (!card) {
    return Response.json(
      { schemaVersion: 'case-card-export-v1', error: 'not_found', slug },
      { status: 404, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } },
    )
  }
  const published = card.publicationState === 'published'
  return Response.json(card, {
    headers: {
      'Cache-Control': published ? 'public, max-age=300' : 'public, max-age=60',
      'X-Robots-Tag': published ? 'index, follow' : 'noindex, nofollow',
      'X-Trace-Li-Record-Kind': card.recordKind,
    },
  })
}
