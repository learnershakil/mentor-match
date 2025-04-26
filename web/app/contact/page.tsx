"use client";

import type React from "react";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, MapPin, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

// These values must match the enum in the Prisma schema
const SUBJECT_OPTIONS = [
  { value: "GeneralInquiry", label: "General Inquiry" },
  { value: "TechnicalSupport", label: "Technical Support" },
  { value: "BillingQuestion", label: "Billing Question" },
  { value: "PartnershipOppurtunity", label: "Partnership Opportunity" },
  { value: "Feedback", label: "Feedback" },
];

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    subject: "",
    message: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));

    // Clear error when field is edited
    if (formErrors[id]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      subject: value,
    }));

    // Clear error when field is edited
    if (formErrors.subject) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.subject;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setFormErrors({});

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          // Format validation errors from the API
          const errorObj: Record<string, string> = {};
          data.errors.forEach((err: { field: string; message: string }) => {
            errorObj[err.field] = err.message;
          });
          setFormErrors(errorObj);
          toast.error("Please correct the errors in the form");
        } else if (data.message) {
          toast.error(data.message);
        } else {
          toast.error("Failed to send message. Please try again.");
        }
        return;
      }

      // Success
      toast.success(
        data.message ||
          "Your message has been sent! We'll get back to you soon."
      );

      // Reset form
      setFormData({
        firstname: "",
        lastname: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1">
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Contact Us
            </h1>
            <p className="mt-4 text-xl text-muted-foreground">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Get in Touch
              </h2>
              <p className="mt-2 text-muted-foreground">
                Fill out the form and our team will get back to you as soon as
                possible.
              </p>

              <div className="mt-8 space-y-6">
                <Card>
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Email</h3>
                      <p className="text-sm text-muted-foreground">
                        support@mentormatch.com
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Phone</h3>
                      <p className="text-sm text-muted-foreground">
                        +91 6283 415 167
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Office</h3>
                      <p className="text-sm text-muted-foreground">
                        Lovely Professional University , Phagwara, Punjab 144411
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstname">First name</Label>
                    <Input
                      id="firstname"
                      value={formData.firstname}
                      onChange={handleChange}
                      placeholder="Enter your first name"
                      required
                      disabled={isLoading}
                    />
                    {formErrors.firstname && (
                      <p className="text-sm text-red-500">
                        {formErrors.firstname}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastname">Last name</Label>
                    <Input
                      id="lastname"
                      value={formData.lastname}
                      onChange={handleChange}
                      placeholder="Enter your last name"
                      required
                      disabled={isLoading}
                    />
                    {formErrors.lastname && (
                      <p className="text-sm text-red-500">
                        {formErrors.lastname}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    required
                    disabled={isLoading}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-500">{formErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    disabled={isLoading}
                    required
                    value={formData.subject}
                    onValueChange={handleSelectChange}
                  >
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.subject && (
                    <p className="text-sm text-red-500">{formErrors.subject}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="How can we help you?"
                    className="min-h-[150px]"
                    required
                    disabled={isLoading}
                  />
                  {formErrors.message && (
                    <p className="text-sm text-red-500">{formErrors.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/50 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-muted-foreground">
              Find quick answers to common questions.
            </p>
          </div>
          <div className="mx-auto mt-8 grid max-w-4xl gap-6">
            {[
              {
                question: "How do I sign up as a mentor?",
                answer:
                  "To sign up as a mentor, create an account and select 'Professional (Mentor)' as your role during registration. You'll be asked to provide information about your expertise and experience.",
              },
              {
                question: "How are mentor sessions scheduled?",
                answer:
                  "Once you've selected a mentor, you can view their availability calendar and book a session at a time that works for both of you. You'll receive a confirmation email with the session details.",
              },
              {
                question: "What technology do I need for mentor sessions?",
                answer:
                  "You'll need a computer with a webcam, microphone, and stable internet connection. Our platform works in modern browsers without requiring any additional software installation.",
              },
              {
                question: "Can I change my mentor?",
                answer:
                  "Yes, you can work with multiple mentors or switch to a different mentor at any time. This flexibility allows you to find the best match for your learning needs.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="rounded-lg border bg-background p-6 shadow-sm"
              >
                <h3 className="font-semibold">{faq.question}</h3>
                <p className="mt-2 text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
