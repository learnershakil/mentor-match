import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Mentor from "@/public/mentor.jpg"
import Student1 from "@/public/student1.jpg"
import Student2 from "@/public/student2.jpg"
import Student3 from "@/public/student3.jpg"
import Student4 from "@/public/student4.jpg"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Accelerate Your Learning with Expert Mentors
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Connect with industry professionals who can guide your journey in web development, app development,
                AI/ML, and cybersecurity.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/signup">
                <Button size="lg" className="gap-1">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-2">
                {[Student1,Student2,Student3,Student4].map((i, index) => (
                  <div key={index} className="inline-block h-8 w-8 overflow-hidden rounded-full border-2 border-background">
                    <Image
                      src={i}
                      alt={`User ${i}`}
                      width={32}
                      height={32}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                Join <span className="font-medium text-foreground">2,000+</span> students already learning
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative h-[350px] w-full max-w-[500px] overflow-hidden rounded-lg shadow-xl md:h-[420px]">
              <Image
                src={Mentor}
                alt="Mentor and student collaborating"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(102,51,153,0.15),transparent_50%)]"></div>
    </section>
  )
}

