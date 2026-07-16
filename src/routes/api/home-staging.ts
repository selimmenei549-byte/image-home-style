import { createFileRoute } from "@tanstack/react-router";

const PROMPT =
  "Home-staging task on THIS EXACT photograph. Do NOT generate a new room. Do NOT invent a different house. Preserve the input pixel-for-pixel where possible: keep the same walls, wall colors, windows, window frames, doors, ceiling, floor material, room proportions, camera angle, perspective, and lighting direction 100% identical. Only ADD tasteful modern furniture, rugs, decor, plants and warm accent lighting to make the space look staged for a real-estate listing. Do NOT move, remove, resize or repaint any architectural element. Output must clearly be the SAME room as the input, just furnished. Photorealistic real-estate listing photo, no text, no watermark.";

async function isInteriorPhoto(imageUrl: string, apiKey: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: 'Is this photo the INTERIOR of a real house/apartment room (living room, bedroom, kitchen, bathroom, office, hallway, etc.) suitable for real-estate home staging? Reply with ONLY strict JSON: {"interior": true|false, "reason": "short reason"}. Return false for outdoor scenes, people, animals, cars, food, objects, cartoons, or building exteriors.',
              },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) return { ok: true }; // fail-open on validator error
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return { ok: true };
    const parsed = JSON.parse(match[0]) as { interior?: boolean; reason?: string };
    return { ok: parsed.interior === true, reason: parsed.reason };
  } catch {
    return { ok: true };
  }
}

async function stageWithLovable(imageUrl: string, prompt: string) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "LOVABLE_API_KEY not configured" },
      { status: 500 },
    );
  }
  const check = await isInteriorPhoto(imageUrl, apiKey);
  if (!check.ok) {
    return Response.json(
      {
        error:
          "This image doesn't look like the interior of a room. Please upload a photo of an indoor space (living room, bedroom, kitchen, etc.) to stage." +
          (check.reason ? ` (${check.reason})` : ""),
      },
      { status: 400 },
    );
  }
  const upstream = await fetch(
    "https://ai.gateway.lovable.dev/v1/images/generations",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    },
  );
  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => "");
    console.error("AI Gateway error", upstream.status, errText);
    if (upstream.status === 429)
      return Response.json({ error: "Rate limit reached. Try again shortly." }, { status: 429 });
    if (upstream.status === 402)
      return Response.json({ error: "AI credits exhausted." }, { status: 402 });
    return Response.json({ error: "AI staging failed" }, { status: 502 });
  }
  const data = (await upstream.json()) as { data?: { b64_json?: string }[] };
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) return Response.json({ error: "No image returned from AI" }, { status: 502 });
  return Response.json({ staged_url: `data:image/png;base64,${b64}` });
}

async function stageWithN8n(webhookUrl: string, imageUrl: string, prompt: string) {
  try {
    new URL(webhookUrl);
  } catch {
    return Response.json({ error: "Invalid n8n webhook URL" }, { status: 400 });
  }
  let upstream: Response;
  try {
    upstream = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_base64: imageUrl, prompt }),
    });
  } catch (e) {
    console.error("n8n fetch failed", e);
    return Response.json({ error: "Could not reach n8n webhook" }, { status: 502 });
  }
  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => "");
    console.error("n8n webhook error", upstream.status, errText);
    return Response.json(
      { error: `n8n webhook failed (${upstream.status})` },
      { status: 502 },
    );
  }
  const contentType = upstream.headers.get("content-type") ?? "";
  // n8n "Respond With Binary" returns the image bytes directly.
  if (contentType.startsWith("image/")) {
    const buf = new Uint8Array(await upstream.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    const b64 = btoa(bin);
    return Response.json({ staged_url: `data:${contentType};base64,${b64}` });
  }
  // Fallback: some workflows return JSON with a URL or base64 field.
  const rawText = await upstream.text().catch(() => "");
  if (contentType.includes("application/json") && rawText.trim()) {
    let j: {
      staged_url?: string;
      image_url?: string;
      url?: string;
      b64_json?: string;
      image_base64?: string;
    };
    try {
      j = JSON.parse(rawText);
    } catch {
      console.error("n8n returned invalid JSON", rawText.slice(0, 200));
      return Response.json({ error: "n8n returned invalid JSON" }, { status: 502 });
    }
    const url =
      j.staged_url ??
      j.image_url ??
      j.url ??
      (j.b64_json && `data:image/png;base64,${j.b64_json}`) ??
      (j.image_base64 && `data:image/png;base64,${j.image_base64}`);
    if (url) return Response.json({ staged_url: url });

  }
  return Response.json({ error: "Unexpected response from n8n" }, { status: 502 });
}

export const Route = createFileRoute("/api/home-staging")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as {
          image_url?: string;
          prompt?: string;
          mode?: "lovable" | "n8n";
          webhook_url?: string;
        };
        if (!body.image_url) {
          return Response.json({ error: "image_url required" }, { status: 400 });
        }
        const prompt = body.prompt?.trim() || PROMPT;
        if (body.mode === "n8n") {
          if (!body.webhook_url) {
            return Response.json(
              { error: "webhook_url required for n8n mode" },
              { status: 400 },
            );
          }
          return stageWithN8n(body.webhook_url, body.image_url, prompt);
        }
        return stageWithLovable(body.image_url, prompt);
      },
    },
  },
});
