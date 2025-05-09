'use client'
import Link from "next/link"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { redirect } from "next/navigation"

export default function SignUpPage() {
  const { data: session, status } = useSession()
 
  useEffect(() => {
    if (status === "loading") return // Wait till loading finishes

    if (session) {
      redirect("/dashboard")
    }
  }, [session, status])

  if (status === "loading") {
    return <p className="text-center text-4xl text-purple-700 font-bold">Loading...</p>
  }
  return (
    <div className="container flex h-full flex-col items-center justify-center py-12 md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-[url(/mentor.jpg)] bg-cover" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          MentorMatch
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "Joining as a mentor has been incredibly rewarding. I've helped students achieve their goals while
              sharpening my own skills."
            </p>
            <footer className="text-sm">Dr. Alex Rivera - AI Research Scientist</footer>
          </blockquote>
        </div>
      </div>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 p-8 sm:w-[550px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
          <p className="text-sm text-muted-foreground">Fill in your details to get started with MentorMatch</p>
        </div>
        <SignUpForm />
        <p className="px-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/signin" className="underline underline-offset-4 hover:text-primary">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

