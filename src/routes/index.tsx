import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import heroVilla from "@/assets/hero-villa.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen — AI Home Staging for Luxury Real Estate" },
      {
        name: "description",
        content:
          "A curated AI staging engine for extraordinary residences. Upload a photo and reveal its finest self.",
      },
      { property: "og:title", content: "Lumen — AI Home Staging" },
      {
        property: "og:description",
        content:
          "A curated AI staging engine for extraordinary residences.",
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
  const [prompt, setPrompt] = useState("");
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

  const DEFAULT_WEBHOOK = "https://salimanovata.app.n8n.cloud/webhook/estimate-repairs";

  const generate = async () => {
    const effectiveWebhook = webhookUrl.trim() || DEFAULT_WEBHOOK;
    if (mode === "n8n") {
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
          ...(mode === "n8n" ? { webhook_url: effectiveWebhook } : {}),
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

  const download = () => {
    if (!stagedUrl) return;
    const a = document.createElement("a");
    a.href = stagedUrl;
    a.download = "lumen-staged.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const previewSrc = mode === "lovable" ? imageUrl : n8nImageUrl;

  return (
    <main className="min-h-screen bg-lumen text-ink-100">
      {/* NAV */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500 text-ink-950">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 2l7 10-7 10-7-10z"/></svg>
          </div>
          <span className="font-serif text-2xl tracking-wide">
            LUM<span className="text-amber-400">EN</span>
          </span>
        </div>
        <div className="hidden items-center gap-10 text-sm text-ink-200 md:flex">
          <a href="#stage" className="hover:text-white transition">Stage</a>
          <a href="#how" className="hover:text-white transition">How it works</a>
          <a href="#concierge" className="hover:text-white transition">Concierge</a>
        </div>
        <button className="hidden sm:inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-5 py-2 text-xs font-semibold tracking-widest text-amber-400 hover:bg-amber-500/20 transition">
          + STAGE A PROPERTY
        </button>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={heroVilla}
            alt="Luxury residence at dusk"
            className="h-full w-full object-cover opacity-60"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/60 via-ink-950/70 to-ink-950" />
        </div>

        <div className="mx-auto max-w-7xl px-6 pb-24 pt-16 sm:pt-24">
          <span className="pill inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold tracking-[0.2em]">
            ✦ A NEW ERA OF STAGING
          </span>
          <h1 className="mt-8 font-serif text-6xl leading-[0.95] tracking-tight sm:text-8xl">
            Where empty rooms<br />
            meet <span className="italic text-amber-400">imagination</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-ink-200">
            A curated AI staging engine for extraordinary residences — engineered for those who see property as a signature, not a shelter.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a href="#stage" className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-7 py-3.5 text-sm font-semibold text-ink-950 shadow-[0_10px_40px_-10px_rgba(240,160,40,0.6)] hover:bg-amber-400 transition">
              Stage a property
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
            <a href="#how" className="text-sm tracking-wide text-ink-200 hover:text-white transition">How it works →</a>
          </div>

          {/* Stat strip */}
          <div className="mt-20 grid max-w-3xl grid-cols-3 gap-8 border-t border-white/10 pt-8">
            <Stat n="12,400+" l="Rooms staged" />
            <Stat n="46" l="Countries" />
            <Stat n="8s" l="Avg. render" />
          </div>
        </div>
      </section>

      {/* STAGE CARD */}
      <section id="stage" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">The Atelier</p>
            <h2 className="mt-3 font-serif text-4xl sm:text-5xl">Reveal the residence.</h2>
          </div>
          <p className="hidden max-w-sm text-sm text-ink-300 sm:block">
            Drop a photograph. Our engine composes furniture, light, and atmosphere in seconds.
          </p>
        </div>

        <div className="surface p-6 sm:p-10">
          {/* Engine toggle */}
          <div className="mb-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-ink-300">Staging engine</p>
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
              {(["lovable", "n8n"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-full px-5 py-1.5 text-sm font-medium transition ${
                    mode === m ? "bg-amber-500 text-ink-950" : "text-ink-200 hover:text-white"
                  }`}
                >
                  {m === "lovable" ? "Lumen AI" : "n8n webhook"}
                </button>
              ))}
            </div>

            {mode === "n8n" && (
              <div className="mt-4 space-y-3">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://salimanovata.app.n8n.cloud/webhook/estimate-repairs (default)"
                  className="w-full rounded-xl border border-white/10 bg-ink-900/60 px-4 py-3 text-sm text-white outline-none placeholder:text-ink-300 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20"
                />
                <input
                  type="url"
                  value={n8nImageUrl}
                  onChange={(e) => setN8nImageUrl(e.target.value)}
                  placeholder="Public image URL (n8n cannot fetch local files)"
                  className="w-full rounded-xl border border-white/10 bg-ink-900/60 px-4 py-3 text-sm text-white outline-none placeholder:text-ink-300 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            )}
          </div>

          {mode === "lovable" && (
            <>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`flex w-full flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center transition ${
                  dragging
                    ? "border-amber-500 bg-amber-500/5"
                    : "border-white/15 bg-white/[0.02] hover:border-amber-500/50 hover:bg-amber-500/[0.03]"
                }`}
              >
                <div className="grid h-14 w-14 place-items-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="mt-5 font-serif text-2xl">Drop your photograph</p>
                <p className="mt-1 text-sm text-ink-300">or click to browse — JPG, PNG, WEBP</p>
              </button>
            </>
          )}

          {error && <p className="mt-4 text-center text-sm text-red-400">{error}</p>}

          {previewSrc && !stagedUrl && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
              <img src={previewSrc} alt="Uploaded" className="max-h-[460px] w-full object-cover" />
            </div>
          )}

          {(mode === "lovable" ? imageUrl : n8nImageUrl.trim()) && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={generate}
                disabled={loading}
                className="inline-flex items-center gap-3 rounded-full bg-amber-500 px-8 py-4 text-sm font-semibold text-ink-950 shadow-[0_10px_40px_-10px_rgba(240,160,40,0.6)] transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (<><Spinner />Composing the scene…</>) : (<>Generate staging<span className="text-lg">→</span></>)}
              </button>
            </div>
          )}
        </div>

        {stagedUrl && imageUrl && (
          <div className="mt-12">
            <BeforeAfterSlider before={imageUrl} after={stagedUrl} />
            <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <ul className="space-y-2 text-sm text-ink-200">
                <Check>Editorial-grade composition</Check>
                <Check>Architectural integrity preserved</Check>
                <Check>Listing-ready in seconds</Check>
              </ul>
              <button
                type="button"
                onClick={download}
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-6 py-3 text-sm font-semibold text-amber-400 hover:bg-amber-500/20 transition"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download
              </button>
            </div>
          </div>
        )}
      </section>

      <footer className="border-t border-white/10 py-10 text-center text-xs tracking-widest text-ink-300">
        © {new Date().getFullYear()} LUMEN · CURATED AI STAGING
      </footer>
    </main>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="font-serif text-3xl text-white sm:text-4xl">{n}</div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-ink-300">{l}</div>
    </div>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span className="grid h-5 w-5 place-items-center rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      {children}
    </li>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
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
      className="relative w-full select-none overflow-hidden rounded-2xl border border-white/10"
      style={{ aspectRatio: "16 / 10" }}
      onMouseDown={(e) => { draggingRef.current = true; updateFromClientX(e.clientX); }}
      onTouchStart={(e) => { draggingRef.current = true; updateFromClientX(e.touches[0].clientX); }}
    >
      <img src={after} alt="After" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="absolute inset-0 h-full overflow-hidden" style={{ width: `${pos}%` }}>
        <img
          src={before}
          alt="Before"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ width: `${100 / (pos / 100)}%`, maxWidth: "none" }}
          draggable={false}
        />
      </div>
      <span className="absolute left-4 top-4 rounded-full bg-ink-950/70 px-3 py-1 text-[10px] font-bold tracking-[0.25em] text-ink-100 backdrop-blur">BEFORE</span>
      <span className="absolute right-4 top-4 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold tracking-[0.25em] text-ink-950">AFTER</span>
      <div className="absolute top-0 bottom-0 w-px bg-amber-400/80 shadow-[0_0_20px_rgba(240,160,40,0.5)]" style={{ left: `${pos}%` }}>
        <div className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-amber-500 shadow-lg ring-2 ring-ink-950">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-ink-950">
            <polyline points="15 18 9 12 15 6" />
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
