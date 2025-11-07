import { Router } from 'express'
import {
  pageExists,
  listShapes,
  addShape,
  updateShape,
  removeShape
} from '../db/memoryStore.js'

const router = Router()

// Validate page middleware
router.use('/:pageId', (req, res, next) => {
  const { pageId } = req.params
  if (!pageExists(pageId)) return res.status(404).json({ message: 'Page not found' })
  next()
})

// GET /api/pages/:pageId/shapes
router.get('/:pageId/shapes', (req, res) => {
  res.json(listShapes(req.params.pageId))
})

// POST /api/pages/:pageId/shapes
// Accepts any valid shape JSON (client generates IDs)
router.post('/:pageId/shapes', (req, res) => {
  const shape = req.body || {}
  if (!shape || typeof shape.id !== 'string') {
    return res.status(400).json({ message: 'Shape must include an id' })
  }
  shape.pageId = req.params.pageId
  const saved = addShape(req.params.pageId, shape)
  res.json(saved)
})

// PUT /api/pages/:pageId/shapes/:shapeId
router.put('/:pageId/shapes/:shapeId', (req, res) => {
  const updated = updateShape(req.params.pageId, req.params.shapeId, req.body || {})
  if (!updated) return res.status(404).json({ message: 'Shape not found' })
  res.json(updated)
})

// DELETE /api/pages/:pageId/shapes/:shapeId
router.delete('/:pageId/shapes/:shapeId', (req, res) => {
  removeShape(req.params.pageId, req.params.shapeId)
  res.status(204).end()
})

export default router
