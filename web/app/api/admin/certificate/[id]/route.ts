import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Update certificate
export async function PUT(request, { params }) {
  const { id } = params;

  try {
    const body = await request.json();

    // Update certificate
    const updatedCertificate = await prisma.certificate.update({
      where: { id },
      data: {
        certificateName: body.certificateName,
        issueDate: body.issueDate,
        viewLink: body.viewLink,
        downloadLink: body.downloadLink,
      },
    });

    return NextResponse.json(updatedCertificate);
  } catch (error) {
    console.error("Error updating certificate:", error);
    return NextResponse.json(
      { error: "Failed to update certificate" },
      { status: 500 }
    );
  }
}

// Delete certificate
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    await prisma.certificate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting certificate:", error);
    return NextResponse.json(
      { error: "Failed to delete certificate" },
      { status: 500 }
    );
  }
}
