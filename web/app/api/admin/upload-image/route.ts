import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Get file data in ArrayBuffer format
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate a unique filename
    const filename = `${uuidv4()}-${file.name.replace(/\s+/g, "_")}`;

    // Define the upload path - make sure the public/uploads directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, filename);

    // Write the file to the uploads directory
    await writeFile(filePath, buffer);

    // Return the URL to the uploaded file
    const imageUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      imageUrl,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
