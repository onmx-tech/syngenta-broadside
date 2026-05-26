/**
 * Extrai uma mensagem humana de qualquer erro: Error, string, PostgrestError
 * do Supabase ({ message, details, hint }), Response, etc.
 * Garante que toasts nunca mostrem "[object Object]".
 */
export function errorMessage(e: unknown): string {
  if (e == null) return "Erro desconhecido";
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message || e.name || "Erro";
  if (typeof e === "object") {
    const obj = e as Record<string, unknown>;
    const msg = obj.message ?? obj.error ?? obj.error_description;
    if (typeof msg === "string" && msg.length > 0) return msg;
    if (typeof obj.details === "string" && obj.details.length > 0) return obj.details;
    if (typeof obj.hint === "string" && obj.hint.length > 0) return obj.hint;
    try {
      const s = JSON.stringify(e);
      if (s !== "{}" && s !== "null") return s;
    } catch {
      /* circular */
    }
  }
  return String(e);
}
