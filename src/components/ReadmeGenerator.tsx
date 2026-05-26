import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, Download, FileText, Eye, Pencil, Moon, Sun, Sparkles, Loader2 } from "lucide-react";
import { generateReadme } from "@/lib/generate-readme.functions";

type Fields = {
  name: string;
  description: string;
  installation: string;
  usage: string;
  features: string;
  techStack: string;
};

const initial: Fields = {
  name: "My Awesome Project",
  description: "A short, compelling description of what this project does and who it's for.",
  installation: "npm install\nnpm run dev",
  usage: "import { thing } from 'my-awesome-project';\n\nthing.doSomething();",
  features: "Lightning fast performance\nFully typed API\nZero config setup\nWorks in every modern browser",
  techStack: "React\nTypeScript\nTailwind CSS\nVite",
};

function bulletize(text: string, splitOn: RegExp = /\n/) {
  return text
    .split(splitOn)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `- ${l}`)
    .join("\n");
}

function buildMarkdown(f: Fields) {
  const parts: string[] = [];
  parts.push(`# ${f.name || "Project Name"}\n`);
  if (f.description.trim()) parts.push(`${f.description.trim()}\n`);

  parts.push(`## Table of Contents\n`);
  const toc: string[] = [];
  if (f.features.trim()) toc.push("- [Features](#features)");
  if (f.techStack.trim()) toc.push("- [Tech Stack](#tech-stack)");
  if (f.installation.trim()) toc.push("- [Installation](#installation)");
  if (f.usage.trim()) toc.push("- [Usage](#usage)");
  parts.push(toc.join("\n") + "\n");

  if (f.features.trim()) {
    parts.push(`## Features\n`);
    parts.push(bulletize(f.features) + "\n");
  }
  if (f.techStack.trim()) {
    parts.push(`## Tech Stack\n`);
    parts.push(bulletize(f.techStack, /[\n,]/) + "\n");
  }
  if (f.installation.trim()) {
    parts.push(`## Installation\n`);
    parts.push("```bash\n" + f.installation.trim() + "\n```\n");
  }
  if (f.usage.trim()) {
    parts.push(`## Usage\n`);
    parts.push("```js\n" + f.usage.trim() + "\n```\n");
  }
  parts.push(`## License\n\nMIT\n`);
  return parts.join("\n");
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full resize-y rounded-lg border border-border bg-input px-3 py-2 text-base leading-snug text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 sm:text-sm ${
          mono ? "font-mono" : ""
        }`}
      />
    </label>
  );
}

export function ReadmeGenerator() {
  const [fields, setFields] = useState<Fields>(initial);
  const [copied, setCopied] = useState(false);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [dark, setDark] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const generate = useServerFn(generateReadme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const markdown = useMemo(() => buildMarkdown(fields), [fields]);

  const update = (k: keyof Fields) => (v: string) =>
    setFields((f) => ({ ...f, [k]: v }));

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "README.md";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    const title = fields.name.trim();
    if (!title) {
      setAiError("Enter a project name first.");
      return;
    }
    setAiError(null);
    setIsGenerating(true);
    try {
      const { result, error } = await generate({ data: { title } });
      if (error || !result) {
        setAiError(error ?? "Generation failed.");
        return;
      }
      setFields((f) => ({
        ...f,
        description: result.description,
        features: result.features.join("\n"),
        installation: result.installation,
        usage: result.usage,
        techStack: result.techStack.join("\n"),
      }));
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent-emerald text-primary-foreground sm:h-9 sm:w-9">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold leading-tight sm:text-base">README Generator</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">Craft a polished README in seconds</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setDark((d) => !d)}
              aria-label="Toggle theme"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition hover:bg-surface-2"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={handleCopy}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium text-foreground transition hover:bg-surface-2 sm:px-3"
            >
              {copied ? <Check className="h-4 w-4 text-accent-emerald" /> : <Copy className="h-4 w-4" />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 sm:px-3"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="flex border-t border-border lg:hidden">
          <button
            onClick={() => setMobileTab("edit")}
            className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-medium transition active:bg-surface-2 ${
              mobileTab === "edit" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button
            onClick={() => setMobileTab("preview")}
            className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-medium transition active:bg-surface-2 ${
              mobileTab === "preview" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            <Eye className="h-4 w-4" /> Preview
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          {/* Editor */}
          <section
            className={`${mobileTab === "edit" ? "block" : "hidden"} lg:block`}
          >
            <div className="rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-5">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:mb-4 sm:text-sm">
                Project Details
              </h2>
              <div className="space-y-3.5 sm:space-y-4">
                <div>
                  <Field
                    label="Project Name"
                    value={fields.name}
                    onChange={update("name")}
                    rows={1}
                    placeholder="my-awesome-project"
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !fields.name.trim()}
                    className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent-emerald px-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating with AI…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate with AI
                      </>
                    )}
                  </button>
                  {aiError && (
                    <p className="mt-2 text-xs text-destructive">{aiError}</p>
                  )}
                </div>
                <Field
                  label="Description"
                  value={fields.description}
                  onChange={update("description")}
                  rows={3}
                  placeholder="What does this project do?"
                />
                <Field
                  label="Features (one per line)"
                  value={fields.features}
                  onChange={update("features")}
                  rows={4}
                  placeholder="Fast\nTyped\nDX-friendly"
                />
                <Field
                  label="Tech Stack (comma or newline separated)"
                  value={fields.techStack}
                  onChange={update("techStack")}
                  rows={3}
                  placeholder="React, TypeScript, Tailwind CSS"
                />
                <Field
                  label="Installation"
                  value={fields.installation}
                  onChange={update("installation")}
                  rows={3}
                  mono
                  placeholder="npm install"
                />
                <Field
                  label="Usage"
                  value={fields.usage}
                  onChange={update("usage")}
                  rows={5}
                  mono
                  placeholder="Show how to use it"
                />
              </div>
            </div>
          </section>

          {/* Preview */}
          <section
            className={`${mobileTab === "preview" ? "block" : "hidden"} lg:block`}
          >
            <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
              <div className="flex items-center justify-between border-b border-border bg-surface-2 px-3 py-2 sm:px-4 sm:py-2.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="font-mono text-xs">README.md</span>
                </div>
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-chart-4/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-accent-emerald/60" />
                </div>
              </div>
              <div className="markdown-body max-h-[calc(100vh-14rem)] overflow-auto px-4 py-4 sm:px-6 sm:py-6 lg:max-h-[calc(100vh-12rem)]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
