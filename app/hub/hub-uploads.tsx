'use client'

import { useEffect, useId, useState, type FormEvent } from 'react'

import {
  addHubUpload,
  HUB_FILE_ACCEPT,
  HUB_UPLOAD_CAP,
  hubUploadNote,
  newHubId,
  parseHubUpload,
  readHubLibrary,
  removeHubUpload,
  shortContentHash,
  writeHubLibrary,
  type HubUpload,
} from '@/lib/hub/library'

import s from '../desk/desk.module.css'

async function hashFile(file: File) {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export default function HubUploads({ organizationId }: { organizationId: string }) {
  const labelId = useId()
  const [ready, setReady] = useState(false)
  const [uploads, setUploads] = useState<HubUpload[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileLabel, setFileLabel] = useState<string | null>(null)

  useEffect(() => {
    setUploads(readHubLibrary(organizationId).uploads)
    setReady(true)
  }, [organizationId])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const form = event.currentTarget
    const data = new FormData(form)
    const file = data.get('manual')
    if (!(file instanceof File) || file.size < 1) {
      setError('Choose a file to add.')
      return
    }
    setPending(true)
    setError(null)
    try {
      const contentHash = await hashFile(file)
      const parsed = parseHubUpload({
        id: newHubId('upload'),
        fileName: file.name,
        byteLength: file.size,
        contentHash,
        uploadedAt: new Date().toISOString(),
        label: String(data.get('label') ?? ''),
      })
      if (!parsed.ok) {
        setError(parsed.error)
        return
      }
      const next = addHubUpload(readHubLibrary(organizationId), parsed.upload)
      if (next === 'full') {
        setError(`This hub holds ${HUB_UPLOAD_CAP} manuals. Remove one to add another.`)
        return
      }
      if (next === 'duplicate') {
        setError('That manual is already on the hub.')
        return
      }
      writeHubLibrary(next)
      setUploads(next.uploads)
      form.reset()
      setFileLabel(null)
    } catch {
      setError('The file could not be read. Nothing was stored.')
    } finally {
      setPending(false)
    }
  }

  function remove(id: string) {
    const next = removeHubUpload(readHubLibrary(organizationId), id)
    writeHubLibrary(next)
    setUploads(next.uploads)
  }

  return (
    <section className={`${s.section} ${s.sectionQuiet}`} aria-labelledby="org-manuals">
      <h2 id="org-manuals">Your manuals (optional)</h2>
      {!ready ? <p className={s.empty}>Loading manuals…</p> : null}
      {ready && uploads.length === 0 ? (
        <p className={s.empty} data-testid="hub-upload-empty">
          You can start a tender with a seeded pack alone. Add a procurement manual or donor guideline when you want it listed as a condition in play. Uploads are not compiled into pack rules yet.
        </p>
      ) : null}
      {uploads.length > 0 ? (
        <>
          <p className={s.help} data-testid="hub-upload-honesty">{hubUploadNote}</p>
          <ul className={s.uploadList} data-testid="hub-upload-list">
            {uploads.map(upload => (
              <li key={upload.id} className={s.uploadItem}>
                <div>
                  <p className={s.tag}>Not a pack rule yet</p>
                  <strong>{upload.label}</strong>
                  <p className={s.help}>
                    {upload.fileName} · {shortContentHash(upload.contentHash)}
                    {' · '}file bytes are not stored
                  </p>
                </div>
                <button className={s.secondary} type="button" onClick={() => remove(upload.id)}>
                  Remove <span className={s.visuallyHidden}>{upload.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {ready && uploads.length >= HUB_UPLOAD_CAP ? (
        <p className={s.help}>This hub holds {HUB_UPLOAD_CAP} manuals. Remove one to add another.</p>
      ) : null}
      {ready && uploads.length < HUB_UPLOAD_CAP ? (
        <details className={s.quietDetails}>
          <summary>Add a manual</summary>
          <form className={`${s.card} ${s.quietCard} ${s.uploadForm}`} onSubmit={onSubmit} aria-busy={pending}>
          <div className={s.file}>
            <label className={s.fileLegend} htmlFor="hub-manual">Manual or guideline</label>
            <div className={s.fileControl}>
              <input
                id="hub-manual"
                className={s.fileInput}
                name="manual"
                type="file"
                required
                disabled={pending}
                accept={HUB_FILE_ACCEPT}
                aria-describedby="hub-manual-help"
                onChange={event => {
                  const file = event.currentTarget.files?.[0]
                  setFileLabel(file && file.size > 0 ? file.name : null)
                }}
              />
              <label className={s.fileButton} htmlFor="hub-manual">Choose file</label>
              <span className={s.fileName} data-empty={fileLabel ? undefined : 'true'}>
                {fileLabel ?? 'No file selected'}
              </span>
            </div>
            <span className={s.help} id="hub-manual-help">PDF, Word, Excel, email, text, or image. Up to 8 MB.</span>
          </div>
          <div className={s.named}>
            <label className={s.fieldLabel} htmlFor={labelId}>Label</label>
            <input id={labelId} className={s.textInput} name="label" type="text" maxLength={80} placeholder="Procurement manual" disabled={pending} />
            <p className={s.help}>Optional. The file name is used when this is blank.</p>
          </div>
          {error ? <p className={s.alert} role="alert">{error}</p> : null}
          <div className={s.actions}>
            <button className={s.secondary} type="submit" disabled={pending}>
              {pending ? 'Adding…' : 'Add manual'}
            </button>
          </div>
          </form>
        </details>
      ) : null}
    </section>
  )
}
