import type { Shape } from './types'

// API Base URL - use environment variable or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Tiny fetch wrapper + page/shape requests (works even if server is off)
async function j<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const url = `${API_URL}${input}`
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  listPages: () => j<{ id: string; name: string }[]>('/api/pages'),
  createPage: (name: string) => j<{ id: string; name: string }>('/api/pages', { method: 'POST', body: JSON.stringify({ name }) }),
  deletePage: (id: string) => j<void>(`/api/pages/${id}`, { method: 'DELETE' }),
  listShapes: (pageId: string) => j<Shape[]>(`/api/pages/${pageId}/shapes`),
  createShape: (pageId: string, payload: Partial<Shape>) => j<Shape>(`/api/pages/${pageId}/shapes`, { method: 'POST', body: JSON.stringify(payload) }),
  updateShape: (pageId: string, shapeId: string, patch: Partial<Shape>) =>
    j<Shape>(`/api/pages/${pageId}/shapes/${shapeId}`, { method: 'PUT', body: JSON.stringify(patch) }),
  deleteShape: (pageId: string, shapeId: string) => j<void>(`/api/pages/${pageId}/shapes/${shapeId}`, { method: 'DELETE' })
}
