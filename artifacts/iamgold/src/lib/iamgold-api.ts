export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(path, { ...init, headers, credentials: 'include' });
  if (!response.ok) {
    let message = `La requête a échoué (${response.status}).`;
    try {
      const body = await response.json() as { error?: string; message?: string };
      message = body.error || body.message || message;
    } catch { /* use the HTTP status message */ }
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function jsonBody(value: unknown): string {
  return JSON.stringify(value);
}

export async function uploadImage(file: File, requestPath: string, signal?: AbortSignal): Promise<string> {
  const ticket = await apiRequest<{ uploadURL: string; objectPath: string }>(requestPath, {
    method: 'POST',
    body: jsonBody({ name: file.name, size: file.size, contentType: file.type }),
    signal,
  });
  const response = await fetch(ticket.uploadURL, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
    credentials: 'omit',
    signal,
  });
  if (!response.ok) throw new Error('Le transfert de l’image a échoué. Réessayez.');
  return ticket.objectPath;
}
