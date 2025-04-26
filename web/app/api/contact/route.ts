import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Define validation schema using Zod
const contactFormSchema = z.object({
  firstname: z.string().min(1, "First name is required").max(100),
  lastname: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address"),
  subject: z.enum([
    "GeneralInquiry",
    "TechnicalSupport", 
    "BillingQuestion", 
    "PartnershipOppurtunity", 
    "Feedback"
  ], {
    errorMap: () => ({ message: "Please select a valid subject" }),
  }),
  message: z.string().min(5, "Message is too short").max(5000, "Message is too long"),
});

/**
 * Handle POST request to store contact form submissions
 */
export async function POST(request:any) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate form data
    const validationResult = contactFormSchema.safeParse(body);
    
    if (!validationResult.success) {
      // Extract and format validation errors
      const errors = validationResult.error.errors.map(error => ({
        field: error.path.join('.'),
        message: error.message
      }));
      
      return NextResponse.json(
        { 
          success: false, 
          errors 
        }, 
        { status: 400 }
      );
    }
    
    const { firstname, lastname, email, subject, message } = validationResult.data;
    
    // Implement rate limiting based on IP or email to prevent spam
    const recentSubmissions = await prisma.contactUs.count({
      where: {
        email,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });
    
    if (recentSubmissions >= 5) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Too many submissions in 24 hours. Please try again later." 
        }, 
        { status: 429 }
      );
    }
    
    // Store in database
    const contactSubmission = await prisma.contactUs.create({
      data: {
        firstname,
        lastname,
        email,
        subject,
        message
      }
    });
    
    // Return successful response with minimal data
    return NextResponse.json(
      { 
        success: true, 
        message: "Your message has been submitted successfully",
        id: contactSubmission.id
      }, 
      { status: 201 }
    );
    
  } catch (error) {
    // Log error for server-side debugging but don't expose details to client
    console.error("Contact form submission error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "An error occurred while processing your request. Please try again later." 
      }, 
      { status: 500 }
    );
  }
}