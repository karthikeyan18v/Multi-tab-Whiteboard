# Multi-Tabs-Whiteboard

A multi-page whiteboard built with **React + Canvas** and a **Node/Express** backend.
Draw with pencil, line, circle, rectangle, arrow, and text. Each page (tab) has its own canvas & shapes.

---

## ✨ Features

- Chrome-style **tabs**: add, rename, close, switch (Ctrl/Cmd + T to add)
- Tools: **Select, Pencil, Line, Circle, Rectangle, Arrow, Text**
- **Drag to move** shapes; shapes stored as JSON in React state
- Text properties: **font, size, color**
- **Local session persistence** via `localStorage`
- Backend with **in-memory** storage
- Page-scoped **CRUD APIs** for shapes

---

## 🗂 Install Dependencies

```bash
# --- FRONTEND ---
mkdir -p apps/client
cd apps/client
npm create vite@latest . -- --template react-ts
npm i nanoid
# (optional, prettier)
npm i -D prettier
cd ../../

# --- BACKEND ---
mkdir -p apps/server
cd apps/server
npm init -y
npm i express cors
npm i -D nodemon
cd ../../
```
# 🚀 Running the Application
``` bash
cd apps/server
npm run dev

cd apps/client
npm run dev
```
# 🧪 API Testing
```bash
# GET /api/health
http://localhost:4000/api/health

# Pages API
# GET /api/pages
 http://localhost:4000/api/pages
# POST /api/pages
POST http://localhost:4000/api/pages
{ "name": "My Page" }
# DELETE /api/pages/:pageId
DELETE http://localhost:4000/api/pages/<pageId>

# Shapes API
# GET /api/pages/:pageId/shapes
GET http://localhost:4000/api/pages/<pageId>/shapes
# POST /api/pages/:pageId/shapes
POST http://localhost:4000/api/pages/<pageId>/shapes
{
  "id": "rect_1",
  "type": "rectangle",
  "x": 100,
  "y": 120,
  "width": 140,
  "height": 60,
  "rotation": 0,
  "color": "#3b82f6",
  "strokeWidth": 2
}
PUT http://localhost:4000/api/pages/<pageId>/shapes/<shapeId>
{
  "x": 180,
  "y": 160,
  "width": 200
}
✅ DELETE /api/pages/:pageId/shapes/:shapeId
DELETE http://localhost:4000/api/pages/<pageId>/shapes/<shapeId>
```

