import React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Sparkles, Rocket, Star } from "lucide-react"

export default function ShowcasePage() {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">
            Visual Enhancement Showcase
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-auto w-full px-6 py-6 lg:py-10 lg:px-12">
        <div className="text-center space-y-6 p-8 w-full">
          <h2 className="text-5xl font-bold text-foreground mb-4">
            World-Class Design
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience the most beautiful and modern UI components with advanced animations and effects.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg">
              <Rocket className="mr-2 h-5 w-5" />
              Get Started
            </Button>
            <Button variant="outline" size="lg">
              <Star className="mr-2 h-5 w-5" />
              Learn More
            </Button>
          </div>
        </div>

  <div className="w-full max-w-[100%] box-border px-6 space-y-12">
          {/* Button Showcase */}
          <section className="space-y-6">
            <h3 className="text-3xl font-bold">Enhanced Buttons</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button>Default</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button size="lg">Large</Button>
              <Button size="sm">Small</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
          </section>

          {/* Card Showcase */}
          <section className="space-y-6">
            <h3 className="text-3xl font-bold">Modern Cards</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6">
                <h4 className="text-lg font-semibold mb-2">Default Card</h4>
                <p className="text-muted-foreground">A beautiful default card with hover effects.</p>
              </Card>
              <Card className="p-6">
                <h4 className="text-lg font-semibold mb-2">Enhanced Card</h4>
                <p className="text-muted-foreground">Modern card design with improved styling.</p>
              </Card>
              <Card className="p-6">
                <h4 className="text-lg font-semibold mb-2">Styled Card</h4>
                <p className="text-muted-foreground">Beautiful card with enhanced visual appeal.</p>
              </Card>
            </div>
          </section>

          {/* Input Showcase */}
          <section className="space-y-6">
            <h3 className="text-3xl font-bold">Enhanced Inputs</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Input placeholder="Default input" />
                <Input placeholder="Another input" />
              </div>
              <div className="space-y-4">
                <Input placeholder="Email Address" type="email" />
                <Input placeholder="Password" type="password" />
              </div>
            </div>
          </section>

          {/* Enhanced Design System Demo */}
          <section className="space-y-6">
            <h3 className="text-3xl font-bold">Enhanced Design System</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                <h4 className="text-lg font-semibold mb-2 text-primary">Gradient Background</h4>
                <p className="text-muted-foreground">Beautiful gradient backgrounds with enhanced color system.</p>
              </Card>
              <Card className="p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <h4 className="text-lg font-semibold mb-2">Hover Effects</h4>
                <p className="text-muted-foreground">Advanced hover animations and shadow effects.</p>
              </Card>
            </div>
          </section>

          {/* Typography Showcase */}
          <section className="space-y-6">
            <h3 className="text-3xl font-bold">Enhanced Typography</h3>
            <div className="space-y-4">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Headline Font
              </h1>
              <p className="text-xl font-medium">Enhanced Inter font with improved readability</p>
              <p className="text-base text-muted-foreground">
                Beautiful typography system with proper font weights, line heights, and spacing for optimal reading experience.
              </p>
            </div>
          </section>
        </div>
      </main>
    </SidebarInset>
  )
}
