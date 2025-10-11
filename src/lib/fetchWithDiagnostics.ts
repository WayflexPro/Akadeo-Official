export type DiagnosticEvent = {
  phase: "REQUEST" | "RESPONSE" | "ERROR";
  url: string;
  method: string;
  status?: number;
  ok?: boolean;
  classification?: "FRONTEND" | "SERVER";
  reason?: string;
  requestBody?: any;
  responseBodySnippet?: string | null;
  error?: string | null;
  ts: string;
};

function emit(diag: DiagnosticEvent) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent("diagnostic", { detail: diag }));

  if (import.meta.env.MODE !== "production") {
    // eslint-disable-next-line no-console
    console.groupCollapsed(`[Diag] ${diag.phase} ${diag.method} ${diag.url}`);
    // eslint-disable-next-line no-console
    console.log(diag);
    // eslint-disable-next-line no-console
    console.groupEnd();
  }
}

export async function fetchWithDiagnostics(
  url: string,
  opts: RequestInit & { timeoutMs?: number; bodyJson?: any } = {}
) {
  const { timeoutMs = 15000, bodyJson, credentials, ...rest } = opts;
  const method = (rest.method || "GET").toUpperCase();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const init: RequestInit = {
    ...rest,
    credentials: credentials ?? "include",
    signal: controller.signal,
    headers: {
      Accept: "application/json",
      ...(bodyJson ? { "Content-Type": "application/json" } : {}),
      ...(rest.headers || {}),
    },
    body: bodyJson ? JSON.stringify(bodyJson) : rest.body,
  };

  emit({
    phase: "REQUEST",
    url,
    method,
    requestBody: bodyJson ?? null,
    ts: new Date().toISOString(),
  });

  try {
    const res = await fetch(url, init);
    clearTimeout(timer);
    const clone = res.clone();

    let payload: any = null;
    let textFallback: string | null = null;
    let parsed = false;
    try {
      payload = await res.json();
      parsed = true;
    } catch (error) {
      try {
        textFallback = await clone.text();
      } catch {
        textFallback = null;
      }
    }

    const snippetSource = textFallback ?? (payload !== null ? JSON.stringify(payload) : null);

    if (!res.ok) {
      if (res.status === 401 && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("akadeo:session-expired", {
            detail: { url, status: res.status },
          })
        );
      }
      const reason =
        payload?.error?.message || payload?.message || textFallback || `HTTP ${res.status}`;
      emit({
        phase: "RESPONSE",
        url,
        method,
        status: res.status,
        ok: false,
        classification: "SERVER",
        reason,
        responseBodySnippet: snippetSource ? snippetSource.slice(0, 500) : null,
        ts: new Date().toISOString(),
      });
      const err = new Error(reason);
      (err as any).server = true;
      (err as any).status = res.status;
      (err as any).payload = payload ?? textFallback;
      (err as any).classification = "SERVER";
      throw err;
    }

    if (!parsed) {
      const reason = "Invalid server response";
      emit({
        phase: "RESPONSE",
        url,
        method,
        status: res.status,
        ok: false,
        classification: "FRONTEND",
        reason,
        responseBodySnippet: snippetSource ? snippetSource.slice(0, 500) : null,
        ts: new Date().toISOString(),
      });
      const err = new Error(reason);
      (err as any).classification = "FRONTEND";
      throw err;
    }

    const okFlag = payload?.ok !== false;
    emit({
      phase: "RESPONSE",
      url,
      method,
      status: res.status,
      ok: okFlag,
      classification: okFlag ? undefined : "SERVER",
      reason: okFlag ? undefined : payload?.error?.message || "Server reported failure",
      responseBodySnippet: snippetSource ? snippetSource.slice(0, 500) : null,
      ts: new Date().toISOString(),
    });

    if (!okFlag) {
      const reason = payload?.error?.message || "Server reported failure";
      const err = new Error(reason);
      (err as any).server = true;
      (err as any).status = res.status;
      (err as any).payload = payload;
      (err as any).classification = "SERVER";
      throw err;
    }

    return payload ?? {};
  } catch (e: any) {
    clearTimeout(timer);
    const isAbort = e?.name === "AbortError";
    const classification = e?.server ? "SERVER" : "FRONTEND";
    emit({
      phase: "ERROR",
      url,
      method,
      ok: false,
      classification: classification,
      reason: isAbort ? "Network timeout" : e?.message || "Request failed",
      error: e?.stack || String(e),
      ts: new Date().toISOString(),
    });
    if (typeof e === "object" && e !== null) {
      (e as any).classification = classification;
      if (isAbort) {
        (e as any).timeout = true;
      }
    }
    throw e;
  }
}
