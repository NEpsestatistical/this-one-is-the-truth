import { Shell } from '@/components/layout/shell'
import { PostComposer } from '@/components/shared/post-composer'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Shell>
      {children}
      <PostComposer />
    </Shell>
  )
}
