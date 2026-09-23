import Link from 'next/link'

const linkClass =
  'inline-flex min-h-11 items-center rounded-lg px-5 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#071d39]'

export function AuthClosedNote({
  title,
  lede,
  unavailable,
}: {
  title: string
  lede: string
  unavailable?: boolean
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f4ed] px-5 py-16 text-[#071d39]">
      <section className="w-full max-w-xl rounded-2xl border border-[#d8d5cc] bg-white p-8 shadow-[0_24px_80px_rgba(7,29,57,0.08)] sm:p-10">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#64727b]">
          Trace-li
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">{title}</h1>
        <p className="mt-4 text-sm leading-6 text-[#64727b]">{lede}</p>
        {unavailable ? (
          <p className="mt-4 text-sm leading-6 text-[#64727b]" role="status">
            Sign-in is not turned on in this environment. The public Award desk walkthrough stays open.
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login" className={`${linkClass} bg-[#071d39] text-white`}>
            Sign in
          </Link>
          <Link href="/demo" className={`${linkClass} border border-[#cfd3d1]`}>
            Open the public walkthrough
          </Link>
        </div>
      </section>
    </main>
  )
}

export function authUnavailable(value: string | string[] | undefined) {
  return value === 'unavailable'
}
