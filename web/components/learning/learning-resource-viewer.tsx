"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  CheckCircle,
  Code,
  FileText,
  X,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

interface Checkpoint {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "locked";
  progress: number;
  videoUrl: string; // Add videoUrl property
}

interface LearningResourceViewerProps {
  checkpoint: Checkpoint;
  checkpoints: Checkpoint[];
  onClose: () => void;
  onProgressUpdate: (updatedCheckpoints: Checkpoint[]) => void;
}

export function LearningResourceViewer({
  checkpoint,
  checkpoints,
  onClose,
  onProgressUpdate,
}: LearningResourceViewerProps) {
  const [activeTab, setActiveTab] = useState("notes");
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState<
    Record<number, "correct" | "incorrect">
  >({});
  const [isNavigatingToNext, setIsNavigatingToNext] = useState(false);

  // Auto-select the Quiz tab if the checkpoint progress is already at 80%
  useEffect(() => {
    if (checkpoint.progress >= 80) {
      setActiveTab("quiz");
    }
  }, [checkpoint.progress]);

  // Mock data for learning resources
  const resources = {
    videoUrl: checkpoint.videoUrl,
    notes: [
      {
        title: "Introduction",
        content: `This module covers the fundamentals of ${checkpoint.title}. You'll learn the core concepts and best practices.`,
      },
      {
        title: "Key Concepts",
        content:
          "We'll explore the essential principles and techniques that form the foundation of this technology.",
      },
      {
        title: "Practical Examples",
        content:
          "Through hands-on examples, you'll gain practical experience implementing these concepts in real-world scenarios.",
      },
      {
        title: "Advanced Topics",
        content:
          "Once you've mastered the basics, we'll dive into more advanced topics and optimization techniques.",
      },
      {
        title: "Best Practices",
        content:
          "Learn industry-standard best practices to write clean, maintainable, and efficient code.",
      },
    ],
    resources: [
      {
        title: "Official Documentation",
        type: "documentation",
        url: "#",
      },
      {
        title: "Cheat Sheet",
        type: "pdf",
        url: "#",
      },
      {
        title: "Practice Exercises",
        type: "exercises",
        url: "#",
      },
      {
        title: "Sample Code Repository",
        type: "code",
        url: "#",
      },
    ],
    quiz: [
      {
        question: `What is the primary purpose of ${checkpoint.title}?`,
        options: [
          "To style web pages",
          "To create interactive user interfaces",
          "To manage server-side logic",
          "To store and retrieve data",
        ],
        correctAnswer: 1,
      },
      {
        question: "Which of the following is a best practice?",
        options: [
          "Writing all code in a single file",
          "Avoiding comments in your code",
          "Component-based architecture",
          "Using global variables extensively",
        ],
        correctAnswer: 2,
      },
    ],
  };

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    setQuizAnswers({
      ...quizAnswers,
      [questionIndex]: answerIndex,
    });
  };

  // Reset the quiz state to allow retrying
  const handleResetQuiz = () => {
    setQuizSubmitted(false);
    setAnswerFeedback({});
    // Keep the answers so users don't have to re-enter everything
  };

  const handleQuizSubmit = () => {
    // Check if all questions are answered
    if (Object.keys(quizAnswers).length < resources.quiz.length) {
      toast({
        title: "Please answer all questions",
        description: "You need to complete all questions before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Check each answer and provide feedback
    const feedback: Record<number, "correct" | "incorrect"> = {};
    let correctCount = 0;

    resources.quiz.forEach((question, index) => {
      const isCorrect = quizAnswers[index] === question.correctAnswer;
      feedback[index] = isCorrect ? "correct" : "incorrect";
      if (isCorrect) correctCount++;
    });

    setAnswerFeedback(feedback);
    setQuizSubmitted(true);

    const allCorrect = correctCount === resources.quiz.length;

    if (allCorrect) {
      toast({
        title: "Quiz completed!",
        description:
          "Great job! You've completed this section's quiz. You'll now unlock the next section.",
      });

      // Automatically mark as complete after a short delay
      setTimeout(() => {
        handleMarkAsComplete();
      }, 2000);
    } else {
      toast({
        title: `${correctCount} of ${resources.quiz.length} correct`,
        description:
          "Review the answers and try again. Correct answers are now highlighted.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsComplete = () => {
    // Show loading state
    setIsNavigatingToNext(true);

    // Update the checkpoints array
    const updatedCheckpoints = checkpoints.map((cp, index) => {
      if (cp.id === checkpoint.id) {
        // Mark current checkpoint as completed
        return { ...cp, status: "completed", progress: 100 };
      } else if (
        cp.status === "locked" &&
        index > 0 &&
        checkpoints[index - 1].id === checkpoint.id
      ) {
        // Unlock the next checkpoint
        return { ...cp, status: "in-progress", progress: 0 };
      }
      return cp;
    });

    // Find the next checkpoint that will be unlocked
    const nextCheckpointIndex =
      checkpoints.findIndex((cp) => cp.id === checkpoint.id) + 1;
    const hasNextCheckpoint = nextCheckpointIndex < checkpoints.length;

    // Save progress
    onProgressUpdate(updatedCheckpoints);

    // Show a toast notification
    toast({
      title: "Checkpoint completed!",
      description: hasNextCheckpoint
        ? "You've unlocked the next section in your learning path."
        : "Congratulations on completing this learning path!",
    });

    // Close the current module after a delay
    setTimeout(() => {
      onClose();
      setIsNavigatingToNext(false);
    }, 1500);
  };

  const updateProgress = (progressValue: number) => {
    // Only update if not already completed
    if (
      checkpoint.status !== "completed" &&
      checkpoint.progress < progressValue
    ) {
      const updatedCheckpoints = checkpoints.map((cp) =>
        cp.id === checkpoint.id ? { ...cp, progress: progressValue } : cp
      );
      onProgressUpdate(updatedCheckpoints);
    }
  };

  // Update progress when viewing different tabs
  useEffect(() => {
    if (activeTab === "notes") {
      updateProgress(Math.max(30, checkpoint.progress));
    } else if (activeTab === "resources") {
      updateProgress(Math.max(60, checkpoint.progress));
    } else if (activeTab === "quiz") {
      updateProgress(Math.max(80, checkpoint.progress));
    }
  }, [activeTab]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-xl font-bold">{checkpoint.title}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Video player (left side) */}
        <div className="h-[300px] w-full md:h-auto md:w-2/3">
          <iframe
            src={checkpoint.videoUrl} // Use the videoUrl from the checkpoint
            title={checkpoint.title}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            // @ts-ignore
            referrerpolicy="strict-origin-when-cross-origin"
            allowFullScreen
          ></iframe>
        </div>

        {/* Resources sidebar (right side) */}
        <div className="flex w-full flex-1 flex-col border-l md:w-1/3">
          <Tabs value={activeTab} className="flex h-full flex-col">
            <div className="border-b">
              <TabsList className="w-full justify-start rounded-none border-b px-4">
                <TabsTrigger
                  value="notes"
                  onClick={() => setActiveTab("notes")}
                >
                  Notes
                </TabsTrigger>
                <TabsTrigger
                  value="resources"
                  onClick={() => setActiveTab("resources")}
                >
                  Resources
                </TabsTrigger>
                <TabsTrigger value="quiz" onClick={() => setActiveTab("quiz")}>
                  Quiz
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 p-4">
              <TabsContent value="notes" className="mt-0">
                <div className="space-y-4">
                  {resources.notes.map((note, index) => (
                    <div key={index} className="rounded-lg border p-4">
                      <h3 className="font-medium">{note.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="resources" className="mt-0">
                <div className="space-y-4">
                  {resources.resources.map((resource, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-lg border p-4"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        {resource.type === "documentation" && (
                          <BookOpen className="h-4 w-4 text-primary" />
                        )}
                        {resource.type === "pdf" && (
                          <FileText className="h-4 w-4 text-primary" />
                        )}
                        {resource.type === "exercises" && (
                          <BookOpen className="h-4 w-4 text-primary" />
                        )}
                        {resource.type === "code" && (
                          <Code className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{resource.title}</h3>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 text-sm text-primary hover:underline"
                        >
                          View Resource
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="quiz" className="mt-0">
                <div className="space-y-6">
                  {resources.quiz.map((quizItem, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border p-4 ${
                        quizSubmitted
                          ? answerFeedback[index] === "correct"
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                            : "border-red-500 bg-red-50 dark:bg-red-900/20"
                          : ""
                      }`}
                    >
                      <h3 className="font-medium">Question {index + 1}</h3>
                      <p className="mt-2">{quizItem.question}</p>
                      <div className="mt-4 space-y-2">
                        {quizItem.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className={`flex items-center gap-2 ${
                              quizSubmitted &&
                              quizItem.correctAnswer === optionIndex
                                ? "text-green-600 dark:text-green-400 font-medium"
                                : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${index}`}
                              id={`question-${index}-option-${optionIndex}`}
                              className={`h-4 w-4 ${
                                quizSubmitted &&
                                quizItem.correctAnswer === optionIndex
                                  ? "text-green-600 border-green-600"
                                  : "text-primary"
                              }`}
                              disabled={quizSubmitted}
                              checked={quizAnswers[index] === optionIndex}
                              onChange={() =>
                                handleQuizAnswer(index, optionIndex)
                              }
                            />
                            <label
                              htmlFor={`question-${index}-option-${optionIndex}`}
                              className="text-sm"
                            >
                              {option}
                              {quizSubmitted &&
                                quizItem.correctAnswer === optionIndex && (
                                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                    (Correct answer)
                                  </span>
                                )}
                            </label>
                          </div>
                        ))}
                      </div>
                      {quizSubmitted &&
                        answerFeedback[index] === "incorrect" && (
                          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                            Your answer was incorrect. The correct answer is
                            highlighted.
                          </p>
                        )}
                    </div>
                  ))}
                  {quizSubmitted ? (
                    answerFeedback &&
                    Object.values(answerFeedback).every(
                      (f) => f === "correct"
                    ) ? (
                      <Button
                        className="w-full"
                        onClick={handleMarkAsComplete}
                        disabled={isNavigatingToNext}
                      >
                        {isNavigatingToNext ? (
                          <>
                            <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                            Navigating to Next Module...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Continue to Next Module{" "}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={handleResetQuiz}
                        variant="outline"
                      >
                        Try Again
                      </Button>
                    )
                  ) : (
                    <Button className="w-full" onClick={handleQuizSubmit}>
                      Submit Answers
                    </Button>
                  )}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
