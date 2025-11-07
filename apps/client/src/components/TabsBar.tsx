import { useStore } from '../state'

const Close = () => (<svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 3l6 6M9 3 3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>)
const Plus = () => (<svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>)

export default function TabsBar() {
  const { state, dispatch } = useStore()
  const { pages, activePageId } = state

  const add = () => dispatch({ type: 'ADD_PAGE' })
  const close = (id: string) => { if (pages.length > 1) dispatch({ type: 'DELETE_PAGE', id }) }

  return (
    <div className="tabs">
      <button className="addBtn" title="New page (Ctrl+T)" onClick={add}><Plus/></button>
      {pages.map(p => (
        <div key={p.id}
          className={`tab ${p.id === activePageId ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'SET_ACTIVE_PAGE', id: p.id })}
          title={p.name}>
          <input
            value={p.name}
            onChange={(e)=>dispatch({ type:'RENAME_PAGE', id: p.id, name: e.target.value })}
            className="tab-input" style={{width: Math.max(60, p.name.length*6) }}
          />
          <span className="x" onClick={(e)=>{e.stopPropagation(); close(p.id)}}><Close/></span>
        </div>
      ))}
      <button className="theme-toggle" onClick={() => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
      }} title="Toggle theme">
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      </button>
    </div>
  )
}
