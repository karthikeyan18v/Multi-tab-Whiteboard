import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { nanoid } from 'nanoid'
import { useStore } from '../state'
import type { Shape, TextShape, PencilShape } from '../types'

type Pt = { x: number; y: number }

export default function Whiteboard() {
  const { state, dispatch } = useStore()
  const { activePageId, shapesByPage, tool, color, fontFamily, fontSize, strokeWidth, selection } = state
  const shapes = useMemo(() => activePageId ? (shapesByPage[activePageId] ?? []) : [], [activePageId, shapesByPage])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDown, setDown] = useState(false)
  const [start, setStart] = useState<Pt | null>(null)
  const [temp, setTemp] = useState<Shape | null>(null)
  const [dragOffset, setDragOffset] = useState<Pt | null>(null)
  const [editingText, setEditingText] = useState<{id: string, x: number, y: number} | null>(null)

  const draw = useCallback(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')!
    ctx.clearRect(0,0,c.width,c.height)

    const drawArrowHead = (from: Pt, to: Pt) => {
      const ang = Math.atan2(to.y-from.y, to.x-from.x)
      const len = 10
      ctx.beginPath()
      ctx.moveTo(to.x, to.y)
      ctx.lineTo(to.x - len*Math.cos(ang - Math.PI/6), to.y - len*Math.sin(ang - Math.PI/6))
      ctx.moveTo(to.x, to.y)
      ctx.lineTo(to.x - len*Math.cos(ang + Math.PI/6), to.y - len*Math.sin(ang + Math.PI/6))
      ctx.stroke()
    }

    const drawOne = (s: Shape) => {
      ctx.strokeStyle = s.color || '#60a5fa'
      ctx.fillStyle = 'transparent'
      ctx.lineWidth = s.strokeWidth ?? 2
      if (s.type === 'circle') {
        ctx.beginPath(); ctx.arc(s.x, s.y, s.radius || 0, 0, Math.PI*2); ctx.stroke()
      } else if (s.type === 'rectangle') {
        ctx.strokeRect(s.x, s.y, s.width || 0, s.height || 0)
      } else if (s.type === 'line' || s.type === 'arrow') {
        const x2 = s.x + (s.width || 0), y2 = s.y + (s.height || 0)
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(x2, y2); ctx.stroke()
        if (s.type === 'arrow') drawArrowHead({x:s.x,y:s.y},{x:x2,y:y2})
      } else if (s.type === 'text') {
        const textShape = s as TextShape
        ctx.font = `${textShape.fontSize}px ${textShape.fontFamily}`
        ctx.fillStyle = s.color || '#0f172a'
        ctx.textBaseline = 'alphabetic'
        ctx.fillText(textShape.content, s.x, s.y)
      } else if (s.type === 'pencil') {
        const pencilShape = s as PencilShape
        const pts = pencilShape.points
        ctx.beginPath()
        for (let i=0;i<pts.length;i++){
          const p = pts[i]
          if (i) {
            ctx.lineTo(p.x,p.y)
          } else {
            ctx.moveTo(p.x,p.y)
          }
        }
        ctx.stroke()
      }
      // selection box
      if (selection === s.id) {
        ctx.save()
        ctx.setLineDash([4,4]); ctx.strokeStyle = 'rgba(59,130,246,.9)'
        const box = boundsOf(s)
        ctx.strokeRect(box.x, box.y, box.w, box.h)
        ctx.restore()
      }
    }

    shapes.forEach(drawOne)
    if (temp) drawOne(temp)
  }, [shapes, temp, selection])

  // resize for DPR
  useEffect(()=>{
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const resize = () => {
      const rect = c.getBoundingClientRect()
      const dpr = Math.max(1, window.devicePixelRatio || 1)
      c.width = Math.floor(rect.width * dpr)
      c.height = Math.floor(rect.height * dpr)
      ctx.setTransform(dpr,0,0,dpr,0,0)
      draw()
    }
    resize()
    window.addEventListener('resize', resize)
    return ()=>window.removeEventListener('resize', resize)
  }, [draw])

  function localXY(e: React.PointerEvent) {
    const r = (e.target as HTMLCanvasElement).getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  function hitTest(p: Pt): Shape | null {
    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i]
      if (s.type === 'circle') {
        const dx = p.x - s.x, dy = p.y - s.y
        if (Math.hypot(dx, dy) <= (s.radius || 0) + 6) return s
      } else if (s.type === 'rectangle') {
        const w = s.width || 0, h = s.height || 0
        if (p.x >= s.x && p.x <= s.x + w && p.y >= s.y && p.y <= s.y + h) return s
      } else if (s.type === 'line' || s.type === 'arrow') {
        const x2 = s.x + (s.width||0)
        const y2 = s.y + (s.height||0)
        const d = distToSegment(p, {x:s.x,y:s.y}, {x:x2,y:y2})
        if (d < 6) return s
      } else if (s.type === 'text') {
        const textShape = s as TextShape
        const w = s.width || 0, h = textShape.fontSize
        if (p.x >= s.x && p.x <= s.x + w && p.y >= s.y - h && p.y <= s.y) return s
      } else if (s.type === 'pencil') {
        const pencilShape = s as PencilShape
        const pts = pencilShape.points
        for (let j=1;j<pts.length;j++){
          if (distToSegment(p, pts[j-1], pts[j]) < 4) return s
        }
      }
    }
    return null
  }

  function onDown(e: React.PointerEvent) {
    if (!activePageId) return
    const p = localXY(e)

    if (tool === 'text') {
      // If clicking an existing text shape, enter edit mode instead of creating new.
      const existing = hitTest(p)
      if (existing && existing.type === 'text') {
        dispatch({ type:'SELECT', id: existing.id })
        setEditingText({ id: existing.id, x: existing.x, y: (existing.y - (existing as TextShape).fontSize) })
        return
      }
      const textId = nanoid(8)
      const placeholder = 'Type here...'
      // Measure placeholder width for initial bounding box
      const ctx = canvasRef.current?.getContext('2d')
      let w = 100
      if (ctx) { ctx.font = `${fontSize}px ${fontFamily}`; w = ctx.measureText(placeholder).width }
      const shape: TextShape = {
        id: textId,
        type:'text',
        pageId: activePageId,
        x: p.x,
        y: p.y + fontSize, // store baseline y
        content: placeholder,
        fontSize,
        fontFamily,
        color,
        width: w,
        height: fontSize
      }
      dispatch({ type:'ADD_SHAPE', pageId: activePageId, shape })
      // Input should appear aligned with top-left of text box: y - fontSize
      setEditingText({ id: textId, x: p.x, y: p.y })
      dispatch({ type:'SELECT', id: textId })
      return
    }

    setDown(true); setStart(p)
    if (tool === 'select') {
      const hit = hitTest(p)
      dispatch({ type:'SELECT', id: hit?.id ?? null })
      if (hit) setDragOffset({ x: p.x - hit.x, y: p.y - hit.y })
      return
    }
    if (tool === 'eraser') {
      const hit = hitTest(p)
      if (hit && activePageId) {
        dispatch({ type:'DELETE_SHAPE', pageId: activePageId, shapeId: hit.id })
      }
      return
    }
    if (tool === 'pencil') {
      const sh: PencilShape = { id: nanoid(8), type: 'pencil', pageId: activePageId, x: p.x, y: p.y, points: [p], color, strokeWidth }
      setTemp(sh); return
    }
    if (tool === 'line' || tool === 'arrow') {
      setTemp({ id: nanoid(8), type: tool, pageId: activePageId, x: p.x, y: p.y, width: 0, height: 0, color, strokeWidth }); return
    }
    if (tool === 'circle') {
      setTemp({ id: nanoid(8), type: 'circle', pageId: activePageId, x: p.x, y: p.y, radius: 1, color, strokeWidth }); return
    }
    if (tool === 'rect') {
      setTemp({ id: nanoid(8), type: 'rectangle', pageId: activePageId, x: p.x, y: p.y, width: 1, height: 1, color, strokeWidth }); return
    }
  }

  function onMove(e: React.PointerEvent) {
    if (!isDown) return
    const p = localXY(e)
    if (tool === 'select' && selection && dragOffset && activePageId) {
      dispatch({ type:'UPDATE_SHAPE', pageId: activePageId, shapeId: selection, patch: { x: p.x - dragOffset.x, y: p.y - dragOffset.y } })
      draw(); return
    }
    if (tool === 'eraser' && activePageId) {
      const hit = hitTest(p)
      if (hit) {
        dispatch({ type:'DELETE_SHAPE', pageId: activePageId, shapeId: hit.id })
        draw()
      }
      return
    }

    if (!start) return
    const dx = p.x - start.x, dy = p.y - start.y
    if (temp?.type === 'pencil') {
      const pencilTemp = temp as PencilShape
      pencilTemp.points.push(p)
      setTemp({...pencilTemp})
      draw()
      return
    }
    if (temp?.type === 'line' || temp?.type === 'arrow') {
      temp.width = dx; temp.height = dy; setTemp({...temp}); draw(); return
    }
    if (temp?.type === 'circle') {
      temp.radius = Math.hypot(dx, dy); setTemp({...temp}); draw(); return
    }
    if (temp?.type === 'rectangle') {
      temp.width = dx; temp.height = dy; setTemp({...temp}); draw(); return
    }
  }

  function onUp() {
    setDown(false); setStart(null); setDragOffset(null)
    if (temp && activePageId) {
      if (temp.type === 'rectangle') {
        if ((temp.width ?? 0) < 0) { temp.x = temp.x + (temp.width ?? 0); temp.width = Math.abs(temp.width ?? 0) }
        if ((temp.height ?? 0) < 0) { temp.y = temp.y + (temp.height ?? 0); temp.height = Math.abs(temp.height ?? 0) }
      }
      dispatch({ type:'ADD_SHAPE', pageId: activePageId, shape: temp })
      setTemp(null)
    }
  }

  useEffect(()=>{ draw() }, [draw])

  // helpers
  function boundsOf(s: Shape){ 
    if (s.type === 'circle') return { x: s.x-(s.radius||0), y: s.y-(s.radius||0), w:(s.radius||0)*2, h:(s.radius||0)*2 }
    if (s.type === 'rectangle') return { x: s.x, y: s.y, w: s.width||0, h: s.height||0 }
    if (s.type === 'text') {
      const textShape = s as TextShape
      return { x: s.x, y: s.y-textShape.fontSize, w: s.width||0, h:textShape.fontSize }
    }
    if (s.type === 'line' || s.type === 'arrow') {
      const x2 = s.x + (s.width||0), y2 = s.y + (s.height||0)
      return { x: Math.min(s.x,x2), y: Math.min(s.y,y2), w: Math.abs(x2-s.x), h: Math.abs(y2-s.y) }
    }
    return { x: s.x, y: s.y, w: 0, h: 0 }
  }
  function distToSegment(p: Pt, v: Pt, w: Pt){
    const l2 = (v.x-w.x)**2+(v.y-w.y)**2
    if (l2===0) return Math.hypot(p.x-v.x,p.y-v.y)
    let t = ((p.x-v.x)*(w.x-v.x)+(p.y-v.y)*(w.y-v.y))/l2; t = Math.max(0,Math.min(1,t))
    const proj = { x: v.x + t*(w.x-v.x), y: v.y + t*(w.y-v.y) }
    return Math.hypot(p.x-proj.x, p.y-proj.y)
  }

  // keyboard shortcuts
  useEffect(()=>{
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selection && activePageId) {
        dispatch({ type:'DELETE_SHAPE', pageId: activePageId, shapeId: selection })
      }
      if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='t') {
        e.preventDefault(); dispatch({ type:'ADD_PAGE' })
      }
    }
    window.addEventListener('keydown', onKey)
    return ()=>window.removeEventListener('keydown', onKey)
  }, [selection, activePageId, dispatch])

  const handleTextEdit = (newContent: string) => {
    if (editingText && activePageId) {
      const trimmed = newContent.trim()
      if (trimmed === '') {
        // Delete empty text
        dispatch({ type:'DELETE_SHAPE', pageId: activePageId, shapeId: editingText.id })
      } else {
        const ctx = canvasRef.current!.getContext('2d')!
        ctx.font = `${fontSize}px ${fontFamily}`
        const w = ctx.measureText(trimmed).width
        dispatch({
          type:'UPDATE_SHAPE',
          pageId: activePageId,
            shapeId: editingText.id,
          patch: { content: trimmed, width: w }
        })
      }
      setEditingText(null)
      dispatch({ type:'SET_TOOL', tool: 'select' })
    }
  }

  return (
    <div className="canvasWrap">
      <canvas
        ref={canvasRef}
        style={{ width:'100%', height:'100%' }}
        onPointerDown={(e) => {
          // Close color palette
          const palette = document.querySelector('.color-palette');
          if (palette) {
            palette.classList.remove('open');
          }
          onDown(e);
        }}
        onDoubleClick={(e) => {
          if (!activePageId) return
          // map mouse event to pointer-like structure for localXY
          const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
          const p = { x: e.clientX - rect.left, y: e.clientY - rect.top }
          const hit = hitTest(p)
          if (hit && hit.type === 'text') {
            dispatch({ type:'SELECT', id: hit.id })
            setEditingText({ id: hit.id, x: hit.x, y: (hit.y - (hit as TextShape).fontSize) })
          }
        }}
        onPointerMove={onMove}
        onPointerUp={onUp}
      />
      {editingText && (
        <input
          className="text-editor"
          style={{
            position: 'absolute',
            left: editingText.x,
            top: editingText.y,
            fontSize: fontSize,
            fontFamily: fontFamily,
            color: color,
            background: 'rgba(255,255,255,0.85)',
            border: '2px solid ' + color,
            borderRadius: '4px',
            padding: '2px 4px',
            outline: 'none',
            minWidth: '120px',
            zIndex: 1000
          }}
          autoFocus
          defaultValue={ (() => {
            const shape = shapes.find(s => s.id === editingText.id) as TextShape | undefined
            return shape?.content ?? 'Type here...'
          })() }
          onChange={(e) => {
            // live update width so selection box scales while typing
            const live = e.currentTarget.value
            const ctx = canvasRef.current?.getContext('2d')
            if (ctx && activePageId) {
              ctx.font = `${fontSize}px ${fontFamily}`
              const w = ctx.measureText(live).width
              dispatch({ type:'UPDATE_SHAPE', pageId: activePageId, shapeId: editingText.id, patch: { content: live, width: w } })
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleTextEdit(e.currentTarget.value)
            } else if (e.key === 'Escape') {
              // revert to previous content or delete if empty
              const shape = shapes.find(s => s.id === editingText.id) as TextShape | undefined
              if (shape && shape.content.trim() === '') {
                dispatch({ type:'DELETE_SHAPE', pageId: activePageId!, shapeId: editingText.id })
              }
              setEditingText(null)
              dispatch({ type:'SET_TOOL', tool: 'select' })
            }
          }}
          onBlur={(e) => handleTextEdit(e.currentTarget.value)}
        />
      )}
      <div className="hud">Tool: {tool} {selection ? `| selected: ${selection}`:''}</div>
    </div>
  )
}
