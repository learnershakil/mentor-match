import { BookOpen } from "lucide-react"

import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center justify-center rounded-md bg-primary p-1", className)}>
      <BookOpen className="h-5 w-5 text-primary-foreground" />
    </div>
  )
}

