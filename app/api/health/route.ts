export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json(
    {
      service: 'traceli',
      status: 'ok',
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}
