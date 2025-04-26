import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get a single contact submission
// @ts-ignore
export async function GET(request, { params }) {
  const { id } = params;

  try {
    const contactSubmission = await prisma.contactUs.findUnique({
      where: { id },
    });

    if (!contactSubmission) {
      return NextResponse.json(
        { error: "Contact submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(contactSubmission);
  } catch (error) {
    console.error("Error fetching contact submission:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact submission" },
      { status: 500 }
    );
  }
}

// Delete a contact submission
// @ts-ignore
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    await prisma.contactUs.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact submission:", error);
    return NextResponse.json(
      { error: "Failed to delete contact submission" },
      { status: 500 }
    );
  }
}
