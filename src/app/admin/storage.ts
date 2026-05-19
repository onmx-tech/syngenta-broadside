import { useCallback, useEffect, useState } from "react";
import { ADMIN_INITIAL_STATE, type AdminState } from "./types";

const STATE_KEY = "seedcare_admin_state_v1";

export function loadAdminState(): AdminState {
  if (typeof window === "undefined") return ADMIN_INITIAL_STATE;
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return ADMIN_INITIAL_STATE;
    const parsed = JSON.parse(raw);
    return { ...ADMIN_INITIAL_STATE, ...parsed };
  } catch {
    return ADMIN_INITIAL_STATE;
  }
}

export function saveAdminState(state: AdminState) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Erro salvando admin state (quota?)", e);
  }
}

export function useAdminState() {
  const [state, setState] = useState<AdminState>(loadAdminState);

  useEffect(() => {
    saveAdminState(state);
  }, [state]);

  const reset = useCallback(() => {
    setState(ADMIN_INITIAL_STATE);
  }, []);

  return { state, setState, reset };
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
