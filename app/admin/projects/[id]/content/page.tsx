'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import RichTextEditor from '@/app/components/rich-text-editor'
import { supabaseBrowser } from '@/lib/supabase'

type Project = { id:string; name:string; slug:string; location:string|null; description:string|null; image_url:string|null; potential_description:string|null; status:string }
type Place = { id:string; project_id:string; section:'amenity'|'connection'|'travel'; name:string; category:string; travel_minutes:number|null; distance_km:number|null; note:string|null; image_url:string|null; sort_order:number }
type Property = { id:string; title:string; location:string; price:string|null; status:string; image_url:string|null }
type ProjectImage = { id:string; project_id:string; image_url:string; sort_order:number }

const emptyPlace = { section:'amenity' as const, name:'', category:'Tiện ích', travel_minutes:'', distance_km:'', note:'', image_url:'' }
const categoryOptions = ['Tiện ích','Ăn uống','Thư giãn','Lưu trú','Camping','Thể thao','Giải trí','Tâm linh','Du lịch','Giao thông','Dịch vụ','Giáo dục','Y tế','Khác']

export default function ProjectContentPage(){
  const { id } = useParams<{id:string}>()
  const router = useRouter()
  const s = supabaseBrowser()
  const [project,setProject] = useState<Project|null>(null)
  const [overview,setOverview] = useState('')
  const [location,setLocation] = useState('')
  const [potential,setPotential] = useState('')
  const [places,setPlaces] = useState<Place[]>([])
  const [properties,setProperties] = useState<Property[]>([])
  const [projectImages,setProjectImages] = useState<ProjectImage[]>([])
  const [overviewFiles,setOverviewFiles] = useState<File[]>([])
  const [activeSection,setActiveSection] = useState<'overview'|'potential'|'amenity'|'connection'|'investment'|'travel'>('overview')
  const [placeForm,setPlaceForm] = useState(emptyPlace)
  const [editingPlace,setEditingPlace] = useState<string|null>(null)
  const [file,setFile] = useState<File|null>(null)
  const [overviewFile,setOverviewFile] = useState<File|null>(null)
  const [busy,setBusy] = useState(false)
  const [message,setMessage] = useState('')

  async function load(){
    const [{data:p},{data:ps},{data:props},{data:pimgs}] = await Promise.all([
      s.from('projects').select('id,name,slug,location,description,image_url,potential_description,status').eq('id',id).maybeSingle(),
      s.from('project_places').select('*').eq('project_id',id).order('section').order('sort_order').order('created_at'),
      s.from('properties').select('id,title,location,price,status,image_url').eq('project_id',id).order('created_at',{ascending:false}),
      s.from('project_images').select('id,project_id,image_url,sort_order').eq('project_id',id).order('sort_order',{ascending:true}).order('created_at',{ascending:true})
    ])
    setProject(p)
    setOverview(p?.description||'')
    setLocation(p?.location||'')
    setPotential(p?.potential_description||'')
    setPlaces(ps||[])
    setProperties(props||[])
    setProjectImages((pimgs||[]) as ProjectImage[])
  }
  useEffect(()=>{if(id) load()},[id])

  const currentPlaces = useMemo(()=>places.filter(x=>x.section===activeSection),[places,activeSection])
  const placeSection = activeSection==='amenity' || activeSection==='connection' || activeSection==='travel' ? activeSection : 'amenity'
  const title = placeSection==='amenity'?'Tiện ích nội khu':placeSection==='connection'?'Kết nối':'Du lịch tham quan trải nghiệm'

  function resetPlace(){setEditingPlace(null);setFile(null);setPlaceForm({...emptyPlace,section:placeSection})}
  function editPlace(x:Place){setEditingPlace(x.id);setFile(null);setPlaceForm({section:x.section,name:x.name,category:x.category||'Tiện ích',travel_minutes:x.travel_minutes==null?'':String(x.travel_minutes),distance_km:x.distance_km==null?'':String(x.distance_km),note:x.note||'',image_url:x.image_url||''});window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})}

  async function uploadFile(file:File,pathPrefix:string){
    const ext=file.name.split('.').pop()?.toLowerCase()||'jpg'
    const path=`${pathPrefix}/${id}/${crypto.randomUUID()}.${ext}`
    const {error}=await s.storage.from('media').upload(path,file,{contentType:file.type,upsert:false})
    if(error) throw error
    return s.storage.from('media').getPublicUrl(path).data.publicUrl
  }

  async function saveOverview(e:React.FormEvent){
    e.preventDefault();setBusy(true);setMessage('')
    try{
      let image_url=project?.image_url||null
      if(overviewFile) image_url=await uploadFile(overviewFile,'projects')
      const {error}=await s.from('projects').update({description:overview,location:location.trim()||null,image_url,updated_at:new Date().toISOString()}).eq('id',id)
      if(error) throw error
      setMessage('Đã lưu Tổng quan dự án.')
      if(overviewFiles.length){
        const remaining = Math.max(0, 12 - projectImages.length)
        if(overviewFiles.length > remaining) throw new Error(`Slider tối đa 12 ảnh. Hiện còn ${remaining} vị trí.`)
        const start = projectImages.length
        for(let i=0;i<overviewFiles.length;i++){
          const url=await uploadFile(overviewFiles[i],'project-overview')
          const {error:imageError}=await s.from('project_images').insert({project_id:id,image_url:url,sort_order:start+i})
          if(imageError) throw imageError
        }
      }
      setOverviewFile(null);setOverviewFiles([]);await load()
    }catch(e:any){setMessage(e?.message||'Có lỗi khi lưu Tổng quan.')}finally{setBusy(false)}
  }

  async function savePotential(e:React.FormEvent){
    e.preventDefault();setBusy(true);setMessage('')
    try{
      const {error}=await s.from('projects').update({potential_description:potential,updated_at:new Date().toISOString()}).eq('id',id)
      if(error) throw error
      setMessage('Đã lưu Tiềm năng dự án.');await load()
    }catch(e:any){setMessage(e?.message||'Có lỗi khi lưu Tiềm năng.')}finally{setBusy(false)}
  }

  async function savePlace(e:React.FormEvent){
    e.preventDefault();if(!placeForm.name.trim()){setMessage('Vui lòng nhập tên.');return}
    setBusy(true);setMessage('')
    try{
      let image_url=placeForm.image_url||null
      if(file) image_url=await uploadFile(file,'project-places')
      const payload={project_id:id,section:placeForm.section,name:placeForm.name.trim(),category:placeForm.category||'Tiện ích',travel_minutes:placeForm.travel_minutes===''?null:Number(placeForm.travel_minutes),distance_km:placeForm.distance_km===''?null:Number(placeForm.distance_km),note:placeForm.note.trim()||null,image_url,sort_order:editingPlace?(places.find(x=>x.id===editingPlace)?.sort_order||0):currentPlaces.length,updated_at:new Date().toISOString()}
      const r=editingPlace?await s.from('project_places').update(payload).eq('id',editingPlace):await s.from('project_places').insert(payload)
      if(r.error) throw r.error
      setMessage(editingPlace?'Đã cập nhật địa điểm.':'Đã thêm địa điểm.')
      resetPlace();await load()
    }catch(e:any){setMessage(e?.message||'Có lỗi khi lưu địa điểm.')}finally{setBusy(false)}
  }

  async function removePlace(placeId:string){if(!confirm('Xóa mục này?'))return;const {error}=await s.from('project_places').delete().eq('id',placeId);if(error)setMessage(error.message);else{setMessage('Đã xóa.');load()}}
  async function removeProperty(propertyId:string){if(!confirm('Xóa BĐS này? Thao tác này sẽ xóa BĐS khỏi dự án.'))return;const {error}=await s.from('properties').delete().eq('id',propertyId);if(error)setMessage(error.message);else{setMessage('Đã xóa BĐS.');load()}}

  if(!project) return <main className="container section"><div className="empty">Đang tải nội dung dự án...</div></main>

  const placeTabs:[string,string][] = [['amenity','🌿 Tiện ích nội khu'],['connection','📍 Kết nối'],['travel','🏞️ Du lịch tham quan']]

  return <main className="container section">
    <div className="admin-top">
      <div><div className="eyebrow">PROJECT LANDING</div><h1>Quản lý landing — {project.name}</h1><p>Tất cả nội dung của trang dự án được CRUD tại đây.</p></div>
      <div className="actions-row"><a className="btn btn-primary" href={`/projects/${project.slug}`} target="_blank" rel="noreferrer">Xem website</a><button className="btn" onClick={()=>router.push('/admin/projects')}>← Dự án</button></div>
    </div>

    <nav className="project-admin-nav">
      {[
        ['overview','01 Tổng quan'],['amenity','02 Tiện ích'],['connection','03 Kết nối'],['potential','04 Tiềm năng'],['investment','05 Đầu tư / BĐS'],['travel','06 Du lịch']
      ].map(([key,label])=><button key={key} className={activeSection===key?'active':''} onClick={()=>{setActiveSection(key as typeof activeSection);setEditingPlace(null);setFile(null);}}>{label}</button>)}
    </nav>

    {activeSection==='overview'&&<form className="card project-content-editor-card" onSubmit={saveOverview}>
      <div className="project-content-title"><div><div className="eyebrow">01. TỔNG QUAN</div><h2>Tổng quan dự án</h2><p>Chỉnh vị trí, ảnh đại diện và toàn bộ nội dung Rich Text.</p></div><span className="project-section-count">Rich Text</span></div>
      <input className="input" placeholder="Vị trí dự án" value={location} onChange={e=>setLocation(e.target.value)}/>
      <div style={{marginTop:12}}><RichTextEditor value={overview} onChange={setOverview} placeholder="Tổng quan, vị trí, quy mô, định hướng..."/></div>
      <div className="project-admin-image-row"><div>{project.image_url?<img src={project.image_url} alt={project.name}/>:<div className="project-admin-image-empty">Ảnh dự án</div>}</div><div><label className="editor-label">Ảnh đại diện dự án</label><input className="input" type="file" accept="image/*" onChange={e=>setOverviewFile(e.target.files?.[0]||null)}/><p className="field-help">Ảnh này dùng làm ảnh dự phòng nếu slider chưa có ảnh.</p></div></div>
      <div className="project-overview-slider-admin">
        <div className="project-content-title" style={{marginBottom:12}}><div><h3>Slider Tổng quan</h3><p>Thêm tối đa 12 ảnh. Website sẽ tự chuyển ảnh mỗi 4,5 giây.</p></div><span className="project-section-count">{projectImages.length}/12</span></div>
        <div className="project-overview-admin-grid">
          {projectImages.map((img,index)=><article key={img.id} className="project-overview-admin-item"><img src={img.image_url} alt={`Ảnh ${index+1}`}/><div><b>Ảnh {index+1}</b><button type="button" className="btn btn-danger-small" onClick={async()=>{if(!confirm('Xóa ảnh này khỏi slider?'))return;const {error}=await s.from('project_images').delete().eq('id',img.id);if(error)setMessage(error.message);else{setMessage('Đã xóa ảnh slider.');load()}}}>Xóa</button></div></article>)}
          {!projectImages.length&&<div className="project-empty-inline">Chưa có ảnh slider. Hãy chọn nhiều ảnh bên dưới.</div>}
        </div>
        <label className="editor-label" style={{marginTop:14}}>Thêm ảnh vào slider</label>
        <input className="input" type="file" accept="image/*" multiple onChange={e=>setOverviewFiles(Array.from(e.target.files||[]).slice(0,12-projectImages.length))}/>
        {overviewFiles.length>0&&<p className="field-help">Đã chọn {overviewFiles.length} ảnh mới.</p>}
      </div>
      <div className="actions-row"><button className="btn btn-primary" disabled={busy}>{busy?'Đang lưu...':'Lưu Tổng quan'}</button></div>
    </form>}

    {activeSection==='potential'&&<form className="card project-content-editor-card" onSubmit={savePotential}>
      <div className="project-content-title"><div><div className="eyebrow">04. TIỀM NĂNG</div><h2>Tiềm năng dự án</h2><p>Rich Text: tiêu đề, in đậm, danh sách, màu, liên kết, xuống dòng...</p></div><span className="project-section-count">Rich Text</span></div>
      <RichTextEditor value={potential} onChange={setPotential} placeholder="Định hướng phát triển, cao tốc, tiềm năng đầu tư..." />
      <div className="actions-row"><button className="btn btn-primary" disabled={busy}>{busy?'Đang lưu...':'Lưu Tiềm năng'}</button></div>
    </form>}

    {activeSection==='investment'&&<section className="card project-content-manager">
      <div className="project-content-title"><div><div className="eyebrow">05. ĐẦU TƯ</div><h2>BĐS trong dự án</h2><p>CRUD BĐS, Rich Text, tối đa 12 ảnh và tiện ích riêng của từng BĐS.</p></div><span className="project-section-count">{properties.length} BĐS</span></div>
      <div className="actions-row" style={{marginBottom:18}}><a className="btn btn-primary" href={`/admin/properties?project=${id}`}>＋ Thêm / quản lý BĐS</a></div>
      <div className="project-content-items">{properties.map(x=><article className="project-content-item" key={x.id}>{x.image_url?<img src={x.image_url} alt={x.title}/>:<div className="project-content-item-placeholder">🏡</div>}<div className="project-content-item-main"><b>{x.title}</b><span>{x.status} · {x.location}</span><p>{x.price||'Liên hệ'}</p></div><div className="actions-row"><a className="btn" href={`/admin/properties?project=${id}&edit=${x.id}`}>Sửa</a><button className="btn" onClick={()=>removeProperty(x.id)}>Xóa</button></div></article>)}{!properties.length&&<div className="project-empty-inline">Chưa có BĐS. Bấm “Thêm / quản lý BĐS”.</div>}</div>
    </section>}

    {(activeSection==='amenity'||activeSection==='connection'||activeSection==='travel')&&<section className="card project-content-manager">
      <div className="project-content-title"><div><div className="eyebrow">NỘI DUNG HÌNH ẢNH</div><h2>{title}</h2><p>CRUD hình ảnh, danh mục, thời gian di chuyển, khoảng cách và ghi chú.</p></div><span className="project-section-count">{currentPlaces.length} mục</span></div>
      <div className="project-content-tabs">{placeTabs.map(([key,label])=><button type="button" key={key} className={activeSection===key?'active':''} onClick={()=>{setActiveSection(key as typeof activeSection);resetPlace()}}>{label}</button>)}</div>
      <div className="project-content-list-head"><div><h3>{title}</h3><p>{currentPlaces.length} mục đang hiển thị ngoài website</p></div><button type="button" className="btn btn-primary" onClick={resetPlace}>＋ Thêm mục</button></div>
      <form className="project-place-editor" onSubmit={savePlace}>
        <div className="project-place-editor-image">{placeForm.image_url?<img src={placeForm.image_url} alt="Preview"/>:<div>🖼️ Ảnh 1:1</div>}<input className="input" type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0]||null;setFile(f);if(f)setPlaceForm({...placeForm,image_url:URL.createObjectURL(f)})}}/></div>
        <div className="project-place-editor-fields"><input className="input" placeholder="Tên địa điểm *" value={placeForm.name} onChange={e=>setPlaceForm({...placeForm,name:e.target.value})}/><select className="input" value={placeForm.category} onChange={e=>setPlaceForm({...placeForm,category:e.target.value})}>{categoryOptions.map(x=><option key={x}>{x}</option>)}</select><input className="input" type="number" min="0" placeholder="Số phút" value={placeForm.travel_minutes} onChange={e=>setPlaceForm({...placeForm,travel_minutes:e.target.value})}/><input className="input" type="number" min="0" step="0.1" placeholder="Khoảng cách (km)" value={placeForm.distance_km} onChange={e=>setPlaceForm({...placeForm,distance_km:e.target.value})}/><input className="input full" placeholder="Ghi chú / mô tả ngắn" value={placeForm.note} onChange={e=>setPlaceForm({...placeForm,note:e.target.value})}/><div className="actions-row full"><button className="btn btn-primary" disabled={busy}>{busy?'Đang lưu...':editingPlace?'Lưu thay đổi':'Lưu mục'}</button>{editingPlace&&<button type="button" className="btn" onClick={resetPlace}>Hủy</button>}</div></div>
      </form>
      <div className="project-content-items">{currentPlaces.map(x=><article className="project-content-item" key={x.id}>{x.image_url?<img src={x.image_url} alt={x.name}/>:<div className="project-content-item-placeholder">📍</div>}<div className="project-content-item-main"><b>{x.name}</b><span>{x.category}</span><p>{[x.travel_minutes!=null?`${x.travel_minutes} phút`:null,x.distance_km!=null?`${x.distance_km} km`:null,x.note].filter(Boolean).join(' · ')}</p></div><div className="actions-row"><button type="button" className="btn" onClick={()=>editPlace(x)}>Sửa</button><button type="button" className="btn" onClick={()=>removePlace(x.id)}>Xóa</button></div></article>)}{!currentPlaces.length&&<div className="project-empty-inline">Chưa có nội dung. Bấm “+ Thêm mục” để bắt đầu.</div>}</div>
    </section>}
    {message&&<div className="success project-content-message">{message}</div>}
  </main>
}
