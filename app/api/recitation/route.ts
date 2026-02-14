import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { bookRecitation, books } from "@/lib/db/schema";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";

const recitationSchema = z.object({
  book_id: z.string().uuid(),
  audio_file_path: z.string(),
  recitation_type: z.enum(["TTS", "Recorded"]),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get("book_id");

    const baseQuery = db
      .select({
        recitation: bookRecitation,
        book: books,
      })
      .from(bookRecitation)
      .leftJoin(books, eq(bookRecitation.bookId, books.bookId));

    const data = bookId
      ? await baseQuery
          .where(eq(bookRecitation.bookId, bookId))
          .orderBy(desc(bookRecitation.createdAt))
      : await baseQuery.orderBy(desc(bookRecitation.createdAt));

    const formattedRecitations = data.map((row) => ({
      ...row.recitation,
      book: row.book,
    }));

    return NextResponse.json({ recitations: formattedRecitations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isLibrarian = ["Admin", "Librarian"].includes(
      (session.user as any)?.role
    );
    if (!isLibrarian) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = recitationSchema.parse(body);

    const [newRecitation] = await db
      .insert(bookRecitation)
      .values({
        bookId: validatedData.book_id,
        audioFilePath: validatedData.audio_file_path,
        recitationType: validatedData.recitation_type,
      })
      .returning();

    // Fetch with book relation
    const [recitationWithBook] = await db
      .select({
        recitation: bookRecitation,
        book: books,
      })
      .from(bookRecitation)
      .leftJoin(books, eq(bookRecitation.bookId, books.bookId))
      .where(eq(bookRecitation.recitationId, newRecitation.recitationId))
      .limit(1);

    const formattedRecitation = {
      ...recitationWithBook.recitation,
      book: recitationWithBook.book,
    };

    return NextResponse.json(formattedRecitation, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
