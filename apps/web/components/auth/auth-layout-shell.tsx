'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'
import { useTheme } from '@/providers/theme-provider'
import { Button } from '@/components/ui/button'
import { Sun, Moon } from 'lucide-react'

interface AuthLayoutShellProps {
  children: ReactNode
  title: string
  subtitle: string
}

export function AuthLayoutShell({ children, title, subtitle }: AuthLayoutShellProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            S
          </div>
          Statistical
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
