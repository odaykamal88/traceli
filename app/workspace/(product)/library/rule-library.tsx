'use client'

import Link from 'next/link'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  addCatalogPack,
  boardPacks,
  catalogAvailable,
  categoryLabel,
  createUploadPack,
  inForcePacks,
  nextUploadId,
  ruleLibraryCategories,
  ruleLibraryStorageKey,
  sanitizeStoredBoard,
  seedRuleLibraryBoard,
  serializeBoard,
  scriptedUploadMapping,
  toggleOrgDefault,
  toggleShowOnRecord,
  type RuleLibraryCategoryId,
  type RuleLibraryPack,
} from '@/lib/rule-library'
import { workspaceProductPaths } from '@/lib/workspace-product'
import { notifyRuleLibraryChange } from '../product-shell'
import s from '../product.module.css'

type Screen = 'home' | 'detail' | 'upload'
type DrawerPane = 'choices' | 'catalog'
type CategoryFilter = 'all' | RuleLibraryCategoryId

function readBoard(): RuleLibraryPack[] {
  try {
    const raw = sessionStorage.getItem(ruleLibraryStorageKey)
    return sanitizeStoredBoard(raw ? JSON.parse(raw) : null)
  } catch {
    return seedRuleLibraryBoard()
  }
}

function writeBoard(board: RuleLibraryPack[]) {
  sessionStorage.setItem(ruleLibraryStorageKey, JSON.stringify(serializeBoard(board)))
  notifyRuleLibraryChange()
}

function Toggle({
  on,
  onClick,
  label,
  small = false,
}: {
  on: boolean
  onClick: () => void
  label: string
  small?: boolean
}) {
  return (
    <button
      type="button"
      className={`${s.toggle} ${on ? s.toggleOn : ''} ${small ? s.toggleSm : ''}`}
      aria-pressed={on}
      aria-label={label}
      onClick={onClick}
    />
  )
}

export default function RuleLibrary() {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const filterId = useId()
  const uploadCategoryId = useId()
  const [board, setBoard] = useState<RuleLibraryPack[]>(seedRuleLibraryBoard)
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [screen, setScreen] = useState<Screen>('home')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [drawer, setDrawer] = useState<DrawerPane | null>(null)
  const [toast, setToast] = useState('')
  const [uploadStep, setUploadStep] = useState<1 | 2 | 3>(1)
  const [uploadFileName, setUploadFileName] = useState('governing-source.pdf')
  const [uploadCategory, setUploadCategory] = useState<RuleLibraryCategoryId>('procurement')
  const [uploadOrgDefault, setUploadOrgDefault] = useState(true)
  const [uploadDrag, setUploadDrag] = useState(false)
  const [processingLabel, setProcessingLabel] = useState('Reading source')

  const persist = useCallback((next: RuleLibraryPack[]) => {
    setBoard(next)
    writeBoard(next)
  }, [])

  useEffect(() => {
    setBoard(readBoard())
  }, [])

  useEffect(() => {
    headingRef.current?.focus()
  }, [screen, detailId])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(''), 2200)
    return () => window.clearTimeout(id)
  }, [toast])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (drawer === 'catalog') {
        event.preventDefault()
        setDrawer('choices')
        return
      }
      if (drawer) {
        event.preventDefault()
        setDrawer(null)
        return
      }
      if (screen !== 'home') {
        event.preventDefault()
        setScreen('home')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawer, screen])

  const force = inForcePacks(board)
  const listed = boardPacks(board, category)
  const available = catalogAvailable(board)
  const detail = detailId ? board.find(pack => pack.id === detailId) : null
  const mapped = scriptedUploadMapping(uploadFileName)

  function openDetail(id: string) {
    setDetailId(id)
    setScreen('detail')
    setDrawer(null)
  }

  function startUpload(fileName: string) {
    setDrawer(null)
    setUploadFileName(fileName || 'governing-source.pdf')
    setUploadOrgDefault(true)
    setUploadCategory('procurement')
    setUploadStep(2)
    setProcessingLabel(`Reading ${fileName || 'governing-source.pdf'}`)
    setScreen('upload')
    window.setTimeout(() => setProcessingLabel('Finding clauses…'), 600)
    window.setTimeout(() => setProcessingLabel('Drafting obligations…'), 1200)
    window.setTimeout(() => setUploadStep(3), 2000)
  }

  function saveUpload() {
    const pack = createUploadPack({
      id: nextUploadId(board),
      fileName: uploadFileName,
      category: uploadCategory,
      orgDefault: uploadOrgDefault,
    })
    persist([pack, ...board.map(item => ({ ...item }))])
    setScreen('home')
    setToast(uploadOrgDefault ? 'Saved · on for tonight' : 'Saved · off until you flip it on')
  }

  return (
    <>
      {screen === 'home' && (
        <section className={s.screen} aria-labelledby="library-title">
          <div className={s.homeTop}>
            <div>
              <p className={s.eyebrow}>Rule library</p>
              <h1 id="library-title" ref={headingRef} tabIndex={-1} className={s.hero}>What is checking tonight?</h1>
            </div>
            <div className={s.homeActions}>
              <button type="button" className={`${s.btn} ${s.btnSecondary}`} onClick={() => setDrawer('choices')}>Add a pack</button>
              <Link className={s.linkish} href={workspaceProductPaths.awardPrep}>See how this shows on Award desk</Link>
            </div>
          </div>
          <p className={s.heroHelp}>
            These are the rule packs Trace may cite when reconstructing an award.
            Flip one off and overnight prep will stop using it.
          </p>
          <div className={s.toolbar}>
            <p className={s.inforceCount} data-testid="inforce-count">
              <strong>{force.length}</strong> pack{force.length === 1 ? '' : 's'} in force tonight
              {category !== 'all' ? ` · showing ${categoryLabel(category)}` : ''}
            </p>
            <div className={s.quietFilter}>
              <label htmlFor={filterId}>Category</label>
              <select
                id={filterId}
                aria-label="Filter by category"
                value={category}
                onChange={event => setCategory(event.target.value as CategoryFilter)}
              >
                <option value="all">All</option>
                {ruleLibraryCategories.map(item => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </div>
          </div>
          {listed.length === 0 ? (
            <div className={s.empty}>
              <strong>{board.some(pack => pack.onBoard) ? 'Nothing in this category' : 'Nothing checking tonight yet'}</strong>
              {board.some(pack => pack.onBoard)
                ? 'Try All, or add a pack from the Trace catalog.'
                : 'Add a pack from the Trace catalog, or upload one of your own.'}
              <br />
              <button type="button" className={`${s.btn} ${s.btnSecondary} ${s.btnSm}`} onClick={() => setDrawer('choices')}>Add a pack</button>
            </div>
          ) : (
            <div className={s.switchboard} role="list" data-testid="rule-switchboard">
              {listed.map(pack => (
                <div className={s.sbRow} role="listitem" key={pack.id}>
                  <button type="button" className={s.sbMain} onClick={() => openDetail(pack.id)}>
                    <div className={s.sbName}>{pack.name}</div>
                    <div className={s.sbPlain}>{pack.plain}</div>
                    <div className={s.sbMeta}>
                      <span className={s.catTag}>{categoryLabel(pack.category)}</span>
                      <span className={s.illustTag}>{pack.curated ? 'Illustrative' : 'Your upload'}</span>
                    </div>
                  </button>
                  <div className={s.toggleCol}>
                    <Toggle
                      on={pack.orgDefault}
                      label={`Turn ${pack.name} ${pack.orgDefault ? 'off' : 'on'}`}
                      onClick={() => {
                        const next = toggleOrgDefault(board, pack.id)
                        persist(next)
                        const updated = next.find(item => item.id === pack.id)
                        setToast(updated?.orgDefault
                          ? 'On — overnight prep may cite this pack'
                          : 'Off — overnight prep will stop using it')
                      }}
                    />
                    <span className={`${s.onOff} ${pack.orgDefault ? s.onOffIsOn : ''}`}>{pack.orgDefault ? 'On' : 'Off'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className={s.demoNote}>Workspace · Fictional data · Illustrative packs, not official text</p>
        </section>
      )}

      {screen === 'detail' && detail && (
        <section className={s.screen} aria-labelledby="pack-title">
          <div className={s.backLink}>
            <button type="button" className={`${s.btn} ${s.btnGhost}`} onClick={() => setScreen('home')}>← Back</button>
          </div>
          <div className={s.detailLayout}>
            <div className={s.detailMain}>
              <div className={s.card}>
                <p className={s.eyebrow}>{categoryLabel(detail.category)}</p>
                <h1 id="pack-title" ref={headingRef} tabIndex={-1} className={s.hero} style={{ fontSize: 24, marginBottom: 6 }}>{detail.name}</h1>
                <p className={s.muted} style={{ fontSize: 14.5, maxWidth: '48ch', marginBottom: 4 }}>{detail.plain}</p>
                {detail.curated ? <p className={s.illustTag} style={{ marginBottom: 8 }}>Illustrative · not official text</p> : null}
                <dl className={s.metaGrid}>
                  <div><dt>Version</dt><dd>{detail.version}</dd></div>
                  <div><dt>Effective</dt><dd>{detail.effective}</dd></div>
                  <div><dt>Tonight</dt><dd>{detail.orgDefault ? 'In force' : 'Off'}</dd></div>
                  <div><dt>Last used</dt><dd>{detail.lastUsed || '—'}</dd></div>
                </dl>
                <div className={s.controlsBlock}>
                  <div className={s.controlRow}>
                    <div>
                      <div className={s.ctlTitle}>Org default</div>
                      <div className={s.ctlHint}>On = Trace may use this pack for new awards unless you scope it out on the desk.</div>
                    </div>
                    <Toggle
                      small
                      on={detail.orgDefault}
                      label={`Org default for ${detail.name}`}
                      onClick={() => {
                        const next = toggleOrgDefault(board, detail.id)
                        persist(next)
                        const updated = next.find(item => item.id === detail.id)
                        setToast(updated?.orgDefault
                          ? 'Org default on — available for new awards'
                          : 'Off — past decision records keep their frozen packs')
                      }}
                    />
                  </div>
                  <div className={s.controlRow}>
                    <div>
                      <div className={s.ctlTitle}>Show on record</div>
                      <div className={s.ctlHint}>When on, this pack can appear on the shareable decision record.</div>
                    </div>
                    <Toggle
                      small
                      on={detail.showOnRecord}
                      label={`Show ${detail.name} on record`}
                      onClick={() => {
                        const next = toggleShowOnRecord(board, detail.id)
                        persist(next)
                        const updated = next.find(item => item.id === detail.id)
                        setToast(updated?.showOnRecord ? 'Will show on decision record' : 'Hidden from shareable record')
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className={s.card}>
                <h2 className={s.title} style={{ marginBottom: 14 }}>Mapped obligations</h2>
                <p className={s.muted} style={{ fontSize: 13.5, marginBottom: 14 }}>What Trace may look for when this pack is in force.</p>
                {detail.obligations.map(item => (
                  <div className={s.obligation} key={item.anchor}>
                    <div className={s.obTitle}>{item.title}</div>
                    <div className={s.obAnchor}>{item.anchor}</div>
                    <div className={s.obNote}>{item.note}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className={s.detailSide}>
              <div className={s.card}>
                <h2 className={s.title} style={{ fontSize: 15, marginBottom: 12 }}>Used by awards</h2>
                {detail.usedBy.length
                  ? detail.usedBy.map(item => (
                      <div className={s.awardCite} key={`${item.name}-${item.when}`}>
                        <span>{item.name}</span>
                        <span className={s.when}>{item.when}</span>
                      </div>
                    ))
                  : <p className={s.muted} style={{ fontSize: 13 }}>Not cited on an award yet.</p>}
                <Link className={`${s.btn} ${s.btnSecondary} ${s.btnSm}`} style={{ marginTop: 16, width: '100%' }} href={workspaceProductPaths.awardPrep}>
                  See on Award desk
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {screen === 'upload' && (
        <section className={s.screen} aria-labelledby="upload-title">
          <div className={s.backLink}>
            <button type="button" className={`${s.btn} ${s.btnGhost}`} onClick={() => { setScreen('home'); setUploadStep(1) }}>← Back</button>
          </div>
          <p className={s.eyebrow}>Add a pack</p>
          <h1 id="upload-title" ref={headingRef} tabIndex={-1} className={s.hero} style={{ fontSize: 26, marginBottom: 8 }}>Upload your own</h1>
          <p className={s.lead} style={{ marginBottom: 24 }}>
            Drop a policy file. Trace drafts a short list of obligations for you to review — same honesty as overnight prep.
          </p>
          <div className={s.flowSteps}>
            <span className={`${s.flowStep} ${uploadStep === 1 ? s.flowCurrent : ''} ${uploadStep > 1 ? s.flowDone : ''}`}>1 · Drop file</span>
            <span className={`${s.flowStep} ${uploadStep === 2 ? s.flowCurrent : ''} ${uploadStep > 2 ? s.flowDone : ''}`}>2 · Mapping</span>
            <span className={`${s.flowStep} ${uploadStep === 3 ? s.flowCurrent : ''}`}>3 · Review &amp; save</span>
          </div>
          {uploadStep === 1 || uploadStep === 2 ? (
            uploadStep === 1 ? (
              <div
                className={`${s.dropzone} ${uploadDrag ? s.dropzoneDrag : ''}`}
                tabIndex={0}
                role="button"
                aria-label="Drop or select a file"
                onClick={() => fileRef.current?.click()}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    fileRef.current?.click()
                  }
                }}
                onDragEnter={event => { event.preventDefault(); setUploadDrag(true) }}
                onDragOver={event => { event.preventDefault(); setUploadDrag(true) }}
                onDragLeave={event => { event.preventDefault(); setUploadDrag(false) }}
                onDrop={event => {
                  event.preventDefault()
                  setUploadDrag(false)
                  const file = event.dataTransfer.files?.[0]
                  startUpload(file ? file.name : 'dropped-source.pdf')
                }}
              >
                <div className={s.dzIcon} aria-hidden="true">↑</div>
                <h3>Drop a PDF or Word file</h3>
                <p>or click to select · demo accepts any file name</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={event => {
                    const file = event.target.files?.[0]
                    if (file) startUpload(file.name)
                  }}
                />
              </div>
            ) : (
              <div className={s.processing}>
                <div className={s.spinner} aria-hidden="true" />
                <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>Mapping obligations…</h3>
                <p className={s.muted} style={{ fontSize: 13.5 }}>{processingLabel}</p>
              </div>
            )
          ) : (
            <div className={`${s.card} ${s.reviewCard}`}>
              <div className={s.field}>
                <span className={s.fieldLabel}>Pack name</span>
                <p style={{ fontWeight: 500, margin: 0 }}>{mapped.name}</p>
              </div>
              <div className={s.field}>
                <span className={s.fieldLabel}>Draft obligations <span className={s.muted} style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(scripted for this demo)</span></span>
                {mapped.obligations.map(item => (
                  <div className={s.mappedItem} key={item.anchor}>
                    {item.title}
                    <div className={s.mappedAnchor}>{item.anchor}</div>
                  </div>
                ))}
              </div>
              <div className={s.field}>
                <label className={s.fieldLabel} htmlFor={uploadCategoryId}>Category</label>
                <select
                  id={uploadCategoryId}
                  className={s.fieldSelect}
                  value={uploadCategory}
                  onChange={event => setUploadCategory(event.target.value as RuleLibraryCategoryId)}
                >
                  {ruleLibraryCategories.map(item => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </div>
              <div className={s.field}>
                <div className={s.controlRow}>
                  <div>
                    <div className={s.ctlTitle}>Use for new awards</div>
                    <div className={s.ctlHint}>On = overnight prep may cite this pack starting tonight</div>
                  </div>
                  <Toggle small on={uploadOrgDefault} label="Use uploaded pack for new awards" onClick={() => setUploadOrgDefault(value => !value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={saveUpload}>Save to library</button>
                <button type="button" className={`${s.btn} ${s.btnSecondary}`} onClick={() => { setScreen('home'); setUploadStep(1) }}>Cancel</button>
              </div>
            </div>
          )}
        </section>
      )}

      {drawer && (
        <>
          <button type="button" className={s.overlay} aria-label="Close add a pack" onClick={() => setDrawer(null)} />
          <aside className={s.drawer} aria-label="Add a pack" role="dialog" aria-modal="true">
            <div className={s.drawerHead}>
              <div>
                <p className={s.eyebrow}>Rule library</p>
                <h2>{drawer === 'catalog' ? 'From Trace catalog' : 'Add a pack'}</h2>
              </div>
              <button type="button" className={`${s.btn} ${s.btnGhost}`} onClick={() => setDrawer(null)} aria-label="Close">✕</button>
            </div>
            <div className={s.drawerBody}>
              {drawer === 'choices' ? (
                <>
                  <p className={s.muted} style={{ fontSize: 14, marginBottom: 18, lineHeight: 1.5 }}>Choose how to bring a pack into your library.</p>
                  <div className={s.choiceCards}>
                    <button type="button" className={s.choiceCard} onClick={() => setDrawer('catalog')}>
                      <div className={s.ccTitle}>From Trace catalog</div>
                      <div className={s.ccDesc}>Curated packs Trace already summarised. Add one and it turns on for tonight.</div>
                    </button>
                    <button type="button" className={s.choiceCard} onClick={() => { setUploadStep(1); setScreen('upload'); setDrawer(null) }}>
                      <div className={s.ccTitle}>Upload your own</div>
                      <div className={s.ccDesc}>A policy PDF or wording pack from your organisation. Mapped for review before it goes live.</div>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button type="button" className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} style={{ margin: '-4px 0 12px -8px' }} onClick={() => setDrawer('choices')}>← Choices</button>
                  <p className={s.muted} style={{ fontSize: 14, marginBottom: 8, lineHeight: 1.5 }}>
                    Packs not yet on your switchboard. Add one and it appears on, ready for overnight prep.
                  </p>
                  {available.length === 0 ? (
                    <div className={s.empty} style={{ padding: '28px 16px', marginTop: 8 }}>
                      <strong>All curated packs are on</strong>
                      Everything from the Trace catalog is already on your switchboard.
                    </div>
                  ) : available.map(pack => (
                    <div className={s.catalogItem} key={pack.id}>
                      <div>
                        <div className={s.ciName}>{pack.name}</div>
                        <div className={s.ciPlain}>{pack.plain}</div>
                        <div className={s.sbMeta} style={{ marginTop: 6 }}>
                          <span className={s.catTag}>{categoryLabel(pack.category)}</span>
                          <span className={s.illustTag}>Illustrative</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`${s.btn} ${s.btnMint} ${s.btnSm}`}
                        onClick={() => {
                          persist(addCatalogPack(board, pack.id))
                          setToast('Added · on for tonight')
                        }}
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </aside>
        </>
      )}

      <div className={`${s.toast} ${toast ? s.toastShow : ''}`} role="status" aria-live="polite">{toast}</div>
    </>
  )
}
