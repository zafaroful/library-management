import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

type SeedBook = {
  title: string;
  author: string;
  isbn: string;
  category: string;
  copiesTotal: number;
  copiesAvailable: number;
  availabilityStatus: "Available" | "Borrowed" | "Reserved";
};

const seedBooks: SeedBook[] = [
  {
    title: "Clean Code: A Handbook of Agile Software Craftsmanship",
    author: "Robert C. Martin",
    isbn: "9780132350884",
    category: "Software Engineering",
    copiesTotal: 5,
    copiesAvailable: 5,
    availabilityStatus: "Available",
  },
  {
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen",
    isbn: "9780262033848",
    category: "Computer Science",
    copiesTotal: 3,
    copiesAvailable: 3,
    availabilityStatus: "Available",
  },
  {
    title: "Design Patterns: Elements of Reusable Object-Oriented Software",
    author: "Erich Gamma",
    isbn: "9780201633610",
    category: "Software Engineering",
    copiesTotal: 2,
    copiesAvailable: 2,
    availabilityStatus: "Available",
  },
  {
    title: "The Pragmatic Programmer",
    author: "Andrew Hunt",
    isbn: "9780201616224",
    category: "Software Engineering",
    copiesTotal: 4,
    copiesAvailable: 4,
    availabilityStatus: "Available",
  },
  {
    title: "Database System Concepts",
    author: "Abraham Silberschatz",
    isbn: "9780073523323",
    category: "Databases",
    copiesTotal: 2,
    copiesAvailable: 2,
    availabilityStatus: "Available",
  },
  {
    title: "Computer Networks",
    author: "Andrew S. Tanenbaum",
    isbn: "9780132126953",
    category: "Networking",
    copiesTotal: 2,
    copiesAvailable: 2,
    availabilityStatus: "Available",
  },
  {
    title: "Operating System Concepts",
    author: "Abraham Silberschatz",
    isbn: "9781119800361",
    category: "Operating Systems",
    copiesTotal: 3,
    copiesAvailable: 3,
    availabilityStatus: "Available",
  },
  {
    title: "Artificial Intelligence: A Modern Approach",
    author: "Stuart Russell",
    isbn: "9780134610993",
    category: "Artificial Intelligence",
    copiesTotal: 2,
    copiesAvailable: 2,
    availabilityStatus: "Available",
  },
  {
    title: "Deep Learning",
    author: "Ian Goodfellow",
    isbn: "9780262035613",
    category: "Machine Learning",
    copiesTotal: 2,
    copiesAvailable: 2,
    availabilityStatus: "Available",
  },
  {
    title: "The Mythical Man-Month",
    author: "Frederick P. Brooks Jr.",
    isbn: "9780201835953",
    category: "Project Management",
    copiesTotal: 1,
    copiesAvailable: 1,
    availabilityStatus: "Available",
  },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = postgres(process.env.DATABASE_URL);

  try {
    const insertedIsbns: string[] = [];
    const skippedIsbns: string[] = [];

    for (const b of seedBooks) {
      const rows = await sql`
        INSERT INTO public.books (
          title,
          author,
          isbn,
          category,
          availability_status,
          copies_total,
          copies_available
        ) VALUES (
          ${b.title},
          ${b.author},
          ${b.isbn},
          ${b.category},
          ${b.availabilityStatus},
          ${b.copiesTotal},
          ${b.copiesAvailable}
        )
        ON CONFLICT (isbn) DO NOTHING
        RETURNING isbn;
      `;

      if (rows.length > 0) insertedIsbns.push(b.isbn);
      else skippedIsbns.push(b.isbn);
    }

    console.log(`✅ Seed complete. Inserted: ${insertedIsbns.length}, Skipped (already existed): ${skippedIsbns.length}`);
    if (insertedIsbns.length) console.log("Inserted ISBNs:", insertedIsbns.join(", "));
    if (skippedIsbns.length) console.log("Skipped ISBNs:", skippedIsbns.join(", "));
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("❌ Failed seeding books:", err);
  process.exitCode = 1;
});

