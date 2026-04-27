import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED_EXT = new Set(["mp3", "m4a", "mp4"]);

const MAX_BYTES = 50 * 1024 * 1024; // 50MB

function safeExt(filename: string, mime: string): string | null {
  const raw = filename.replace(/^.*\./, "").toLowerCase();
  if (ALLOWED_EXT.has(raw)) return raw;

  if (mime === "audio/mpeg" || mime === "audio/mp3") return "mp3";
  if (mime === "audio/mp4") return "m4a";
  if (mime === "video/mp4") return "mp4";
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isLibrarian = ["Admin", "Librarian"].includes(
      (session?.user as { role?: string })?.role ?? ""
    );
    if (!isLibrarian) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("audio") as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const mime = (file.type || "").trim();
    const ext = safeExt(file.name, mime);
    if (!ext) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Use MP3, M4A, or MP4 (audio/video container).",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB." },
        { status: 400 }
      );
    }

    const dir = path.join(process.cwd(), "public", "uploads", "recitations");
    await mkdir(dir, { recursive: true });

    const filename = `${randomUUID()}.${ext}`;
    const diskPath = path.join(dir, filename);
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(diskPath, bytes);

    const audio_file_path = `/uploads/recitations/${filename}`;
    return NextResponse.json({ audio_file_path });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
