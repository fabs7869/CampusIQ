import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'CampusIQ Admin',
  description: 'Smart Campus Admin Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e1b4b', color: '#e2e8f0', border: '1px solid rgba(99,102,241,0.3)' },
          }}
        />
        {children}
      </body>
    </html>
  )
}
