import { Suspense } from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerClient, getSession } from '@/lib/server/auth'
import { SettingsForm } from './settings-form'

export const metadata: Metadata = {
  title: 'Settings',
}

async function SettingsContent() {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const supabase = await createServerClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!profile) redirect('/login')

  return <SettingsForm profile={profile} />
}

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile</p>
      </div>
      <Suspense fallback={<div className="space-y-4"><div className="h-96 animate-pulse rounded-xl bg-muted" /></div>}>
        <SettingsContent />
      </Suspense>
    </div>
  )
}
