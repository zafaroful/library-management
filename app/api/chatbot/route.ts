import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { loans, books, chatbotInteraction } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import OpenAI from "openai";

function normalizeOpenAiKey(raw: string | undefined): string {
  if (!raw) return "";
  let k = raw.trim();
  if (
    (k.startsWith('"') && k.endsWith('"')) ||
    (k.startsWith("'") && k.endsWith("'"))
  ) {
    k = k.slice(1, -1).trim();
  }
  return k;
}

/** Returns an error message if the key is missing, a tutorial placeholder, or wrong shape. */
function openAiKeySetupError(key: string): string | null {
  if (!key) {
    return "OpenAI is not configured. Add OPENAI_API_KEY to your .env file and restart the server.";
  }
  const lower = key.toLowerCase();
  if (
    lower.includes("your_open") ||
    lower.includes("your-ope") ||
    lower.includes("replace_me") ||
    lower.includes("placeholder") ||
    /^sk[-_]?your/i.test(key) ||
    /^sk[-_]?\.\.\./i.test(key)
  ) {
    return "OPENAI_API_KEY is still a placeholder. Open https://platform.openai.com/api-keys , create a secret key, paste it into .env as OPENAI_API_KEY=sk-... (no quotes), save, and restart npm run dev.";
  }
  if (!key.startsWith("sk-")) {
    return "OPENAI_API_KEY must start with sk-. Copy the full secret key from https://platform.openai.com/api-keys";
  }
  if (key.length < 20) {
    return "OPENAI_API_KEY looks truncated. Copy the entire key from OpenAI (it is a long string starting with sk-).";
  }
  return null;
}

const SYSTEM_PROMPT = `You are a helpful library assistant for a Library Management System. 
You can help users with:
- Finding books by title, author, or category
- Understanding how to borrow and return books
- Information about reservations
- Fine calculations and payments
- General library policies

Be friendly, concise, and helpful. If you don't know something, suggest they contact a librarian.`;

function localLibraryReply(question: string, context: string): string {
  const q = question.toLowerCase();
  const hasLoans = !context.toLowerCase().includes("no current loans");

  if (q.includes("loan") || q.includes("borrow")) {
    return hasLoans
      ? `You can borrow books from the Books page and track active items in Loans. ${context}. If you need renewal, please contact a librarian.`
      : "To borrow a book, open Books, choose an available title, then complete the loan flow. Your account currently has no active borrowed items.";
  }

  if (q.includes("return")) {
    return "You can return borrowed books from the Loans section. If you cannot return online, bring the book to the circulation desk for staff processing.";
  }

  if (q.includes("reserve") || q.includes("reservation")) {
    return "Use Reservations to place a hold on unavailable books. You can monitor reservation status from the Reservations page.";
  }

  if (q.includes("fine") || q.includes("payment")) {
    return "You can check current penalties in Fines. Overdue items may increase fines daily based on your library policy.";
  }

  if (q.includes("find") || q.includes("search") || q.includes("book")) {
    return "Use the Books page search box to filter by title, author, or ISBN, and refine results with category.";
  }

  return "I can help with books, loans, reservations, and fines. Please ask a specific question, and if needed I will direct you to the correct page.";
}

async function saveChatInteraction(
  userId: string | undefined,
  question: string,
  response: string
) {
  try {
    await db.insert(chatbotInteraction).values({
      userId,
      question,
      response,
    });
  } catch (dbError) {
    console.error("Chatbot interaction save failed:", dbError);
  }
}

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

    const apiKey = normalizeOpenAiKey(process.env.OPENAI_API_KEY);
    const keyErr = openAiKeySetupError(apiKey);

    // If key is missing/misconfigured, degrade gracefully to local assistant.
    if (keyErr) {
      const fallback = `${localLibraryReply(question, context)}\n\nAI provider is currently unavailable (${keyErr})`;
      await saveChatInteraction((session.user as any)?.id, question, fallback);
      return NextResponse.json({ response: fallback, fallback: true });
    }

    const openai = new OpenAI({ apiKey });
    const model = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";

    try {
      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model,
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

      await saveChatInteraction((session.user as any)?.id, question, response);
      return NextResponse.json({ response });
    } catch (openAiError: any) {
      const status = openAiError?.status ?? openAiError?.response?.status;
      const code = openAiError?.code ?? openAiError?.error?.code;
      const errType = openAiError?.error?.type;

      if (
        status === 401 ||
        code === "invalid_api_key" ||
        code === "insufficient_quota" ||
        errType === "insufficient_quota" ||
        status === 429 ||
        code === "rate_limit_exceeded"
      ) {
        const fallback = `${localLibraryReply(question, context)}\n\nAI provider is temporarily unavailable (${code || status || "provider_error"}).`;
        await saveChatInteraction((session.user as any)?.id, question, fallback);
        return NextResponse.json({ response: fallback, fallback: true });
      }

      throw openAiError;
    }
  } catch (error: any) {
    console.error("Chatbot error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get response from chatbot" },
      { status: 500 }
    );
  }
}
