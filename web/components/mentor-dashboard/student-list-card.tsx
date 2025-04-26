import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

interface Student {
  id: string;
  userId: string;
  name: string;
  email?: string;
  image?: string | null;
  interest?: string;
  interests?: string[];
  level?: string;
}

interface StudentListCardProps {
  className?: string;
  students: Student[];
  isLoading?: boolean;
}

export function StudentListCard({
  className,
  students,
  isLoading = false,
}: StudentListCardProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle>Your Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Your Students</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/mentor-dashboard/students">
            <span className="mr-1">View all</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <div className="flex h-[100px] items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-muted-foreground">
              No students with matching interests found
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {students.slice(0, 5).map((student) => (
              <div key={student.id} className="flex items-start gap-3">
                <Avatar className="mt-1">
                  <AvatarImage
                    src={student.image || undefined}
                    alt={student.name}
                  />
                  <AvatarFallback>
                    {student.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <p className="font-medium leading-none">{student.name}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {student.interest && (
                      <Badge variant="secondary" className="text-xs">
                        {student.interest}
                      </Badge>
                    )}
                    {student.level && (
                      <Badge variant="outline" className="text-xs">
                        {student.level}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {students.length > 5 && (
              <div className="text-center">
                <Button variant="link" asChild>
                  <Link href="/mentor-dashboard/students">
                    View all {students.length} students
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
