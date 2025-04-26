import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import Emma from "@/public/student3.jpg"
import Michael from "@/public/male-mentor.jpg"
import Priya from "@/public/student2.jpg"

const testimonials = [
  {
    name: "Emma Wilson",
    role: "Frontend Developer",
    company: "TechCorp",
    image: Emma,
    content:
      "The mentorship I received completely transformed my career. In just 3 months, I went from struggling with basic concepts to landing my dream job as a frontend developer.",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Data Scientist",
    company: "AI Solutions",
    image: Michael,
    content:
      "My mentor helped me navigate the complex world of AI and machine learning. The personalized roadmap and hands-on projects were exactly what I needed to advance my skills.",
    rating: 5,
  },
  {
    name: "Priya Patel",
    role: "Cybersecurity Analyst",
    company: "SecureNet",
    image: Priya,
    content:
      "The cybersecurity mentorship program exceeded my expectations. My mentor provided practical insights that you can't find in textbooks or online courses.",
    rating: 4,
  },
]

export function TestimonialPreview() {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Success Stories from Our Community</h2>
          <p className="mt-4 text-muted-foreground">
            Hear from students who have transformed their careers with the help of our mentors.
          </p>
        </div>
        <div className="mx-auto mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="flex flex-col gap-4 rounded-lg border bg-background p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <Image
                  src={testimonial.image || "/placeholder.svg"}
                  alt={testimonial.name}
                  width={60}
                  height={60}
                  className="rounded-full"
                />
                <div>
                  <h3 className="font-semibold">{testimonial.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
              </div>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < testimonial.rating ? "fill-[#FFD700] text-[#FFD700]" : "text-muted"}`}
                  />
                ))}
              </div>
              <p className="text-muted-foreground">{testimonial.content}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/testimonials">
            <Button variant="outline" size="lg">
              View All Testimonials
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

