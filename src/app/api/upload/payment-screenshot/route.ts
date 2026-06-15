import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { uploadPaymentScreenshot } from "@/features/upload/services/cloudinary-client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be 5MB or less" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const secureUrl = await uploadPaymentScreenshot(buffer, user.id);

    return NextResponse.json({ secureUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload file";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
