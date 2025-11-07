// Simple in-memory store. You can swap this for a DB later.

const pages = []
const shapesByPage = {} // { [pageId]: Shape[] }

function makeId() {
  // tiny ID generator (base36)
  return Math.random().toString(36).slice(2, 10)
}

// Seed a default page so client has something to load
if (pages.length === 0) {
  const p = { id: makeId(), name: 'Project 1' }
  pages.push(p)
  shapesByPage[p.id] = []
}

export function listPages() {
  return pages
}

export function createPage(name) {
  const p = { id: makeId(), name: name || `Project ${pages.length + 1}` }
  pages.push(p)
  shapesByPage[p.id] = []
  return p
}

export function deletePage(id) {
  const i = pages.findIndex(p => p.id === id)
  if (i >= 0) pages.splice(i, 1)
  delete shapesByPage[id]
}

// --- Shapes
export function listShapes(pageId) {
  return shapesByPage[pageId] || []
}

export function addShape(pageId, shape) {
  if (!shapesByPage[pageId]) shapesByPage[pageId] = []
  shapesByPage[pageId].push(shape)
  return shape
}

export function updateShape(pageId, shapeId, patch) {
  const list = shapesByPage[pageId] || []
  const i = list.findIndex(s => s.id === shapeId)
  if (i < 0) return null
  list[i] = { ...list[i], ...patch }
  return list[i]
}

export function removeShape(pageId, shapeId) {
  const list = shapesByPage[pageId] || []
  const i = list.findIndex(s => s.id === shapeId)
  if (i >= 0) list.splice(i, 1)
}

export function pageExists(pageId) {
  return !!pages.find(p => p.id === pageId)
}
