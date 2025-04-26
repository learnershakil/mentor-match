import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get all contact submissions
export async function GET() {
  try {
    console.log("Fetching contact submissions...");

    const contactSubmissions = await prisma.contactUs.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Found ${contactSubmissions.length} contact submissions`);
    return NextResponse.json(contactSubmissions);
  } catch (error) {
    console.error("Error fetching contact submissions:", error);
    return NextResponse.json(
      // @ts-ignore
      { error: "Failed to fetch contact submissions", details: error.message },
      { status: 500 }
    );
  }
}
