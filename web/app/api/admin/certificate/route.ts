import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Create new certificate
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.progressId || !body.certificateName || !body.issueDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create certificate
    const newCertificate = await prisma.certificate.create({
      data: {
        progressId: body.progressId,
        certificateName: body.certificateName,
        issueDate: body.issueDate,
        viewLink: body.viewLink || null,
        downloadLink: body.downloadLink || null,
      },
    });

    return NextResponse.json(newCertificate, { status: 201 });
  } catch (error) {
    console.error("Error creating certificate:", error);
    return NextResponse.json(
      { error: "Failed to create certificate" },
      { status: 500 }
    );
  }
}
