import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Heart, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Vachanalaya" },
      { name: "description", content: "Vachanalaya is a free digital library of Hindu scriptures, built to make timeless texts accessible to the youth." },
      { property: "og:title", content: "About Us — Vachanalaya" },
      { property: "og:description", content: "Vachanalaya is a free digital library of Hindu scriptures, built to make timeless texts accessible to the youth." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-12 md:pt-20">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Vachanalaya</p>
        <h1 className="font-serif text-4xl tracking-tight md:text-5xl">About Us</h1>
      </div>

      <section className="mt-10 space-y-6 text-muted-foreground leading-relaxed">
        <p>
          Vachanalaya was born from a simple belief: the wisdom of Hindu scriptures belongs to everyone, and the younger generation deserves easy, free access to it.
        </p>
        <p>
          Our mission is to provide the sacred texts of Sanātana Dharma — the Upanishads, Bhagavad Gītā, Vālmīki Rāmāyaṇa, Śiva Purāṇa, Bhāgavata Purāṇa, Brahma Purāṇa, and more — in a clean, modern reading experience that respects the source and the reader. No paywalls, no distractions, no agenda other than sharing these texts as they are.
        </p>
        <p>
          We believe the youth especially need this. In a world of endless noise, these scriptures offer clarity, grounding, and a direct connection to a living tradition thousands of years old. Vachanalaya exists to make that connection possible with just a few clicks.
        </p>
      </section>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-muted/30 p-5">
          <BookOpen className="mb-3 h-5 w-5 text-primary" />
          <h3 className="font-serif text-lg">Free texts</h3>
          <p className="mt-1 text-sm text-muted-foreground">Every scripture here is available at no cost and without registration.</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/30 p-5">
          <Heart className="mb-3 h-5 w-5 text-primary" />
          <h3 className="font-serif text-lg">Made with care</h3>
          <p className="mt-1 text-sm text-muted-foreground">Respectfully formatted, easy to read, and simple to search and navigate.</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/30 p-5">
          <Users className="mb-3 h-5 w-5 text-primary" />
          <h3 className="font-serif text-lg">For the youth</h3>
          <p className="mt-1 text-sm text-muted-foreground">Built to introduce young readers to Hindu scriptures in a familiar, accessible way.</p>
        </div>
      </div>

      <section className="mt-14">
        <h2 className="font-serif text-2xl tracking-tight">The initiative</h2>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          This initiative was undertaken by Arjun Mishra, a student of Seth M. R. Jaipuria School, Gomti Nagar. The project is a personal effort to put these timeless texts within reach of anyone curious enough to open them.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl tracking-tight">What's inside</h2>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          The library currently includes the 108 Upanishads, the complete Bhagavad Gītā, the Vālmīki Rāmāyaṇa with verse-by-verse English translation, the Śiva Purāṇa, the Śrīmad Bhāgavata Purāṇa, and the Brahma Purāṇa — with more texts planned over time. Each work is presented with readable typography, chapter navigation, and search so readers can find their way easily.
        </p>
      </section>

      <p className="mt-12 text-sm text-muted-foreground">
        If you find value here, share it. The scriptures are meant to travel.
      </p>
    </main>
  );
}
