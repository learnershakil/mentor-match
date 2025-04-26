import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const plans = [
  {
    name: "Free",
    description: "Basic access to the platform",
    price: "$0",
    duration: "forever",
    features: [
      "Access to community forums",
      "Basic learning resources",
      "Limited mentor browsing",
      "1 mentor session per month",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    description: "For serious learners",
    price: "$29",
    duration: "per month",
    features: [
      "Everything in Free",
      "Unlimited mentor browsing",
      "4 mentor sessions per month",
      "Access to all learning resources",
      "Priority support",
      "Session recordings",
    ],
    cta: "Start Pro Plan",
    popular: true,
  },
  {
    name: "Premium",
    description: "For career accelerators",
    price: "$79",
    duration: "per month",
    features: [
      "Everything in Pro",
      "Unlimited mentor sessions",
      "1-on-1 career coaching",
      "Resume and portfolio reviews",
      "Job placement assistance",
      "Premium learning paths",
    ],
    cta: "Start Premium Plan",
    popular: false,
  },
]

export default function PricingPage() {
  return (
    <main className="flex-1">
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Simple, Transparent Pricing</h1>
            <p className="mt-4 text-xl text-muted-foreground">
              Choose the plan that's right for your learning journey.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.name} className={plan.popular ? "relative border-primary shadow-lg" : "border-border"}>
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground"> / {plan.duration}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className={plan.popular ? "h-4 w-4 text-primary" : "h-4 w-4 text-muted-foreground"} />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/signup" className="w-full">
                    <Button className="w-full gap-1" variant={plan.popular ? "default" : "outline"}>
                      {plan.cta} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="mx-auto mt-16 max-w-3xl rounded-lg border bg-muted/50 p-8">
            <h3 className="text-center text-xl font-semibold">Enterprise Solutions</h3>
            <p className="mt-2 text-center text-muted-foreground">
              Looking for a custom solution for your team or organization?
            </p>
            <div className="mt-6 text-center">
              <Link href="/contact">
                <Button size="lg">Contact Sales</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
            <div className="mt-8 grid gap-6">
              {[
                {
                  question: "Can I switch between plans?",
                  answer:
                    "Yes, you can upgrade or downgrade your plan at any time. Changes will be applied at the start of your next billing cycle.",
                },
                {
                  question: "Are there any long-term contracts?",
                  answer: "No, all our plans are month-to-month with no long-term commitments. You can cancel anytime.",
                },
                {
                  question: "How do mentor sessions work?",
                  answer:
                    "Mentor sessions are 1-on-1 video calls with screen sharing capabilities. You can book sessions with any available mentor based on your plan's allowance.",
                },
                {
                  question: "Can I get a refund if I'm not satisfied?",
                  answer:
                    "We offer a 7-day money-back guarantee for new subscribers. If you're not satisfied, contact our support team within 7 days of your purchase.",
                },
              ].map((faq, index) => (
                <div key={index} className="rounded-lg border bg-background p-6 shadow-sm">
                  <h3 className="font-semibold">{faq.question}</h3>
                  <p className="mt-2 text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

