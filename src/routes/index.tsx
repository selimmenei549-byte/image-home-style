import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ImmoAI — AI Home Staging" },
      {
        name: "description",
        content:
          "Upload a property photo and instantly generate a professionally staged version with ImmoAI.",
      },
      { property: "og:title", content: "ImmoAI — AI Home Staging" },
      {
        property: "og:description",
        content:
          "Upload a property photo and instantly generate a professionally staged version with ImmoAI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [stagedUrl, setStagedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [mode, setMode] = useState<"lovable" | "n8n">("lovable");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [n8nImageUrl, setN8nImageUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    setError(null);
    setStagedUrl(null);
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const generate = async () => {
    if (mode === "n8n") {
      if (!webhookUrl.trim()) {
        setError("Please paste your n8n webhook URL.");
        return;
      }
      if (!n8nImageUrl.trim()) {
        setError("Please paste a public image URL (n8n cannot fetch local files).");
        return;
      }
      try {
        new URL(n8nImageUrl.trim());
      } catch {
        setError("Invalid image URL.");
        return;
      }
    } else if (!imageUrl) {
      return;
    }
    setLoading(true);
    setError(null);
    setStagedUrl(null);
    try {
      const sourceUrl = mode === "n8n" ? n8nImageUrl.trim() : imageUrl!;
      const res = await fetch("/api/home-staging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: sourceUrl,
          mode,
          ...(mode === "n8n" ? { webhook_url: webhookUrl.trim() } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        staged_url?: string;
        error?: string;
      };
      if (!res.ok || !data.staged_url) {
        throw new Error(data.error || "Request failed");
      }
      if (mode === "n8n") setImageUrl(sourceUrl);
      setStagedUrl(data.staged_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const download = async () => {
    if (!stagedUrl) return;
    const a = document.createElement("a");
    a.href = stagedUrl;
    a.download = "immoai-staged.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <main className="min-h-screen bg-app text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent-500 text-white font-bold">
              iA
            </div>
            <span className="font-semibold tracking-tight">ImmoAI</span>
          </div>
          <span className="hidden text-sm text-slate-500 sm:block">
            Real Estate · AI Staging
          </span>
        </header>

        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            AI Home Staging
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            Upload a property photo and instantly generate a professionally
            staged version.
          </p>
        </section>

        <section className="mt-10">
          <div className="card p-6 sm:p-8">
            <div className="mb-6">
              <p className="mb-2 text-sm font-medium text-slate-700">
                Staging engine
              </p>
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setMode("lovable")}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    mode === "lovable"
                      ? "bg-accent-500 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Lovable AI
                </button>
                <button
                  type="button"
                  onClick={() => setMode("n8n")}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    mode === "n8n"
                      ? "bg-accent-500 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  n8n webhook
                </button>
              </div>
              {mode === "n8n" && (
                <div className="mt-3">
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://your-n8n.example.com/webhook/home-staging"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
                  />
                  <p className="mt-1.5 text-xs text-slate-500">
                    Your workflow receives {"{ image_url, prompt }"} and must respond with the staged image.
                  </p>
                  <input
                    type="url"
                    value={n8nImageUrl}
                    onChange={(e) => setN8nImageUrl(e.target.value)}
                    placeholder="https://example.com/your-room-photo.jpg"
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
                  />
                  <p className="mt-1.5 text-xs text-slate-500">
                    Public image URL — n8n's HTTP Request node can't fetch local files, so paste a hosted image link.
                  </p>
                </div>
              )}
            </div>

            {mode === "lovable" && (
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />)}

            {mode === "lovable" && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition ${
                dragging
                  ? "border-accent-500 bg-accent-50"
                  : "border-slate-200 bg-slate-50 hover:border-accent-500 hover:bg-accent-50/50"
              }`}
            >
              <div className="grid h-14 w-14 place-items-center rounded-full bg-accent-500/10 text-accent-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="mt-4 text-base font-medium">
                Drag & drop your property photo
              </p>
              <p className="mt-1 text-sm text-slate-500">
                or click to browse — JPG, PNG, WEBP
              </p>
            </button>)}

            {error && (
              <p className="mt-4 text-center text-sm text-red-600">{error}</p>
            )}

            {(mode === "lovable" ? imageUrl : n8nImageUrl) && !stagedUrl && (
              <div className="mt-6">
                <p className="mb-3 text-sm font-medium text-slate-500">
                  Preview
                </p>
                <div className="overflow-hidden rounded-2xl border border-slate-100">
                  <img
                    src={(mode === "lovable" ? imageUrl : n8nImageUrl) as string}
                    alt="Uploaded preview"
                    className="max-h-[420px] w-full object-cover"
                  />
                </div>
              </div>
            )}

            {(mode === "lovable" ? imageUrl : n8nImageUrl.trim()) && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={generate}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-accent-500/20 transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Spinner />
                      Generating AI staging...
                    </>
                  ) : (
                    <>Generate Home Staging</>
                  )}
                </button>
              </div>
            )}
          </div>
        </section>

        {stagedUrl && imageUrl && (
          <section className="mt-10">
            <BeforeAfterSlider before={imageUrl} after={stagedUrl} />
            <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <ul className="space-y-2 text-sm text-slate-700">
                <Check>More attractive</Check>
                <Check>Better first impression</Check>
                <Check>Ready for listing</Check>
              </ul>
              <button
                type="button"
                onClick={download}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-accent-500 bg-white px-6 py-3 text-sm font-semibold text-accent-600 transition hover:bg-accent-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download
              </button>
            </div>
          </section>
        )}

        <footer className="mt-16 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} ImmoAI · AI-powered real estate staging
        </footer>
      </div>
    </main>
  );
}

function ImageCard({
  label,
  src,
  tone,
}: {
  label: string;
  src: string;
  tone: "slate" | "accent";
}) {
  return (
    <div className="card overflow-hidden">
      <div className="relative">
        <img src={src} alt={label} className="h-72 w-full object-cover sm:h-80" />
        <span
          className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold tracking-wider text-white ${
            tone === "accent" ? "bg-accent-500" : "bg-slate-800/80"
          }`}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-accent-500/15 text-accent-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3 w-3"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      {children}
    </li>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingRef.current) return;
      const x = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      updateFromClientX(x);
    };
    const onUp = () => { draggingRef.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [updateFromClientX]);

  return (
    <div
      ref={containerRef}
      className="card relative w-full select-none overflow-hidden"
      style={{ aspectRatio: "16 / 10" }}
      onMouseDown={(e) => { draggingRef.current = true; updateFromClientX(e.clientX); }}
      onTouchStart={(e) => { draggingRef.current = true; updateFromClientX(e.touches[0].clientX); }}
    >
      <img src={after} alt="After staging" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div
        className="absolute inset-0 h-full overflow-hidden"
        style={{ width: `${pos}%` }}
      >
        <img
          src={before}
          alt="Before staging"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ width: `${100 / (pos / 100)}%`, maxWidth: "none" }}
          draggable={false}
        />
      </div>
      <span className="absolute left-4 top-4 rounded-full bg-slate-800/80 px-3 py-1 text-xs font-bold tracking-wider text-white">BEFORE</span>
      <span className="absolute right-4 top-4 rounded-full bg-accent-500 px-3 py-1 text-xs font-bold tracking-wider text-white">AFTER</span>
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.15)]"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white shadow-lg ring-1 ring-slate-200">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-slate-700">
            <polyline points="15 18 9 12 15 6" />
            <polyline points="9 18 15 12 9 6" transform="translate(0)" />
          </svg>
        </div>
      </div>
    </div>
  );
}
