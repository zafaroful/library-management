import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { loans, books, chatbotInteraction } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a helpful library assistant for a Library Management System. 
You can help users with:
- Finding books by title, author, or category
- Understanding how to borrow and return books
- Information about reservations
- Fine calculations and payments
- General library policies

Be friendly, concise, and helpful. If you don't know something, suggest they contact a librarian.`;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { question } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Get context about the library (recent books, user's loans, etc.)
    const userLoans = await db
      .select({
        loan: loans,
        book: books,
      })
      .from(loans)
      .leftJoin(books, eq(loans.bookId, books.bookId))
      .where(
        and(
          eq(loans.userId, (session.user as any)?.id),
          eq(loans.status, "Borrowed")
        )
      )
      .limit(5);

    const context = userLoans.length > 0
      ? `User's current loans: ${userLoans.map((l) => l.book?.title).filter(Boolean).join(", ")}`
      : "User has no current loans";

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: `Context: ${context}` },
        { role: "user", content: question },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response =
      completion.choices[0]?.message?.content ||
      "I apologize, but I could not generate a response.";

    // Save interaction to database
    await db.insert(chatbotInteraction).values({
      userId: (session.user as any)?.id,
      question,
      response,
    });

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("Chatbot error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get response from chatbot" },
      { status: 500 }
    );
  }
}
