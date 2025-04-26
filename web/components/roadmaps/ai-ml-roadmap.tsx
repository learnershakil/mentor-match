"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  BookOpen,
  BrainCircuit,
  CheckCircle,
  Database,
  Dna,
  Flask,
  Layers,
  Network,
  Sigma,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { LearningResourceViewer } from "@/components/learning/learning-resource-viewer";

type Checkpoint = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: "completed" | "in-progress" | "locked";
  progress: number;
  videoUrl: string;
};

// Map of checkpoint IDs to their respective icon components
const iconMap: Record<string, React.ElementType> = {
  "python-basics": BookOpen,
  "data-analysis": Database,
  "ml-fundamentals": BrainCircuit,
  "neural-networks": Network,
  "deep-learning": Layers,
  "ai-applications": Dna,
};

// Type for storing checkpoints without icon properties
type StoredCheckpoint = Omit<Checkpoint, "icon"> & { iconId: string };

const defaultCheckpoints: Checkpoint[] = [
  {
    id: "python-basics",
    title: "Python Programming",
    description: "Master the foundation language for AI/ML",
    icon: BookOpen,
    status: "in-progress",
    progress: 0,
    videoUrl: "https://www.youtube.com/embed/rfscVS0vtbw?si=xwTaLgR4GpPq2YRn",
  },
  {
    id: "data-analysis",
    title: "Data Analysis & Visualization",
    description: "Learn to prepare and visualize data",
    icon: Database,
    status: "locked",
    progress: 0,
    videoUrl: "https://www.youtube.com/embed/_T8LGqJtuGc?si=0Y1zFCfmgXnqfgJT",
  },
  {
    id: "ml-fundamentals",
    title: "Machine Learning Fundamentals",
    description: "Understand core ML algorithms",
    icon: BrainCircuit,
    status: "locked",
    progress: 0,
    videoUrl: "https://www.youtube.com/embed/NWONeJKn6kc?si=6u5OFEKpw78J86_q",
  },
  {
    id: "neural-networks",
    title: "Neural Networks",
    description: "Build your first neural networks",
    icon: Network,
    status: "locked",
    progress: 0,
    videoUrl: "https://www.youtube.com/embed/aircAruvnKk?si=T08lXQVpK2qkfZw0",
  },
  {
    id: "deep-learning",
    title: "Deep Learning",
    description: "Master advanced neural architectures",
    icon: Layers,
    status: "locked",
    progress: 0,
    videoUrl: "https://www.youtube.com/embed/DooxDIRAkPA?si=qVd3kbMLI1u9fdrA",
  },
  {
    id: "ai-applications",
    title: "AI Applications",
    description: "Apply AI to real-world problems",
    icon: Dna,
    status: "locked",
    progress: 0,
    videoUrl: "https://www.youtube.com/embed/JMUxmLyrhSk?si=0w4a3TrZKJ59iPVn",
  },
];

// Prepare checkpoints for storage by removing icon components
const prepareForStorage = (checkpoints: Checkpoint[]): StoredCheckpoint[] => {
  return checkpoints.map((checkpoint) => ({
    id: checkpoint.id,
    title: checkpoint.title,
    description: checkpoint.description,
    status: checkpoint.status,
    progress: checkpoint.progress,
    iconId: checkpoint.id,
    videoUrl: checkpoint.videoUrl,
  }));
};

// Restore icon components when loading from storage
const restoreFromStorage = (
  storedCheckpoints: StoredCheckpoint[]
): Checkpoint[] => {
  return storedCheckpoints.map((checkpoint) => ({
    ...checkpoint,
    icon: iconMap[checkpoint.iconId] || BookOpen,
  }));
};

export function AiMlRoadmap() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [isLearningResourceOpen, setIsLearningResourceOpen] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] =
    useState<Checkpoint | null>(null);

  // Load checkpoints from localStorage on initial render
  useEffect(() => {
    const savedCheckpoints = localStorage.getItem("ai-ml-roadmap-progress");
    if (savedCheckpoints) {
      try {
        const parsed = JSON.parse(savedCheckpoints) as StoredCheckpoint[];
        setCheckpoints(restoreFromStorage(parsed));
      } catch (error) {
        console.error("Failed to parse saved checkpoints:", error);
        setCheckpoints(defaultCheckpoints);
        localStorage.setItem(
          "ai-ml-roadmap-progress",
          JSON.stringify(prepareForStorage(defaultCheckpoints))
        );
      }
    } else {
      // First time user - initialize with the first checkpoint unlocked
      setCheckpoints(defaultCheckpoints);
      localStorage.setItem(
        "ai-ml-roadmap-progress",
        JSON.stringify(prepareForStorage(defaultCheckpoints))
      );
    }
  }, []);

  // Find the first in-progress checkpoint when loading the page
  useEffect(() => {
    if (checkpoints.length > 0 && !isLearningResourceOpen) {
      const inProgressCheckpoint = checkpoints.find(
        (cp) => cp.status === "in-progress"
      );
      if (inProgressCheckpoint) {
        // Auto-open behavior is disabled
      }
    }
  }, [checkpoints, isLearningResourceOpen]);

  const handleContinueLearning = (checkpoint: Checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    setIsLearningResourceOpen(true);
  };

  const handleProgressUpdate = (updatedCheckpoints: Checkpoint[]) => {
    setCheckpoints(updatedCheckpoints);
    localStorage.setItem(
      "ai-ml-roadmap-progress",
      JSON.stringify(prepareForStorage(updatedCheckpoints))
    );
  };

  return (
    <>
      <div className="relative">
        {/* Road background */}
        <div className="absolute left-1/2 top-0 h-full w-4 -translate-x-1/2 bg-muted" />

        {/* Checkpoints */}
        <div className="relative space-y-24 py-8">
          {checkpoints.map((checkpoint, index) => (
            <div
              key={checkpoint.id}
              className={cn(
                "relative flex items-center",
                index % 2 === 0
                  ? "justify-start pr-[50%]"
                  : "justify-end pl-[50%]"
              )}
            >
              {/* Checkpoint node */}
              <div className="absolute left-1/2 z-10 -translate-x-1/2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-full border-4 border-background",
                          checkpoint.status === "completed"
                            ? "bg-primary text-primary-foreground"
                            : checkpoint.status === "in-progress"
                            ? "bg-amber-500 text-white"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <checkpoint.icon className="h-6 w-6" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side={index % 2 === 0 ? "right" : "left"}>
                      <div className="text-xs">
                        {checkpoint.status === "completed"
                          ? "Completed"
                          : checkpoint.status === "in-progress"
                          ? "In Progress"
                          : "Locked"}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Checkpoint card */}
              <Card
                className={cn(
                  "w-[90%] max-w-[300px] transition-all hover:shadow-md",
                  checkpoint.status === "locked" && "opacity-60"
                )}
              >
                <div className="p-4">
                  <h3 className="font-semibold">{checkpoint.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {checkpoint.description}
                  </p>

                  {checkpoint.status !== "locked" && (
                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span>Progress</span>
                        <span>{checkpoint.progress}%</span>
                      </div>
                      <Progress value={checkpoint.progress} className="h-2" />
                    </div>
                  )}

                  <div className="mt-4">
                    {checkpoint.status === "completed" && (
                      <div className="flex items-center gap-1 text-xs text-primary">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Completed</span>
                      </div>
                    )}

                    {checkpoint.status === "in-progress" && (
                      <Button
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => handleContinueLearning(checkpoint)}
                      >
                        Continue Learning
                      </Button>
                    )}

                    {checkpoint.status === "locked" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        disabled
                      >
                        Locked
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Finish flag */}
        <div className="relative mt-8 flex justify-center">
          <div className="z-10 flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-md">
            <div className="h-8 w-8 rounded-full bg-primary/20" />
          </div>
          <div className="absolute top-8 text-center">
            <h3 className="font-semibold">AI/ML Specialist</h3>
            <p className="text-xs text-muted-foreground">Journey completion</p>
          </div>
        </div>
      </div>

      {/* Learning Resource Viewer */}
      {isLearningResourceOpen && selectedCheckpoint && (
        <LearningResourceViewer
          checkpoint={selectedCheckpoint}
          checkpoints={checkpoints}
          onClose={() => setIsLearningResourceOpen(false)}
          onProgressUpdate={handleProgressUpdate}
        />
      )}
    </>
  );
}
