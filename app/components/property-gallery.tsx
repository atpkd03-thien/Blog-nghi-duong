'use client'
import {useEffect, useState} from 'react'

type ImageItem={id:string;image_url:string;sort_order?:number}

type Props={images:ImageItem[];fallback?:string|null;alt:string}

export default function PropertyGallery({images,fallback,alt}:Props){
  const list=images.length?images:(fallback?[{id:'fallback',image_url:fallback,sort_order:0}]:[])
  const [active,setActive]=useState(0)
  const [paused,setPaused]=useState(false)
  useEffect(()=>{
    if(list.length<=1 || paused) return
    const timer=window.setInterval(()=>setActive(i=>(i+1)%list.length),4000)
    return ()=>window.clearInterval(timer)
  },[list.length,paused])
  if(!list.length) return <div className="property-gallery-empty">BẤT ĐỘNG SẢN</div>
  const current=list[Math.min(active,list.length-1)]
  return <div className="property-gallery" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onTouchStart={()=>setPaused(true)} onTouchEnd={()=>setPaused(false)}>
    <div className="property-gallery-main">
      <img src={current.image_url} alt={alt}/>
      {list.length>1&&<>
        <button type="button" className="gallery-arrow gallery-prev" aria-label="Ảnh trước" onClick={()=>setActive(i=>(i-1+list.length)%list.length)}>‹</button>
        <button type="button" className="gallery-arrow gallery-next" aria-label="Ảnh tiếp theo" onClick={()=>setActive(i=>(i+1)%list.length)}>›</button>
        <span className="gallery-counter">{active+1}/{list.length}</span>
      </>}
    </div>
    {list.length>1&&<div className="property-gallery-thumbs">{list.map((x,i)=><button type="button" key={x.id} className={`gallery-thumb ${i===active?'active':''}`} onClick={()=>setActive(i)} aria-label={`Xem ảnh ${i+1}`}><img src={x.image_url} alt=""/></button>)}</div>}
  </div>
}
