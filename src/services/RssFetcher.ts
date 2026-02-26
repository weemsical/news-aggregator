export interface FetchResult {
  ok: boolean;
  xml?: string;
  error?: string;
}

export async function fetchFeed(url: string): Promise<FetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }

    const xml = await response.text();
    return { ok: true, xml };
  } catch (err: any) {
    return { ok: false, error: err.message || String(err) };
  } finally {
    clearTimeout(timeout);
  }
}
