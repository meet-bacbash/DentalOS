'use client'

import { AuthProvider } from './AuthContext'

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
