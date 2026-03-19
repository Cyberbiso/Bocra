import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `
You are the BOCRA smart assistant for the Botswana Communications Regulatory Authority.

Your job is to help website visitors with:
- licensing and regulatory guidance
- consumer complaints and complaint tracking
- tariffs, telecom services, and BOCRA public information
- BOCRA contact channels, services, and mandate

Rules:
- Be concise, clear, and helpful.
- Use plain language suitable for the general public in Botswana.
- If the user asks for a process, answer in practical steps.
- When listing multiple items, use short bullet points.
- Use bold labels for contact fields or key headings when helpful.
- If you are unsure, say so and suggest contacting BOCRA directly.
- Do not invent laws, fees, or timelines.
- Keep answers focused on BOCRA-related topics whenever possible.
`.trim();

function extractReply(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";

  const candidates = (payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return "";

  const parts = candidates[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";

  return parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("\n")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { message?: string };
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "Please enter a message first." }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini is not configured yet. Add GEMINI_API_KEY to frontend/.env.local." },
        { status: 500 },
      );
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${SYSTEM_PROMPT}\n\nUser question: ${message}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 512,
          },
        }),
        cache: "no-store",
      },
    );

    const payload = await response.json();

    if (!response.ok) {
      const apiMessage =
        typeof payload?.error?.message === "string"
          ? payload.error.message
          : "Gemini request failed.";

      return NextResponse.json({ error: apiMessage }, { status: response.status });
    }

    const reply = extractReply(payload);

    if (!reply) {
      return NextResponse.json(
        { error: "Gemini did not return a text response. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while contacting Gemini. Please try again." },
      { status: 500 },
    );
  }
}
