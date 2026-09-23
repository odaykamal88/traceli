import type { ReactNode } from 'react'
import Link from 'next/link'

function linkProps(href: string) {
  return href.startsWith('http') ? { target: '_blank' as const, rel: 'noreferrer' } : {}
}

function inline(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))|(https?:\/\/[^\s<)]+)/g
  const nodes: ReactNode[] = []
  let last = 0
  let index = 0
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0
    if (start > last) nodes.push(text.slice(last, start))
    const token = match[0]
    const key = `${keyPrefix}-${index++}`
    if (token.startsWith('`')) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>)
    } else if (token.startsWith('**')) {
      nodes.push(<strong key={key}>{inline(token.slice(2, -2), key)}</strong>)
    } else if (token.startsWith('[')) {
      const parsed = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token)
      if (parsed) {
        const href = parsed[2]
        nodes.push(href.startsWith('/')
          ? <Link key={key} href={href}>{parsed[1]}</Link>
          : <a key={key} href={href} {...linkProps(href)}>{parsed[1]}</a>)
      }
    } else {
      const href = token.replace(/[.,;:]$/, '')
      nodes.push(<a key={key} href={href} {...linkProps(href)}>{href}</a>)
      if (href.length < token.length) nodes.push(token.slice(href.length))
    }
    last = start + token.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function headingId(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function renderSources(markdown: string): ReactNode[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let cursor = 0
  let serial = 0
  const nextId = () => `src-${serial++}`

  while (cursor < lines.length) {
    const line = lines[cursor]
    if (!line.trim()) {
      cursor += 1
      continue
    }
    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={nextId()} />)
      cursor += 1
      continue
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    if (heading) {
      const level = heading[1].length
      const text = heading[2]
      const id = headingId(text)
      const content = inline(text, nextId())
      if (level === 1) blocks.push(<h1 key={nextId()} id={id}>{content}</h1>)
      else if (level === 2) blocks.push(<h2 key={nextId()} id={id}>{content}</h2>)
      else blocks.push(<h3 key={nextId()} id={id}>{content}</h3>)
      cursor += 1
      continue
    }
    if (line.startsWith('|')) {
      const rows: string[][] = []
      while (cursor < lines.length && lines[cursor].startsWith('|')) {
        if (!/^\|\s*-+/.test(lines[cursor])) {
          rows.push(lines[cursor].replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim()))
        }
        cursor += 1
      }
      const [head, ...body] = rows
      const key = nextId()
      blocks.push(
        <div className="table-wrap" key={key}>
          <table>
            {head ? <thead><tr>{head.map((cell, cellIndex) => <th key={`${key}-h-${cellIndex}`}>{inline(cell, `${key}-h-${cellIndex}`)}</th>)}</tr></thead> : null}
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={`${key}-r-${rowIndex}`}>
                  {row.map((cell, cellIndex) => <td key={`${key}-c-${rowIndex}-${cellIndex}`}>{inline(cell, `${key}-c-${rowIndex}-${cellIndex}`)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }
    if (line.startsWith('- ')) {
      const items: string[] = []
      while (cursor < lines.length && lines[cursor].startsWith('- ')) {
        items.push(lines[cursor].slice(2))
        cursor += 1
      }
      const key = nextId()
      blocks.push(<ul key={key}>{items.map((item, itemIndex) => <li key={`${key}-${itemIndex}`}>{inline(item, `${key}-${itemIndex}`)}</li>)}</ul>)
      continue
    }
    const paragraph: string[] = []
    while (
      cursor < lines.length
      && lines[cursor].trim()
      && !lines[cursor].startsWith('#')
      && !lines[cursor].startsWith('|')
      && !lines[cursor].startsWith('- ')
      && !/^---+$/.test(lines[cursor].trim())
    ) {
      paragraph.push(lines[cursor].trim())
      cursor += 1
    }
    const key = nextId()
    blocks.push(<p key={key}>{inline(paragraph.join(' '), key)}</p>)
  }

  return blocks
}
