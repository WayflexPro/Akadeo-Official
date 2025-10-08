import { fetchWithDiagnostics } from "../../lib/fetchWithDiagnostics";

type Meta = {
  requestId: string;
  ts: string;
};

type ApiErrorType = "VALIDATION" | "AUTH" | "CONFLICT" | "NOT_FOUND" | "RATE_LIMIT" | "INTERNAL";

type ApiErrorShape = {
  type: ApiErrorType;
  message: string;
  code: string | null;
  details: Record<string, unknown> | unknown[] | null;
};

export type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta: Meta;
};

export type ApiFailure = {
  ok: false;
  error: ApiErrorShape;
  meta: Meta;
};

type RegisterPayload = {
  fullName: string;
  institution: string;
  email: string;
  password: string;
};

type RegisterResponse = {
  message: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

type LoginResponse = {
  message: string;
  requiresSetup: boolean;
};

type VerifyPayload = {
  email: string;
  code: string;
};

type VerifyResponse = {
  message: string;
  requiresSetup: boolean;
};

type ResendPayload = {
  email: string;
};

type ResendResponse = {
  message: string;
};

async function request<T>(
  url: string,
  options: RequestInit & { timeoutMs?: number; bodyJson?: any }
): Promise<ApiSuccess<T>> {
  return (await fetchWithDiagnostics(url, options)) as ApiSuccess<T>;
}

export async function register(payload: RegisterPayload) {
  return request<RegisterResponse>("/api/register.php", {
    method: "POST",
    bodyJson: payload,
    timeoutMs: 15000,
  });
}

export async function login(payload: LoginPayload) {
  return request<LoginResponse>("/api/login.php", {
    method: "POST",
    bodyJson: payload,
    timeoutMs: 15000,
  });
}

export async function verify(payload: VerifyPayload) {
  return request<VerifyResponse>("/api/verify.php", {
    method: "POST",
    bodyJson: payload,
    timeoutMs: 15000,
  });
}

export async function resendVerification(payload: ResendPayload) {
  return request<ResendResponse>("/api/resend-verification.php", {
    method: "POST",
    bodyJson: payload,
    timeoutMs: 15000,
  });
}
