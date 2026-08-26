import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default function WorkspaceAccessRequiredPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f4ed] px-5 py-16 text-[#071d39]">
      <section className="w-full max-w-xl rounded-2xl border border-[#d8d5cc] bg-white p-8 shadow-[0_24px_80px_rgba(7,29,57,0.08)] sm:p-10">
        <span className="flex size-11 items-center justify-center rounded-xl bg-[#e0f1eb] text-[#237161]">
          <ShieldAlert className="size-5" aria-hidden="true" />
        </span>
        <p className="mt-7 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#64727b]">
          Protected workspace
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">
          Your Traceli role is not assigned yet.
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#64727b]">
          Ask your workspace administrator to assign a procurement, panel, director, auditor, or workspace-admin role. No procurement data has been opened.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/demo" className="rounded-lg bg-[#071d39] px-5 py-3 text-sm font-semibold text-white">
            Open fictional demo
          </Link>
          <Link href="/" className="rounded-lg border border-[#cfd3d1] px-5 py-3 text-sm font-semibold">
            Back to Traceli
          </Link>
        </div>
      </section>
    </main>
  )
}
