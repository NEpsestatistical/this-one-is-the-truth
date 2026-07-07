import { PublicNavbar } from '@/components/layout/public-navbar'
import { SITE_NAME } from '@/lib/constants'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/50 py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
            S
          </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="/discover" className="hover:text-foreground transition-colors">Discover</a>
            <a href="/leaderboards" className="hover:text-foreground transition-colors">Leaderboards</a>
            <a href="/tags" className="hover:text-foreground transition-colors">Tags</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
