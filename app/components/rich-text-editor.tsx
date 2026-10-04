'use client'
import {useEffect, useRef} from 'react'

type Props={value:string; onChange:(value:string)=>void; placeholder?:string}

const commands=[
  ['bold','B','Đậm'],['italic','I','Nghiêng'],['underline','U','Gạch chân'],['strikeThrough','S','Gạch ngang']
] as const

export default function RichTextEditor({value,onChange,placeholder='Nhập nội dung...'}:Props){
  const ref=useRef<HTMLDivElement>(null)
  const ready=useRef(false)
  useEffect(()=>{if(ref.current&&!ready.current){ref.current.innerHTML=value||'';ready.current=true}},[value])
  function exec(command:string,arg?:string){ref.current?.focus();document.execCommand(command,false,arg);onChange(ref.current?.innerHTML||'')}
  function emit(){onChange(ref.current?.innerHTML||'')}
  function createLink(){const url=window.prompt('Nhập URL:','https://');if(url)exec('createLink',url)}
  return <div className="rich-editor">
    <div className="rich-toolbar" role="toolbar" aria-label="Định dạng nội dung">
      {commands.map(([cmd,label,title])=><button key={cmd} type="button" className="rich-tool" title={title} onMouseDown={e=>e.preventDefault()} onClick={()=>exec(cmd)}><span className={cmd==='bold'?'tool-bold':cmd==='italic'?'tool-italic':cmd==='underline'?'tool-underline':''}>{label}</span></button>)}
      <span className="rich-sep"/>
      <select className="rich-select" title="Kiểu chữ" defaultValue="p" onChange={e=>exec('formatBlock',e.target.value)}>
        <option value="p">Đoạn văn</option><option value="h2">Tiêu đề lớn</option><option value="h3">Tiêu đề</option><option value="h4">Tiêu đề nhỏ</option>
      </select>
      <button type="button" className="rich-tool" title="Danh sách" onMouseDown={e=>e.preventDefault()} onClick={()=>exec('insertUnorderedList')}>•☰</button>
      <button type="button" className="rich-tool" title="Danh sách đánh số" onMouseDown={e=>e.preventDefault()} onClick={()=>exec('insertOrderedList')}>1☰</button>
      <span className="rich-sep"/>
      <button type="button" className="rich-tool" title="Căn trái" onClick={()=>exec('justifyLeft')}>≡</button>
      <button type="button" className="rich-tool" title="Căn giữa" onClick={()=>exec('justifyCenter')}>≡</button>
      <button type="button" className="rich-tool" title="Căn phải" onClick={()=>exec('justifyRight')}>≡</button>
      <span className="rich-sep"/>
      <label className="rich-color" title="Màu chữ">A<input type="color" defaultValue="#17324d" onChange={e=>exec('foreColor',e.target.value)}/></label>
      <label className="rich-color highlight" title="Màu highlight">▰<input type="color" defaultValue="#fff3a3" onChange={e=>exec('hiliteColor',e.target.value)}/></label>
      <button type="button" className="rich-tool" title="Chèn liên kết" onClick={createLink}>🔗</button>
      <button type="button" className="rich-tool" title="Xóa định dạng" onClick={()=>exec('removeFormat')}>Tx</button>
    </div>
    <div ref={ref} className="rich-content" contentEditable suppressContentEditableWarning onInput={emit} data-placeholder={placeholder} role="textbox" aria-multiline="true"/>
  </div>
}
