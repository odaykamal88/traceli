import type { ReactNode } from 'react'
import ProductShell from './product-shell'

export const metadata = {
  robots: { index: false, follow: false },
}

export default function WorkspaceProductLayout({ children }: { children: ReactNode }) {
  return <ProductShell>{children}</ProductShell>
}
