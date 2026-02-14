import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { transformBook } from "@/lib/utils/transform";

// Normalize optional number fields: empty string -> undefined, numeric string -> number
const optionalInt = (schema: z.ZodNumber) =>
  z.preprocess(
    (val) =>
      val === "" || val === undefined || val === null
        ? undefined
        : typeof val === "string"
          ? (Number(val) || undefined)
          : val,
    schema.optional().nullable()
  );

const updateBookSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  isbn: z.string().optional(),
  category: z.string().optional(),
  cover_image_url: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  pages: optionalInt(z.number().int().positive()),
  publication_year: optionalInt(z.number().int().min(1000).max(2100)),
  copies_total: z.number().int().positive().optional(),
  copies_available: z.number().int().nonnegative().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.bookId, id))
      .limit(1);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Transform to snake_case for frontend
    const transformedBook = transformBook(book);

    return NextResponse.json(transformedBook);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isLibrarian = ["Admin", "Librarian"].includes(
      (session?.user as any)?.role
    );
    if (!isLibrarian) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateBookSchema.parse(body);

    // Get current book
    const [currentBook] = await db
      .select()
      .from(books)
      .where(eq(books.bookId, id))
      .limit(1);

    if (!currentBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Normalize empty strings to null for optional DB columns
    const optionalStr = (s: string | null | undefined) =>
      s === "" || s === undefined ? null : s;

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (validatedData.title !== undefined)
      updateData.title = validatedData.title;
    if (validatedData.author !== undefined)
      updateData.author = validatedData.author;
    if (validatedData.isbn !== undefined)
      updateData.isbn = optionalStr(validatedData.isbn) ?? null;
    if (validatedData.category !== undefined)
      updateData.category = optionalStr(validatedData.category) ?? null;
    if (validatedData.cover_image_url !== undefined)
      updateData.coverImageUrl = optionalStr(validatedData.cover_image_url);
    if (validatedData.description !== undefined)
      updateData.description = optionalStr(validatedData.description);
    if (validatedData.pages !== undefined && validatedData.pages !== null)
      updateData.pages = validatedData.pages;
    else if (validatedData.pages === null)
      updateData.pages = null;
    if (
      validatedData.publication_year !== undefined &&
      validatedData.publication_year !== null
    )
      updateData.publicationYear = validatedData.publication_year;
    else if (validatedData.publication_year === null)
      updateData.publicationYear = null;
    if (validatedData.copies_total !== undefined)
      updateData.copiesTotal = validatedData.copies_total;
    if (validatedData.copies_available !== undefined)
      updateData.copiesAvailable = validatedData.copies_available;

    // Recalculate availability if copies changed
    if (
      validatedData.copies_available !== undefined ||
      validatedData.copies_total !== undefined
    ) {
      const newAvailable =
        validatedData.copies_available ?? currentBook.copiesAvailable;
      updateData.availabilityStatus =
        newAvailable > 0 ? "Available" : "Borrowed";
    }

    const [updatedBook] = await db
      .update(books)
      .set(updateData)
      .where(eq(books.bookId, id))
      .returning();

    // Transform to snake_case for frontend
    const transformedBook = transformBook(updatedBook);

    return NextResponse.json(transformedBook);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isLibrarian = ["Admin", "Librarian"].includes(
      (session?.user as any)?.role
    );
    if (!isLibrarian) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await db.delete(books).where(eq(books.bookId, id));

    return NextResponse.json({ message: "Book deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
