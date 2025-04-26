import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Mentor from "@/public/mentor2.jpg"
import Jermeeah from "@/public/jarmeeah.jpg"
import Shantanu from "@/public/shantanu.png"
import Prince from "@/public/prince.png"

export default function AboutPage() {
  return (
    <main className="flex-1">
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">About MentorMatch</h1>
            <p className="mt-4 text-xl text-muted-foreground">
              Connecting ambitious learners with industry experts to accelerate career growth and skill development.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            <div className="flex flex-col justify-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">Our Mission</h2>
              <p className="text-muted-foreground">
                At MentorMatch, we believe that personalized mentorship is the key to accelerated learning and career
                growth. Our mission is to democratize access to expert guidance by connecting students with industry
                professionals who can provide tailored advice, feedback, and support.
              </p>
              <p className="text-muted-foreground">
                We're building a community where knowledge sharing is valued and rewarded, enabling both mentors and
                mentees to grow together. Whether you're looking to break into tech, level up your skills, or share your
                expertise, MentorMatch provides the platform to make meaningful connections.
              </p>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-[350px] w-full max-w-[500px] overflow-hidden rounded-lg shadow-xl md:h-[420px]">
                <Image
                  src={Mentor}
                  alt="Team collaboration"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Our Values</h2>
            <p className="mt-4 text-muted-foreground">The principles that guide everything we do at MentorMatch.</p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3">
            <div className="flex flex-col gap-4 rounded-lg border bg-background p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Accessibility</h3>
              <p className="text-muted-foreground">
                We believe quality mentorship should be accessible to everyone, regardless of background or location.
              </p>
            </div>
            <div className="flex flex-col gap-4 rounded-lg border bg-background p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Excellence</h3>
              <p className="text-muted-foreground">
                We're committed to providing the highest quality learning experience through rigorous mentor selection
                and platform development.
              </p>
            </div>
            <div className="flex flex-col gap-4 rounded-lg border bg-background p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Community</h3>
              <p className="text-muted-foreground">
                We foster a supportive community where knowledge sharing and collaboration are encouraged and
                celebrated.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight">Our Team</h2>
        <p className="mt-4 text-muted-foreground">Meet the passionate individuals behind MentorMatch.</p>
          </div>
          <div className="mx-auto mt-12 flex justify-center">
        <div className="grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[Jermeeah, Shantanu, Prince].map((i, index) => (
            <div
          key={index}
          className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-background p-6 text-center shadow-sm"
            >
          <div className="relative h-24 w-24 overflow-hidden rounded-full">
            <Image
              src={i}
              alt={`Team Member ${i}`}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col items-center">
            <h3 className="font-semibold">{["Frontend Developer", "Backend Developer", "Database Administrator"][(index + 1) - 1]}</h3>
            <p className="text-sm text-muted-foreground">
              {["Jeremiah", "Shantanu", "Prince"][(index + 1) - 1]}
            </p>
          </div>
            </div>
          ))}
        </div>
          </div>
        </div>
      </section>

      <section className="bg-primary py-16 text-primary-foreground md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Join Our Community</h2>
            <p className="mt-4 text-primary-foreground/80">
              Whether you're looking to learn or share your expertise, there's a place for you at MentorMatch.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="w-full gap-1 sm:w-auto">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto"
                >
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

