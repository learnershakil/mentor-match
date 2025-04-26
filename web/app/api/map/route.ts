import { NextRequest, NextResponse } from "next/server";
 import { getServerSession } from "next-auth";
 import { NEXT_AUTH_CONFIG } from "@/lib/auth";
 import { prisma } from "@/lib/prisma";
 
 export async function GET(req: NextRequest) {
   try {
     // @ts-ignore
     const session = await getServerSession(NEXT_AUTH_CONFIG);
 
     if (!session) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
     }
 
     // Fetch user data from database
     const user = await prisma.user.findUnique({
       where: { id: session.user.id },
       select: {
         id: true,
         firstName: true,
         lastName: true,
         email: true,
         role: true,
         intrest: true, // Match the field name in schema
         bio: true,
         image: true,
       },
     });
 
     if (!user) {
       return NextResponse.json({ error: "User not found" }, { status: 404 });
     }
 
     // Map to a consistent interface (using "interest" as the property name)
     return NextResponse.json({
       id: user.id,
       firstName: user.firstName,
       lastName: user.lastName,
       email: user.email,
       role: user.role,
       interest: user.intrest, // Map from DB field name to API response name
       bio: user.bio,
       image: user.image,
     });
   } catch (error) {
     console.error("Error fetching user profile:", error);
     return NextResponse.json(
       { error: "Failed to fetch user profile" },
       { status: 500 }
     );
   }
 }