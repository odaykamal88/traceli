'use client'

import { useEffect, useId, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import {
  addHubEngagement,
  deskTenderContext,
  newHubId,
  parseHubEngagement,
  readHubLibrary,
  writeHubLibrary,
  type DonorPackId,
  type HubUpload,
} from '@/lib/hub/library'

import s from '../../desk/desk.module.css'

export type TenderSeed = {
  packId: DonorPackId
  name: string
  version: string
  summary: string
}

export default function NewTender({
  organizationId,
  seeds,
}: {
  organizationId: string
  seeds: TenderSeed[]
}) {
  const router = useRouter()
  const nameId = useId()
  const [ready, setReady] = useState(false)
  const [uploads, setUploads] = useState<HubUpload[]>([])
  const [packId, setPackId] = useState<DonorPackId | ''>('')
  const [attached, setAttached] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    setUploads(readHubLibrary(organizationId).uploads)
    setReady(true)
  }, [organizationId])

  function toggle(id: string) {
    setAttached(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const form = new FormData(event.currentTarget)
    const library = readHubLibrary(organizationId)
    const parsed = parseHubEngagement({
      id: newHubId('eng'),
      name: String(form.get('name') ?? ''),
      primaryPackId: packId,
      attachedUploadIds: attached,
      knownUploadIds: library.uploads.map(upload => upload.id),
      createdAt: new Date().toISOString(),
    })
    if (!parsed.ok) {
      setError(parsed.error)
      return
    }
    const next = addHubEngagement(library, parsed.engagement)
    writeHubLibrary(next)
    const stored = deskTenderContext(next, parsed.engagement.id)
    if (!stored) {
      setError('The tender could not be saved.')
      return
    }
    setPending(true)
    router.push(`/desk?pack=${stored.primaryPackId}&engagement=${stored.id}`)
  }

  return (
    <form className={s.card} onSubmit={onSubmit} data-testid="tender-form">
      <div className={s.named}>
        <label className={s.fieldLabel} htmlFor={nameId}>Tender name</label>
        <input
          id={nameId}
          className={s.textInput}
          name="name"
          type="text"
          required
          maxLength={80}
          autoComplete="off"
          placeholder="Kenya shelter kits"
        />
        <p className={s.help}>This name is the procurement reference on the freeze.</p>
      </div>
      <fieldset>
        <legend>Trace-li pack</legend>
        <p className={s.help}>One pack drives judgment. Trace-li runs that pack only.</p>
        <div className={s.packs}>
          {seeds.map(seed => (
            <label className={s.pack} key={seed.packId}>
              <input
                type="radio"
                name="primaryPack"
                value={seed.packId}
                required
                checked={packId === seed.packId}
                onChange={() => {
                  setPackId(seed.packId)
                  setError(null)
                }}
              />
              <span>
                <strong>{seed.name}</strong>
                <span>{seed.summary} Version {seed.version}.</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Hub manuals (optional)</legend>
        <p className={s.help}>Optional. Attach these only as conditions in play. They are not evaluated as pack rules.</p>
        {!ready ? <p className={s.help}>Loading manuals…</p> : null}
        {ready && uploads.length === 0 ? (
          <p className={s.help} data-testid="tender-no-uploads">
            No manuals yet. A seeded pack alone is enough.
          </p>
        ) : null}
        {uploads.length > 0 ? (
          <div className={s.packs}>
            {uploads.map(upload => (
              <label className={s.pack} key={upload.id}>
                <input
                  type="checkbox"
                  name="upload"
                  value={upload.id}
                  checked={attached.includes(upload.id)}
                  onChange={() => toggle(upload.id)}
                />
                <span>
                  <strong>{upload.label}</strong>
                  <span>Not a pack rule. {upload.fileName}</span>
                </span>
              </label>
            ))}
          </div>
        ) : null}
      </fieldset>
      {error ? <p className={s.alert} role="alert">{error}</p> : null}
      <div className={s.actions}>
        <button className={s.primary} type="submit" disabled={!ready || pending}>
          {pending ? 'Opening the award desk…' : 'Continue to award desk'}
        </button>
      </div>
    </form>
  )
}
