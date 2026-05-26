import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  title: z.string().min(1).max(120),
});

const schema = {
  type: "object",
  properties: {
    description: {
      type: "string",
      description: "A compelling 1-2 sentence description of the project.",
    },
    features: {
      type: "array",
      items: { type: "string" },
      description: "4-6 concise feature bullets (no leading dash).",
    },
    installation: {
      type: "string",
      description: "Shell commands to install and set up the project. Plain commands, no markdown fences.",
    },
    usage: {
      type: "string",
      description: "A short code snippet or command demonstrating typical usage. No markdown fences.",
    },
    techStack: {
      type: "array",
      items: { type: "string" },
      description: "Likely technologies used (4-6 items).",
    },
  },
  required: ["description", "features", "installation", "usage", "techStack"],
  additionalProperties: false,
} as const;

export type GeneratedReadme = {
  description: string;
  features: string[];
  installation: string;
  usage: string;
  techStack: string[];
};

export const generateReadme = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<{ result: GeneratedReadme | null; error: string | null }> => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) {
      return { result: null, error: "LOVABLE_API_KEY is not configured" };
    }

    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "You write high-quality README content for software projects. Given a project title, infer a sensible product and produce concise, professional, GitHub-ready content. Never wrap fields in markdown code fences.",
            },
            {
              role: "user",
              content: `Project title: "${data.title}"\n\nGenerate the README fields.`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "fill_readme",
                description: "Provide the structured README fields.",
                parameters: schema,
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "fill_readme" } },
        }),
      });

      if (response.status === 429) {
        return { result: null, error: "Rate limited — please try again in a moment." };
      }
      if (response.status === 402) {
        return { result: null, error: "AI credits exhausted. Add credits in Settings > Workspace > Usage." };
      }
      if (!response.ok) {
        const text = await response.text();
        console.error("AI gateway error", response.status, text);
        return { result: null, error: `AI gateway error (${response.status})` };
      }

      const json = await response.json();
      const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0];
      const argsRaw = toolCall?.function?.arguments;
      if (!argsRaw) {
        return { result: null, error: "No structured response from model." };
      }
      const parsed = JSON.parse(argsRaw) as GeneratedReadme;
      return { result: parsed, error: null };
    } catch (e) {
      console.error("generateReadme failed", e);
      return { result: null, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });
