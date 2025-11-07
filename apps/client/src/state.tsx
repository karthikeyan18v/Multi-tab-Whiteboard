import React, { createContext, useContext, useEffect, useReducer } from 'react'
import { nanoid } from 'nanoid'
import type { Page, Shape, Tool } from './types'
import { api } from './api'

type State = {
  pages: Page[]
  activePageId: string | null
  shapesByPage: Record<string, Shape[]>
  tool: Tool
  color: string
  fontFamily: string
  fontSize: number
  strokeWidth: number
  selection: string | null
}

type Action =
  | { type: 'INIT_FROM_LOCAL'; payload: Partial<State> }
  | { type: 'ADD_PAGE'; name?: string; id?: string }
  | { type: 'SET_ACTIVE_PAGE'; id: string }
  | { type: 'RENAME_PAGE'; id: string; name: string }
  | { type: 'DELETE_PAGE'; id: string }
  | { type: 'SET_TOOL'; tool: Tool }
  | { type: 'SET_COLOR'; color: string }
  | { type: 'SET_FONT'; family: string }
  | { type: 'SET_FONT_SIZE'; size: number }
  | { type: 'SET_STROKE'; width: number }
  | { type: 'SET_SHAPES'; pageId: string; shapes: Shape[] }
  | { type: 'ADD_SHAPE'; pageId: string; shape: Shape }
  | { type: 'UPDATE_SHAPE'; pageId: string; shapeId: string; patch: Partial<Shape> }
  | { type: 'DELETE_SHAPE'; pageId: string; shapeId: string }
  | { type: 'SELECT'; id: string | null }

const initial: State = {
  pages: [],
  activePageId: null,
  shapesByPage: {},
  tool: 'select',
  color: '#60a5fa',
  fontFamily: 'Arial',
  fontSize: 16,
  strokeWidth: 2,
  selection: null
}

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case 'INIT_FROM_LOCAL':
      return { ...state, ...a.payload }
    case 'ADD_PAGE': {
      const id = a.id ?? nanoid(8)
      const name = a.name ?? `Project ${state.pages.length + 1}`
      return {
        ...state,
        pages: [...state.pages, { id, name }],
        shapesByPage: { ...state.shapesByPage, [id]: [] },
        activePageId: id
      }
    }
    case 'SET_ACTIVE_PAGE': return { ...state, activePageId: a.id, selection: null }
    case 'RENAME_PAGE': return { ...state, pages: state.pages.map(p => p.id === a.id ? { ...p, name: a.name } : p) }
    case 'DELETE_PAGE': {
      const pages = state.pages.filter(p => p.id !== a.id)
      const shapesByPage = { ...state.shapesByPage }; delete shapesByPage[a.id]
      const active = state.activePageId === a.id ? (pages[0]?.id ?? null) : state.activePageId
      return { ...state, pages, shapesByPage, activePageId: active, selection: null }
    }
    case 'SET_TOOL': return { ...state, tool: a.tool }
    case 'SET_COLOR': return { ...state, color: a.color }
    case 'SET_FONT': return { ...state, fontFamily: a.family }
    case 'SET_FONT_SIZE': return { ...state, fontSize: a.size }
    case 'SET_STROKE': return { ...state, strokeWidth: a.width }
    case 'SET_SHAPES': return { ...state, shapesByPage: { ...state.shapesByPage, [a.pageId]: a.shapes } }
    case 'ADD_SHAPE': return { ...state, shapesByPage: { ...state.shapesByPage, [a.pageId]: [...(state.shapesByPage[a.pageId] ?? []), a.shape] }, selection: a.shape.id }
    case 'UPDATE_SHAPE': {
      const arr = (state.shapesByPage[a.pageId] ?? []).map(s => s.id === a.shapeId ? { ...s, ...a.patch } : s)
      return { ...state, shapesByPage: { ...state.shapesByPage, [a.pageId]: arr } }
    }
    case 'DELETE_SHAPE': {
      const arr = (state.shapesByPage[a.pageId] ?? []).filter(s => s.id !== a.shapeId)
      const selection = state.selection === a.shapeId ? null : state.selection
      return { ...state, shapesByPage: { ...state.shapesByPage, [a.pageId]: arr }, selection }
    }
    case 'SELECT': return { ...state, selection: a.id }
    default: return state
  }
}

const Ctx = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null)

export const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initial)

  React.useEffect(() => {
    const saved = localStorage.getItem('wb:v1')
    if (saved) dispatch({ type: 'INIT_FROM_LOCAL', payload: JSON.parse(saved) })

    // try backend if available (non-blocking)
    api.listPages().then(p => {
      if (!p.length) return
      const first = p[0].id
      dispatch({ type: 'INIT_FROM_LOCAL', payload: { pages: p, activePageId: first, shapesByPage: {} } })
      api.listShapes(first).then(shapes => dispatch({ type: 'SET_SHAPES', pageId: first, shapes })).catch(()=>{})
    }).catch(()=>{})
  }, [])

  useEffect(() => { localStorage.setItem('wb:v1', JSON.stringify(state)) }, [state])

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useStore = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('Store missing')
  return ctx
}
