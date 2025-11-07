export default function ColorSwatch({ value, onChange }: { value: string; onChange: (v: string)=>void }) {
  return (
    <label className="tool" title="Text/Stroke color">
      <span>Color</span>
      <input type="color" value={value} onChange={e=>onChange(e.target.value)} style={{ appearance:'none', border:'0', background:'transparent', width:28, height:28, padding:0 }}/>
      <span className="color" style={{ background: value }} />
    </label>
  )
}
