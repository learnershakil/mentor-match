import { HeroSection } from "@/components/home/hero-section"
import { FeatureSection } from "@/components/home/feature-section"
import { TestimonialPreview } from "@/components/home/testimonial-preview"
import { MentorShowcase } from "@/components/home/mentor-showcase"
import { CTASection } from "@/components/home/cta-section"

export default function Home() {
  return (
    <main className="flex-1">
      <HeroSection />
      <FeatureSection />
      <MentorShowcase />
      <TestimonialPreview />
      <CTASection />
    </main>
  )
}

