import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Alex from "@/public/student4.jpg"
import Emma from "@/public/student3.jpg"
import Jamal from "@/public/male-mentor.jpg"
import Sopia from "@/public/student2.jpg"

const mentors = [
  {
    name: "Dr. Alex Rivera",
    role: "AI Research Scientist",
    image: Alex,
    specialties: ["Machine Learning", "Neural Networks", "Computer Vision"],
    rating: 4.9,
    reviews: 127,
  },
  {
    name: "Emma Wilson",
    role: "Senior Frontend Engineer",
    image: Emma,
    specialties: ["React", "Next.js", "UI/UX Design"],
    rating: 4.8,
    reviews: 93,
  },
  {
    name: "Jamal Washington",
    role: "Cybersecurity Expert",
    image: Jamal,
    specialties: ["Network Security", "Ethical Hacking", "Security Audits"],
    rating: 5.0,
    reviews: 84,
  },
  {
    name: "Sophia Chen",
    role: "Mobile App Developer",
    image: Sopia,
    specialties: ["React Native", "iOS", "Android"],
    rating: 4.7,
    reviews: 112,
  },
]

export function MentorShowcase() {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Learn from Industry Experts</h2>
          <p className="mt-4 text-muted-foreground">
            Our mentors are experienced professionals passionate about sharing their knowledge.
          </p>
        </div>
        <div className="mx-auto mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {mentors.map((mentor, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-lg border bg-background shadow-sm transition-all hover:shadow-md"
            >
              <div className="aspect-square overflow-hidden">
                <Image
                  src={mentor.image || "/placeholder.svg"}
                  alt={mentor.name}
                  width={300}
                  height={300}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{mentor.name}</h3>
                <p className="text-sm text-muted-foreground">{mentor.role}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {mentor.specialties.map((specialty, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">{mentor.rating}</span>
                    <span className="text-muted-foreground"> ({mentor.reviews} reviews)</span>
                  </div>
                  <Link href="/mentors">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ArrowRight className="h-4 w-4" />
                      <span className="sr-only">View profile</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/mentors">
            <Button size="lg">
              Browse All Mentors <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

