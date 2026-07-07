'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { updateProfile, uploadAvatar } from '@/lib/actions/profile.actions'
import { UserAvatar } from '@/components/shared/user-avatar'
import type { Profile } from '@/lib/types/database'

interface SettingsFormProps {
  profile: Profile
}

export function SettingsForm({ profile }: SettingsFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [website, setWebsite] = useState(profile.website ?? '')
  const [location, setLocation] = useState(profile.location ?? '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const result = await updateProfile({
        display_name: displayName || null,
        bio: bio || null,
        website: website || null,
        location: location || null,
      })

      if (result.error) {
        toast(result.error, 'error')
        return
      }

      toast('Profile updated!', 'success')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }, [displayName, bio, website, location, toast, router])

  const handleAvatarUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setUploading(true)
      try {
        const formData = new FormData()
        formData.append('avatar', file)
        const result = await uploadAvatar(formData)
        if (result.error) {
          toast(result.error, 'error')
          return
        }
        toast('Avatar updated!', 'success')
        router.refresh()
      } finally {
        setUploading(false)
      }
    },
    [toast, router],
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="relative">
          <UserAvatar
            username={profile.username}
            avatarUrl={profile.avatar_url}
            displayName={profile.display_name}
            size="xl"
            linkable={false}
          />
          <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <Upload className="h-5 w-5 text-white" />
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
          </label>
        </div>
        <div>
          <p className="font-medium">{profile.display_name ?? profile.username}</p>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        </div>
      </div>

      <div className="space-y-4">
        <Input
          id="displayName"
          label="Display Name"
          placeholder="Your name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={50}
        />
        <div className="space-y-1.5">
          <label htmlFor="bio" className="text-sm font-medium">Bio</label>
          <textarea
            id="bio"
            placeholder="Tell other analysts about yourself"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground">{bio.length}/500</p>
        </div>
        <Input
          id="website"
          label="Website"
          type="url"
          placeholder="https://your-site.com"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
        <Input
          id="location"
          label="Location"
          placeholder="City, Country"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Saving...
          </>
        ) : (
          'Save changes'
        )}
      </Button>
    </div>
  )
}
