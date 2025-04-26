"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

// Updated to align with the Prisma schema Interest enum
const interests = [
  { id: "WebDevelopment", label: "Web Development" },
  { id: "AppDevelopment", label: "App Development" },
  { id: "AiMl", label: "AI/ML" },
  { id: "CyberSecurity", label: "Cybersecurity" },
];

export function SignUpForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("STUDENT");
  const [selectedInterest, setSelectedInterest] = useState("WebDevelopment");
  const [level, setLevel] = useState("BEGINNER");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formElement = event.currentTarget;
      const formData = {
        firstName: (formElement.querySelector("#firstName") as HTMLInputElement)
          .value,
        lastName: (formElement.querySelector("#lastName") as HTMLInputElement)
          .value,
        email: (formElement.querySelector("#email") as HTMLInputElement).value,
        phone: (formElement.querySelector("#phone") as HTMLInputElement).value,
        password: (formElement.querySelector("#password") as HTMLInputElement)
          .value,
        role: role, // Now correctly using uppercase values matching the enum
        // Map selected interest to schema's "intrest" field
        intrest: selectedInterest,
        bio:
          role === "MENTOR"
            ? (formElement.querySelector("#bio") as HTMLTextAreaElement)?.value
            : null,

        // Student-specific fields
        learningInterests: [selectedInterest],
        level: level,

        // Mentor-specific fields
        specialties: [selectedInterest],
        company:
          role === "MENTOR"
            ? (formElement.querySelector("#company") as HTMLInputElement)?.value
            : null,
        jobTitle:
          role === "MENTOR"
            ? (formElement.querySelector("#jobTitle") as HTMLInputElement)
                ?.value
            : null,
        experience:
          role === "MENTOR"
            ? parseInt(
                (formElement.querySelector("#experience") as HTMLInputElement)
                  ?.value || "0"
              )
            : null,
      };

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Account created successfully!");
        router.push("/signin"); // Redirect to login instead of dashboard as user needs to log in first
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to create account");
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            placeholder="First Name"
            disabled={isLoading}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            placeholder="Last Name"
            disabled={isLoading}
            required
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          placeholder="your.mail@example.com"
          type="email"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect="off"
          name="email"
          disabled={isLoading}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          name="phone"
          placeholder="+91 12345 67890"
          type="tel"
          disabled={isLoading}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoCapitalize="none"
            autoComplete="new-password"
            name="password"
            disabled={isLoading}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="sr-only">
              {showPassword ? "Hide password" : "Show password"}
            </span>
          </Button>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="role">Role</Label>
        <Select
          defaultValue="STUDENT"
          onValueChange={setRole}
          disabled={isLoading}
        >
          <SelectTrigger id="role">
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="STUDENT">Student</SelectItem>
            <SelectItem value="MENTOR">Professional (Mentor)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="interest">Primary Interest</Label>
        <Select
          defaultValue="WebDevelopment"
          onValueChange={setSelectedInterest}
          disabled={isLoading}
        >
          <SelectTrigger id="interest">
            <SelectValue placeholder="Select your interest" />
          </SelectTrigger>
          <SelectContent>
            {interests.map((interest) => (
              <SelectItem key={interest.id} value={interest.id}>
                {interest.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {role === "STUDENT" && (
        <div className="grid gap-2">
          <Label htmlFor="level">Skill Level</Label>
          <Select
            defaultValue="BEGINNER"
            onValueChange={setLevel}
            disabled={isLoading}
          >
            <SelectTrigger id="level">
              <SelectValue placeholder="Select your skill level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BEGINNER">Beginner</SelectItem>
              <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
              <SelectItem value="ADVANCED">Advanced</SelectItem>
              <SelectItem value="EXPERT">Expert</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {role === "MENTOR" && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="bio">Professional Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about your professional experience and expertise..."
              className="min-h-[100px]"
              name="bio"
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                name="company"
                placeholder="Your company"
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                name="jobTitle"
                placeholder="Your job title"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="experience">Years of Experience</Label>
            <Input
              id="experience"
              name="experience"
              type="number"
              min="0"
              placeholder="Years of experience"
              disabled={isLoading}
            />
          </div>
        </>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox id="terms" required disabled={isLoading} />
        <Label
          htmlFor="terms"
          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          I agree to the{" "}
          <a
            href="/terms"
            className="text-primary underline-offset-4 hover:underline"
          >
            terms of service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            className="text-primary underline-offset-4 hover:underline"
          >
            privacy policy
          </a>
          .
        </Label>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Account
      </Button>
    </form>
  );
}
