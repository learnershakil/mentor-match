import Image from "next/image"
import { Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Student1 from "@/public/student1.jpg"
import Student2 from "@/public/student2.jpg"
import Student3 from "@/public/student3.jpg"
import Student4 from "@/public/student4.jpg"
import Shantanu from "@/public/shantanu.png"
import Jeremiah from "@/public/jarmeeah.jpg"

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Frontend Developer",
    company: "TechCorp",
    image: Student1,
    content:
      "The mentorship I received completely transformed my career. In just 3 months, I went from struggling with basic concepts to landing my dream job as a frontend developer. My mentor provided personalized guidance that no online course could offer.",
    rating: 5,
  },
  {
    name: "Shantanu Jitendra",
    role: "Data Scientist",
    company: "AI Solutions",
    image: Shantanu,
    content:
      "My mentor helped me navigate the complex world of AI and machine learning. The personalized roadmap and hands-on projects were exactly what I needed to advance my skills. I'm now working on cutting-edge AI projects thanks to the guidance I received.",
    rating: 5,
  },
  {
    name: "Priya Patel",
    role: "Cybersecurity Analyst",
    company: "SecureNet",
    image: Student4,
    content:
      "The cybersecurity mentorship program exceeded my expectations. My mentor provided practical insights that you can't find in textbooks or online courses. The hands-on experience with real-world security scenarios was invaluable for my career growth.",
    rating: 4,
  },
  {
    name: "Jeremiah",
    role: "Full Stack Developer",
    company: "WebTech Solutions",
    image: Jeremiah,
    content:
      "I was skeptical about online mentorship at first, but MentorMatch changed my perspective completely. The platform matched me with a mentor who understood exactly what I needed to improve. The weekly sessions and code reviews helped me level up my skills faster than I thought possible.",
    rating: 5,
  },
  {
    name: "Jennifer Lee",
    role: "UX Designer",
    company: "Creative Digital",
    image: Student2,
    content:
      "As someone transitioning careers, I needed guidance from someone who had walked the path before. My mentor not only helped me build a strong portfolio but also provided invaluable advice on navigating the industry. I'm now working at my dream company thanks to MentorMatch.",
    rating: 5,
  },
  {
    name: "Rubika Rodriguez",
    role: "Mobile App Developer",
    company: "AppWorks",
    image: Student3,
    content:
      "The structured learning path combined with personalized mentorship was exactly what I needed. My mentor helped me understand complex concepts and apply them to real projects. The platform's video call quality and screen sharing features made remote collaboration seamless.",
    rating: 4,
  },
]

export default function TestimonialsPage() {
  return (
    <main className="flex-1">
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Success Stories</h1>
            <p className="mt-4 text-xl text-muted-foreground">
              Hear from students who have transformed their careers with the help of our mentors.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-6">
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
                  <div className="mt-4 flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < testimonial.rating ? "fill-[#FFD700] text-[#FFD700]" : "text-muted"}`}
                      />
                    ))}
                  </div>
                  <p className="mt-4 text-muted-foreground">"{testimonial.content}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary py-16 text-primary-foreground md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Join Our Community of Learners</h2>
            <p className="mt-4 text-primary-foreground/80">
              Start your journey today and become our next success story.
            </p>
            <div className="mt-8">
              <a href="/signup">
                <button className="rounded-md bg-white px-6 py-3 font-medium text-primary hover:bg-white/90">
                  Get Started
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

