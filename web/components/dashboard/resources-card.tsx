import { BookOpen, FileText, Video } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ResourcesCardProps {
  className?: string
}

const resources = [
  {
    id: 1,
    title: "Advanced React Patterns",
    type: "article",
    icon: FileText,
    tag: "React",
  },
  {
    id: 2,
    title: "Building APIs with Node.js",
    type: "video",
    icon: Video,
    tag: "Backend",
  },
  {
    id: 3,
    title: "Cybersecurity Fundamentals",
    type: "course",
    icon: BookOpen,
    tag: "Security",
  },
]

export function ResourcesCard({ className }: ResourcesCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Learning Resources</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {resources.map((resource) => (
            <div key={resource.id} className="flex items-start gap-3 rounded-lg border p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <resource.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{resource.title}</p>
                  <Badge variant="outline" className="text-xs">
                    {resource.tag}
                  </Badge>
                </div>
                <p className="text-xs capitalize text-muted-foreground">{resource.type}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

