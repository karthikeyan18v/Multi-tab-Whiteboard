import express from 'express'
import cors from 'cors'
import pagesRoute from './routes/pages.js'
import shapesRoute from './routes/shapes.js'

const app = express()

// CORS - allow your Netlify frontend
const allowedOrigins = [
  'http://localhost:5173',           // local dev
  'http://localhost:4173',           // local preview
  process.env.FRONTEND_URL || '',    // production frontend
]

app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin) || origin.includes('netlify.app')) {
      return callback(null, true)
    }
    callback(new Error('CORS not allowed'))
  },
  credentials: true
}))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => res.json({ ok: true }))

// Routes
app.use('/api/pages', pagesRoute)        // /api/pages, /api/pages/:id
app.use('/api/pages', shapesRoute)       // /api/pages/:id/shapes/*

/** Error handler (last) */
app.use((err, req, res, _next) => {
  console.error('Server error:', err)
  res.status(err.status || 500).json({ message: err.message || 'Server error' })
})

export default app
