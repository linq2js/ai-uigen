type Listener = () => void;

const activeProjects = new Map<string, ReturnType<typeof setTimeout>>();
const listeners = new Set<Listener>();

const AUTO_CLEAR_MS = 2 * 60 * 1000;

function notify() {
  listeners.forEach((l) => l());
}

export function markGenerating(projectId: string) {
  const existing = activeProjects.get(projectId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    activeProjects.delete(projectId);
    notify();
  }, AUTO_CLEAR_MS);

  activeProjects.set(projectId, timer);
  notify();
}

export function markIdle(projectId: string) {
  const timer = activeProjects.get(projectId);
  if (timer) clearTimeout(timer);
  activeProjects.delete(projectId);
  notify();
}

export function isProjectGenerating(projectId: string): boolean {
  return activeProjects.has(projectId);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
