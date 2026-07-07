import Link from 'next/link'
import type { Metadata } from 'next'
import {
  TrendingUp,
  BarChart3,
  Users,
  Globe,
  ArrowRight,
  CheckCircle,
  Waves,
  Sparkles,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants'
import { createServerClient } from '@/lib/server/auth'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: `${SITE_NAME} — ${SITE_DESCRIPTION}`,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
}

const features = [
  {
    icon: Waves,
    title: 'Elliott Wave Analysis',
    description: 'Share and discover wave counts, patterns, and market analysis from the community.',
  },
  {
    icon: BarChart3,
    title: 'Track Your Performance',
    description: 'Build your reputation with confidence ratings, follower engagement, and accuracy tracking.',
  },
  {
    icon: Users,
    title: 'Follow Top Analysts',
    description: 'Learn from the best. Follow analysts whose wave counts align with your trading style.',
  },
  {
    icon: Globe,
    title: 'Community Driven',
    description: 'Join a community of serious Elliott Wave practitioners sharing real-time analysis.',
  },
]

const stats = [
  { label: 'Active Analysts', value: '50+' },
  { label: 'Analyses Posted', value: '100+' },
  { label: 'Community Members', value: '200+' },
]

export default async function LandingPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/feed')
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-shader border-b border-border/50">
        <div className="absolute inset-0 bg-grid opacity-[0.02]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="max-w-6xl mx-auto px-4 pt-28 pb-36 text-center relative">
          <div className="inline-flex items-center gap-2 glass-panel rounded-full px-4 py-1.5 mb-8">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-medium text-muted-foreground">
              Where Elliott Wave Analysts Build Their Reputation
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance mb-6 leading-[1.1]">
            Share Your{' '}
            <span className="text-gradient">Wave Counts</span>
            <br />
            <span className="text-muted-foreground">Build Your</span>{' '}
            <span className="text-gradient">Reputation</span>
          </h1>
          <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-10 text-balance leading-relaxed">
            Statistical is the platform for Elliott Wave analysts to publish their analysis,
            track their accuracy, and grow their following in a serious trading community.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold shadow-lg shadow-amber-500/20" asChild>
              <Link href="/register">
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-border/50 hover:bg-accent/50" asChild>
              <Link href="/discover">Browse analysts</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="relative border-b border-border/50 py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-20">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-bold text-gradient-blue">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1.5">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">
              Everything you need to{' '}
              <span className="text-gradient">analyze</span> and{' '}
              <span className="text-gradient">grow</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Purpose-built tools for Elliott Wave practitioners
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="glass-card rounded-xl p-6 group transition-all duration-300"
              >
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                  <feature.icon className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="font-semibold mb-2 text-sm">{feature.title}</h3>
                <p className="text-sm text-muted-foreground/80 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative border-b border-border/50 py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-3">
              How it <span className="text-gradient">works</span>
            </h2>
            <p className="text-muted-foreground">
              Three steps to start building your analyst reputation
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Create your profile',
                desc: 'Sign up in seconds. Set up your analyst profile and start sharing your analysis.',
                icon: Shield,
              },
              {
                step: '02',
                title: 'Publish your analysis',
                desc: 'Post wave counts with direction, confidence level, and chart images. Tag by market.',
                icon: Waves,
              },
              {
                step: '03',
                title: 'Grow your reputation',
                desc: 'Build followers, earn likes, and establish yourself as a trusted Elliott Wave analyst.',
                icon: TrendingUp,
              },
            ].map((item) => (
              <div key={item.step} className="glass-panel rounded-xl p-8 text-center group hover:border-blue-500/20 transition-all duration-300">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500/10 to-amber-500/10 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="h-7 w-7 text-blue-400" />
                </div>
                <span className="text-5xl font-bold text-muted-foreground/10 block mb-4 font-mono">{item.step}</span>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground/80 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-28">
        <div className="absolute inset-0 bg-shader opacity-50" />
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <div className="glass-panel rounded-2xl p-12 md:p-16 max-w-2xl mx-auto">
            <Waves className="h-10 w-10 text-amber-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Ready to share your analysis?
            </h2>
            <p className="text-muted-foreground/80 mb-8 max-w-md mx-auto">
              Join a growing community of Elliott Wave analysts. No credit card required.
            </p>
            <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold shadow-lg shadow-amber-500/20" asChild>
              <Link href="/register">
                Create your profile
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}