import { Code, Compass, Lightbulb, Shield, Video } from "lucide-react"

import { cn } from "@/lib/utils"

const features = [
  {
    icon: Video,
    title: "1-on-1 Mentoring Sessions",
    description: "Connect with mentors via high-quality video calls with screen sharing capabilities.",
  },
  {
    icon: Compass,
    title: "Personalized Learning Paths",
    description: "Follow customized roadmaps designed to help you reach your specific career goals.",
  },
  {
    icon: Code,
    title: "Hands-on Projects",
    description: "Build real-world projects with guidance from experienced professionals.",
  },
  {
    icon: Shield,
    title: "Cybersecurity Expertise",
    description: "Learn best practices and cutting-edge techniques from security specialists.",
  },
  {
    icon: Lightbulb,
    title: "AI & ML Specialization",
    description: "Dive into artificial intelligence and machine learning with expert guidance.",
  },
]

export function FeatureSection() {
  return (
    <section className="bg-muted/50 py-16 md:py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Accelerate Your Learning Journey</h2>
          <p className="mt-4 text-muted-foreground">
            Our platform offers everything you need to master new skills and advance your career.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className={cn(
                "flex flex-col gap-2 rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md",
                index === 0 && "md:col-span-2 lg:col-span-1",
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

