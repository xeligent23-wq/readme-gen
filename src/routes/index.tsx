import { createFileRoute } from "@tanstack/react-router";
import { ReadmeGenerator } from "@/components/ReadmeGenerator";

export const Route = createFileRoute("/")({
  component: ReadmeGenerator,
  head: () => ({
    meta: [
      { title: "README Generator — Craft polished READMEs fast" },
      {
        name: "description",
        content:
          "Modern README generator with live GitHub-style markdown preview, copy to clipboard, and one-click download.",
      },
    ],
  }),
});
