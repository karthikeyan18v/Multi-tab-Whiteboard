import { useStore } from '../state'

const Icon = {
  select: <svg width="16" height="16" viewBox="0 0 24 24"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  pencil: <svg width="16" height="16" viewBox="0 0 24 24"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  line: <svg width="16" height="16" viewBox="0 0 24 24"><path d="M4 18L20 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  eraser: <svg width="16" height="16" viewBox="0 0 24 24"><path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0M4.22 15.58l3.54 3.53c.78.79 2.04.79 2.83 0l3.53-3.53" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>,
  circle: <svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>,
  arrow: <svg width="16" height="16" viewBox="0 0 24 24"><path d="M4 12h12M12 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>,
  text: <svg width="16" height="16" viewBox="0 0 24 24"><path d="M6 6h12M12 6v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  rect: <svg width="16" height="16" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
}

export default function Toolbar() {
  const { state, dispatch } = useStore()
  const { tool, fontFamily, fontSize, color, strokeWidth } = state

  const tools: Array<{name: keyof typeof Icon, title: string}> = [
    { name: 'select', title: 'Select' },
    { name: 'pencil', title: 'Pencil' },
    { name: 'line', title: 'Line' },
    { name: 'eraser', title: 'Eraser' },
    { name: 'circle', title: 'Circle' },
    { name: 'rect', title: 'Rectangle' },
    { name: 'arrow', title: 'Arrow' },
    { name: 'text', title: 'Text' }
  ]

  return (
    <div className="toolbar">
      <div className="tool-group tool-group--primary">
        {tools.map(t => (
          <button
            key={t.name}
            className={`tool ${tool===t.name ? 'active':''}`}
            onClick={()=>dispatch({ type:'SET_TOOL', tool: t.name })}
            title={t.title}
          >
            {Icon[t.name]}
          </button>
        ))}
      </div>

      <div className="tool-group tool-group--options">
      <label className="tool tool--inline">
        <span>Font</span>
        <select className="select" value={fontFamily} onChange={(e)=>dispatch({ type:'SET_FONT', family: e.target.value })}>
          <option>Arial</option>
          <option>Inter</option>
          <option>Verdana</option>
          <option>Georgia</option>
          <option>Courier New</option>
        </select>
      </label>

      <label className="tool tool--inline">
        <span>Size</span>
        <select className="select" value={fontSize} onChange={(e)=>dispatch({ type:'SET_FONT_SIZE', size: Number(e.target.value) })}>
          {[12,14,16,18,24,32,48].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </label>

      <label className="tool tool--inline">
        <span>Stroke</span>
        <select className="select" value={strokeWidth} onChange={(e)=>dispatch({ type:'SET_STROKE', width: Number(e.target.value) })}>
          {[1,2,3,4,6,8].map(s=><option key={s} value={s}>{s}px</option>)}
        </select>
      </label>

      <div className="color-picker">
        <input 
          type="color" 
          value={color} 
          onChange={(e)=>{
            dispatch({ type:'SET_COLOR', color: e.target.value });
            const palette = document.querySelector('.color-palette');
            if (palette) {
              palette.classList.remove('open');
            }
          }} 
          className="color-input"
          title="Choose color"
          id="customColorInput"
        />
        <div 
          className="color-preview" 
          style={{ backgroundColor: color }}
          onClick={() => {
            const palette = document.querySelector('.color-palette');
            if (palette) {
              palette.classList.toggle('open');
            }
          }}
        />
        <div className="color-palette">
          <div className="color-grid">
            {['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
              '#800000', '#808080', '#008000', '#800080', '#008080', '#808000', '#c0c0c0', '#ffa500',
              '#ffc0cb', '#a52a2a', '#dda0dd', '#98fb98', '#f0e68c', '#deb887', '#5f9ea0', '#ff1493',
              '#00ced1', '#ff69b4', '#cd853f', '#ffd700', '#40e0d0', '#ee82ee', '#90ee90', '#f5deb3'
            ].map((presetColor) => (
              <div
                key={presetColor}
                className={`color-swatch ${color === presetColor ? 'active' : ''}`}
                style={{ backgroundColor: presetColor }}
                onClick={() => {
                  dispatch({ type:'SET_COLOR', color: presetColor });
                  const palette = document.querySelector('.color-palette');
                  if (palette) {
                    palette.classList.remove('open');
                  }
                }}
              />
            ))}
          </div>
          <button 
            className="custom-color-btn"
            onClick={() => {
              document.getElementById('customColorInput')?.click();
            }}
            title="Choose custom color"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Custom Color
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}
