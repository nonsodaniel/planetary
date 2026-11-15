/**
 * Context.dev API client
 * Provides web scraping and structured extraction for the Greenwashing Scanner.
 * Docs: https://docs.context.dev
 */

const CONTEXT_BASE = "https://api.context.dev/v1";

export class ContextDevError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ContextDevError";
  }
}

function getApiKey(): string {
  const key = process.env.CONTEXT_DEV_API_KEY;
  if (!key) throw new ContextDevError("CONTEXT_DEV_API_KEY not configured");
  return key;
}

export function isContextDevConfigured(): boolean {
  return !!process.env.CONTEXT_DEV_API_KEY;
}

/** Search the web and return top results */
export async function contextSearch(
  query: string,
  numResults = 5
): Promise<Array<{ url: string; title: string; description: string }>> {
  const key = getApiKey();
  const res = await fetch(`${CONTEXT_BASE}/web/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, numResults }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ContextDevError(`Search failed: ${res.status} ${body}`, res.status);
  }

  const data = await res.json();
  return (data.results ?? []).map((r: { url: string; title: string; description: string }) => ({
    url: r.url,
    title: r.title,
    description: r.description,
  }));
}

/** Scrape a URL and extract structured JSON using a provided schema */
export async function contextScrapeJSON<T = Record<string, unknown>>(
  url: string,
  schema: Record<string, unknown>,
  instructions?: string
): Promise<{ data: T | null; source_url: string; source_title: string | null }> {
  const key = getApiKey();

  const res = await fetch(`${CONTEXT_BASE}/web/scrape`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: { json: true, markdown: false },
      jsonParams: { schema, instructions },
      sharedParams: { mainContentOnly: false },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ContextDevError(`Scrape failed: ${res.status} ${body}`, res.status);
  }

  const payload = await res.json();
  const jsonOut = payload.json;

  return {
    data: jsonOut?.success ? (jsonOut.data as T) : null,
    source_url: payload.url ?? url,
    source_title: payload.metadata?.title ?? null,
  };
}
