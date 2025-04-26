import Link from "next/link"
import { ArrowRight, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"

const benefits = [
  "Personalized 1-on-1 mentorship",
  "Expert guidance in your field",
  "Flexible scheduling",
  "Project-based learning",
  "Career advice and networking",
  "Affordable pricing plans",
]

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-primary py-16 text-primary-foreground md:py-24">
      <div className="container relative z-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Ready to Accelerate Your Learning?</h2>
          <p className="mt-4 text-primary-foreground/80">
            Join thousands of students who are advancing their careers with personalized mentorship.
          </p>
        </div>
        <div className="mx-auto mt-8 max-w-3xl">
          <div className="grid gap-4 sm:grid-cols-2">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-[#FFD700]" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="w-full gap-1 sm:w-auto">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto"
              >
                View Pricing Plans
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,215,0,0.15),transparent_50%)]"></div>
    </section>
  )
}

