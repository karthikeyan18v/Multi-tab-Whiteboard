import { Router } from 'express'
import { listPages, createPage, deletePage } from '../db/memoryStore.js'

const router = Router()

// GET /api/pages
router.get('/', (req, res) => {
  res.json(listPages())
})

// POST /api/pages  { name }
router.post('/', (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  const created = createPage(name || undefined)
  res.json(created)
})

// DELETE /api/pages/:id
router.delete('/:id', (req, res) => {
  deletePage(req.params.id)
  res.status(204).end()
})

export default router
