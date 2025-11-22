const THREAD_SESSION_KEY = "glow-active-thread-id";
export const THREADS_UPDATED_EVENT = "glow:threads-updated";

export type ThreadUpdateDetail = {
  id?: string;
  name?: string;
  action?: "create" | "update" | "delete";
};

export const getStoredThreadId = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(THREAD_SESSION_KEY);
};

export const setStoredThreadId = (id: string | null) => {
  if (typeof window === "undefined") return;
  if (!id) {
    window.sessionStorage.removeItem(THREAD_SESSION_KEY);
  } else {
    window.sessionStorage.setItem(THREAD_SESSION_KEY, id);
  }
};

export const dispatchThreadsUpdated = (detail?: ThreadUpdateDetail) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(THREADS_UPDATED_EVENT, {
      detail,
    })
  );
};
