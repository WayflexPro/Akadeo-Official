import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_CODE_LENGTH,
  MAX_GENERATION_TRIES,
  checkCodeExists,
  findUniqueCode,
  generateClassCode,
} from "../lib/classCode";

export type CodeStatus = "idle" | "checking" | "available" | "taken" | "error";

export interface UseClassCodeResult {
  code: string;
  status: CodeStatus;
  message: string;
  regenerate: () => Promise<void>;
  recheckBeforeSubmit: () => Promise<boolean>;
  canSubmit: boolean;
  isChecking: boolean;
}

export function useClassCode(initial?: string): UseClassCodeResult {
  const [code, setCode] = useState<string>(initial ?? generateClassCode(DEFAULT_CODE_LENGTH));
  const [status, setStatus] = useState<CodeStatus>("idle");
  const [message, setMessage] = useState<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const check = useCallback(async (value: string) => {
    setStatus("checking");
    setMessage("Checking…");
    try {
      const exists = await checkCodeExists(value);
      if (exists) {
        setStatus("taken");
        setMessage("Already used. Regenerate or edit.");
      } else {
        setStatus("available");
        setMessage("Available");
      }
    } catch (error) {
      console.error("Failed to verify class code", error);
      setStatus("error");
      setMessage("Cannot verify. Check your connection.");
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void check(code);
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [code, check]);

  const regenerate = useCallback(async () => {
    setStatus("checking");
    setMessage("Finding unique code…");
    const { code: newCode } = await findUniqueCode({ tries: MAX_GENERATION_TRIES, length: DEFAULT_CODE_LENGTH });
    setCode(newCode);
  }, []);

  const recheckBeforeSubmit = useCallback(async (): Promise<boolean> => {
    setStatus("checking");
    setMessage("Verifying before submit…");
    const exists = await checkCodeExists(code);
    if (!exists) {
      setStatus("available");
      setMessage("Available");
      return true;
    }

    const { code: uniqueCode, unique } = await findUniqueCode({ tries: MAX_GENERATION_TRIES, length: DEFAULT_CODE_LENGTH });
    setCode(uniqueCode);
    setStatus(unique ? "available" : "taken");
    setMessage(unique ? "Available" : "Already used.");
    return unique;
  }, [code]);

  const canSubmit = useMemo(() => status === "available", [status]);
  const isChecking = status === "checking";

  return { code, status, message, regenerate, recheckBeforeSubmit, canSubmit, isChecking };
}
