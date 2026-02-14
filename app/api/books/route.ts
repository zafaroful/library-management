import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { z } from "zod";
import { eq, or, like, desc, and, sql } from "drizzle-orm";
import { transformBook } from "@/lib/utils/transform";

// Normalize optional number fields: empty string -> null, numeric string -> number
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

// Coerce copies from string/form and ensure they are numbers (reject "Available" etc.)
const copiesSchema = z.preprocess(
  (val) => {
    if (val === "" || val === undefined || val === null) return undefined;
    const n = typeof val === "string" ? parseInt(val, 10) : Number(val);
    return Number.isFinite(n) ? n : undefined;
  },
  z.number().int().positive().default(1)
);
const copiesAvailableSchema = z.preprocess(
  (val) => {
    if (val === "" || val === undefined || val === null) return undefined;
    const n = typeof val === "string" ? parseInt(val, 10) : Number(val);
    return Number.isFinite(n) ? n : undefined;
  },
  z.number().int().nonnegative().default(1)
);

const bookSchema = z
  .object({
    title: z.string().min(1),
    author: z.string().min(1),
    isbn: z.string().optional(),
    category: z.string().optional(),
    cover_image_url: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    pages: optionalInt(z.number().int().positive()),
    publication_year: optionalInt(z.number().int().min(1000).max(2100)),
    copies_total: copiesSchema,
    copies_available: copiesAvailableSchema,
  })
  .refine((d) => d.copies_available <= d.copies_total, {
    message: "Available copies cannot exceed total copies",
    path: ["copies_available"],
  });

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(books.title, `%${search}%`),
          like(books.author, `%${search}%`),
          like(books.isbn, `%${search}%`)
        )!
      );
    }

    if (category) {
      conditions.push(eq(books.category, category));
    }

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(books);
    if (conditions.length > 0) {
      countQuery = countQuery.where(
        conditions.length === 1 ? conditions[0] : and(...conditions)
      ) as any;
    }
    const [{ count: totalCount }] = await countQuery;

    // Get data
    let query = db.select().from(books);
    if (conditions.length > 0) {
      query = query.where(
        conditions.length === 1 ? conditions[0] : and(...conditions)
      ) as any;
    }

    const data = await query
      .orderBy(desc(books.createdAt))
      .limit(limit)
      .offset(offset);

    // Transform to snake_case for frontend
    const transformedBooks = data.map(transformBook);

    return NextResponse.json({
      books: transformedBooks,
      pagination: {
        page,
        limit,
        total: Number(totalCount),
        totalPages: Math.ceil(Number(totalCount) / limit),
      },
    });
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
      (session?.user as any)?.role
    );
    if (!isLibrarian) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = bookSchema.parse(body);

    // Ensure optional fields are null (not empty string) for DB integer/text columns
    const optionalStr = (s: string | null | undefined) =>
      s === "" || s === undefined ? null : s;
    // Never send '' or non-finite to integer columns — PostgreSQL rejects them
    const optionalNum = (n: number | string | null | undefined): number | null => {
      if (n === undefined || n === null || n === "") return null;
      const num = typeof n === "number" ? n : Number(n);
      return Number.isFinite(num) ? num : null;
    };
console.log("optionalNum",validatedData);    const [newBook] = await db
      .insert(books)
      .values({
        title: validatedData.title,
        author: validatedData.author,
        isbn: optionalStr(validatedData.isbn ?? undefined) ?? null,
        category: optionalStr(validatedData.category ?? undefined) ?? null,
        coverImageUrl: optionalStr(validatedData.cover_image_url ?? undefined),
        description: optionalStr(validatedData.description ?? undefined),
        pages: optionalNum(validatedData.pages ?? undefined),
        publicationYear: optionalNum(validatedData.publication_year ?? undefined),
        copiesTotal: validatedData.copies_total,
        copiesAvailable: validatedData.copies_available,
        availabilityStatus:
          validatedData.copies_available > 0 ? "Available" : "Borrowed",
      })
      .returning();

    // Transform to snake_case for frontend
    const transformedBook = transformBook(newBook);

    return NextResponse.json(transformedBook, { status: 201 });
  } catch (error: any) {
    console.log("error in books route", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
