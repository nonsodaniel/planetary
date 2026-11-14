/**
 * NVIDIA API base client
 * Handles auth, retries, and error normalization for:
 *  - NIM (OpenAI-compatible inference)
 *  - NVCF (Cloud Functions: Cosmos, cuOpt)
 */

export class NvidiaAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string
  ) {
    super(message);
    this.name = "NvidiaAPIError";
  }
}

function getApiKey(): string {
  const key = process.env.NVIDIA_API_KEY;
  if (!key || key === "nvapi-") {
    throw new NvidiaAPIError("NVIDIA_API_KEY not configured", 401, "auth");
  }
  return key;
}

/** NIM endpoint (OpenAI-compatible) */
export const NIM_BASE =
  process.env.NVIDIA_NIM_BASE_URL ?? "https://integrate.api.nvidia.com/v1";

/** NVCF endpoint (Cloud Functions) */
export const NVCF_BASE =
  process.env.NVIDIA_NVCF_BASE_URL ??
  "https://api.nvcf.nvidia.com/v2/nvcf/pexec/functions";

/** Chat completion via NIM */
export async function nimChat(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    response_format?: { type: "json_object" } | { type: "text" };
  } = {}
): Promise<string> {
  const apiKey = getApiKey();
  const model = opts.model ?? "meta/llama-3.3-70b-instruct";

  const res = await fetch(`${NIM_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.max_tokens ?? 4096,
      ...(opts.response_format ? { response_format: opts.response_format } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new NvidiaAPIError(
      `NIM chat failed: ${res.status} ${res.statusText} — ${body}`,
      res.status,
      `${NIM_BASE}/chat/completions`
    );
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/** Invoke a NVCF function (Cosmos, cuOpt) */
export async function nvcfInvoke(
  functionId: string,
  payload: Record<string, unknown>,
  timeoutMs = 60_000
): Promise<unknown> {
  const apiKey = getApiKey();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${NVCF_BASE}/${functionId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new NvidiaAPIError(
        `NVCF invoke failed: ${res.status} ${res.statusText} — ${body}`,
        res.status,
        `${NVCF_BASE}/${functionId}`
      );
    }

    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Check if NVIDIA API key is configured */
export function isNvidiaConfigured(): boolean {
  const key = process.env.NVIDIA_API_KEY;
  return !!key && key !== "nvapi-" && key.startsWith("nvapi-");
}
