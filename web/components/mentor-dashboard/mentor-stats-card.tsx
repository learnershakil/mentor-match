import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MentorStatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

export function MentorStatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
}: MentorStatsCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <p className="mt-1 text-xs">
            <span
              className={trend.positive ? "text-green-500" : "text-destructive"}
            >
              {trend.positive ? "+" : ""}
              {trend.value}
            </span>{" "}
            from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
