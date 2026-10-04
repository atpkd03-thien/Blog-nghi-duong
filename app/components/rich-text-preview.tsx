'use client'
import {useEffect, useRef, useState} from 'react'
import RichTextDisplay from './rich-text-display'

export default function RichTextPreview({html, maxHeight=185, className='product-description-preview'}:{html?:string|null;maxHeight?:number;className?:string}){
  const ref=useRef<HTMLDivElement>(null)
  const [expanded,setExpanded]=useState(false)
  const [hasMore,setHasMore]=useState(false)

  useEffect(()=>{
    const el=ref.current
    if(!el) return
    const check=()=>setHasMore(el.scrollHeight>maxHeight+4)
    check()
    const observer=new ResizeObserver(check)
    observer.observe(el)
    return ()=>observer.disconnect()
  },[html,maxHeight])

  return <div className={`rich-preview-wrap ${expanded?'is-expanded':''}`}>
    <div ref={ref} className={className} style={expanded?undefined:{maxHeight}}>
      <RichTextDisplay html={html} className="rich-preview-content"/>
    </div>
    {hasMore&&<button type="button" className="rich-more" onClick={()=>setExpanded(v=>!v)}>{expanded?'Thu gọn':'Xem thêm'} <span aria-hidden="true">{expanded?'↑':'→'}</span></button>}
  </div>
}
