'use client'
import {useEffect,useState} from 'react'
import {supabaseBrowser} from '@/lib/supabase'
import RichTextEditor from '@/app/components/rich-text-editor'

type Project={id:string;name:string}
type ImageItem={id:string;image_url:string;sort_order:number}
type Amenity={id:string;name:string;category:string;travel_minutes:number|null;distance_km:number|null;note:string|null;sort_order:number;image_url:string|null}
type Item={id:string;title:string;location:string;price:string;status:string;description:string;image_url:string|null;project_id:string|null}
const empty={title:'',location:'',price:'',status:'draft',description:'',image_url:'',project_id:''}
const MAX_IMAGES=12
const emptyAmenity={name:'',category:'Du lịch',travel_minutes:'',distance_km:'',note:'',image_url:''}

export default function Properties(){
  const s=supabaseBrowser();
  const [projectFilter,setProjectFilter]=useState('');const [items,setItems]=useState<Item[]>([]);const [projects,setProjects]=useState<Project[]>([]);const [form,setForm]=useState(empty);const [editing,setEditing]=useState<string|null>(null);const [files,setFiles]=useState<File[]>([]);const [existingImages,setExistingImages]=useState<ImageItem[]>([]);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [amenities,setAmenities]=useState<Amenity[]>([]);const [amenityForm,setAmenityForm]=useState(emptyAmenity);const [editingAmenity,setEditingAmenity]=useState<string|null>(null);const [amenityFile,setAmenityFile]=useState<File|null>(null);
  async function load(pid=projectFilter){let q=s.from('properties').select('*').order('created_at',{ascending:false});if(pid)q=q.eq('project_id',pid);const [{data},{data:ps}]=await Promise.all([q,s.from('projects').select('id,name').order('name')]);setItems(data||[]);setProjects(ps||[]);if(pid&&!editing)setForm(f=>({...f,project_id:pid}))}
  async function loadAmenities(propertyId:string){const {data,error}=await s.from('property_amenities').select('*').eq('property_id',propertyId).order('sort_order',{ascending:true}).order('created_at',{ascending:true});if(error){setMessage(error.message);setAmenities([]);return}setAmenities(data||[])}
  async function loadImages(propertyId:string){const {data,error}=await s.from('property_images').select('id,image_url,sort_order').eq('property_id',propertyId).order('sort_order',{ascending:true}).order('created_at',{ascending:true});if(error){setMessage(error.message);setExistingImages([]);return}setExistingImages(data||[])}
  useEffect(()=>{const params=new URLSearchParams(window.location.search);const pid=params.get('project')||'';const editId=params.get('edit');setProjectFilter(pid);(async()=>{let q=s.from('properties').select('*').order('created_at',{ascending:false});if(pid)q=q.eq('project_id',pid);const [{data},{data:ps}]=await Promise.all([q,s.from('projects').select('id,name').order('name')]);setItems(data||[]);setProjects(ps||[]);if(pid)setForm(f=>({...f,project_id:pid}));if(editId){const found=(data||[]).find((x:any)=>x.id===editId);if(found)edit(found)}})()},[])
  function edit(x:Item){setEditing(x.id);setForm({title:x.title,location:x.location,price:x.price||'',status:x.status,description:x.description||'',image_url:x.image_url||'',project_id:x.project_id||''});setFiles([]);loadImages(x.id);loadAmenities(x.id);window.scrollTo({top:0,behavior:'smooth'})}
  function reset(){setEditing(null);setForm({...empty,project_id:projectFilter});setFiles([]);setExistingImages([]);setAmenities([]);setAmenityForm(emptyAmenity);setAmenityFile(null);setEditingAmenity(null);setMessage('')}
  function editAmenity(a:Amenity){setEditingAmenity(a.id);setAmenityForm({name:a.name,category:a.category,travel_minutes:a.travel_minutes?.toString()||'',distance_km:a.distance_km?.toString()||'',note:a.note||'',image_url:a.image_url||''});setAmenityFile(null)}
  async function saveAmenity(){if(!editing) return; if(!amenityForm.name.trim()){setMessage('Vui lòng nhập tên địa điểm.');return}setBusy(true);try{let imageUrl=amenityForm.image_url||null;if(amenityFile){imageUrl=await uploadOne(amenityFile)}const payload={property_id:editing,name:amenityForm.name.trim(),category:amenityForm.category||'Tiện ích & địa điểm',travel_minutes:amenityForm.travel_minutes===''?null:Number(amenityForm.travel_minutes),distance_km:amenityForm.distance_km===''?null:Number(amenityForm.distance_km),note:amenityForm.note.trim()||null,image_url:imageUrl,sort_order:editingAmenity?(amenities.find(x=>x.id===editingAmenity)?.sort_order||0):amenities.length};const r=editingAmenity?await s.from('property_amenities').update(payload).eq('id',editingAmenity):await s.from('property_amenities').insert(payload);if(r.error)throw r.error;setMessage('Đã lưu địa điểm và hình ảnh.');setAmenityForm(emptyAmenity);setAmenityFile(null);setEditingAmenity(null);loadAmenities(editing)}catch(e:any){setMessage(e?.message||'Có lỗi khi lưu địa điểm.')}finally{setBusy(false)}}
  async function removeAmenity(id:string){if(!confirm('Xóa địa điểm này?'))return;const r=await s.from('property_amenities').delete().eq('id',id);if(r.error)setMessage(r.error.message);else loadAmenities(editing||'')}

  async function uploadOne(file:File){const ext=file.name.split('.').pop()?.toLowerCase()||'jpg';const path=`properties/${crypto.randomUUID()}.${ext}`;const {error}=await s.storage.from('media').upload(path,file,{contentType:file.type});if(error)throw error;return s.storage.from('media').getPublicUrl(path).data.publicUrl}
  async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage('');try{
    if(files.length>(MAX_IMAGES-existingImages.length)) throw new Error(`BĐS này chỉ được tối đa ${MAX_IMAGES} ảnh. Bạn đang chọn ${files.length} ảnh nhưng chỉ còn ${MAX_IMAGES-existingImages.length} vị trí.`)
    const uploaded=await Promise.all(files.map(uploadOne));
    const firstImage=existingImages[0]?.image_url||uploaded[0]||form.image_url||'';
    const payload={...form,image_url:firstImage,project_id:form.project_id||null};
    const r=editing?await s.from('properties').update(payload).eq('id',editing):await s.from('properties').insert(payload).select('id').single();
    if(r.error)throw r.error;
    const propertyId=editing||(r.data as {id:string})?.id;if(!propertyId)throw new Error('Không lấy được ID bất động sản.');
    if(uploaded.length){
      let start=existingImages.length
      if(editing&&existingImages.length===0&&form.image_url){
        const legacy=await s.from('property_images').insert({property_id:propertyId,image_url:form.image_url,sort_order:0}).select('id,image_url,sort_order').single()
        if(legacy.error)throw legacy.error
        start=1
      }
      const rows=uploaded.map((url,i)=>({property_id:propertyId,image_url:url,sort_order:start+i}));const ir=await s.from('property_images').insert(rows);if(ir.error)throw ir.error
    }
    if(!editing&&firstImage){await s.from('properties').update({image_url:firstImage}).eq('id',propertyId)}
    setMessage(editing?'Đã cập nhật BĐS và ảnh.':'Đã thêm BĐS và ảnh.');reset();load(projectFilter)
  }catch(e:any){setMessage(e?.message||'Có lỗi.')}finally{setBusy(false)}}
  async function removeImage(id:string){if(!confirm('Xóa ảnh này khỏi BĐS?'))return;const {error}=await s.from('property_images').delete().eq('id',id);if(error)setMessage(error.message);else if(editing){const next=existingImages.filter(x=>x.id!==id);setExistingImages(next);await s.from('properties').update({image_url:next[0]?.image_url||null}).eq('id',editing);setForm(f=>({...f,image_url:next[0]?.image_url||''}))}}
  async function remove(id:string){if(!confirm('Xóa bất động sản này?'))return;const {error}=await s.from('properties').delete().eq('id',id);if(error)setMessage(error.message);else load(projectFilter)}
  return <main className="container section"><div className="admin-top"><div><div className="eyebrow">PROPERTIES</div><h1>{editing?'Sửa bất động sản':'Bất động sản'}</h1><p>Quản lý từng BĐS bên trong dự án.</p></div><div className="actions-row"><a className="btn" href="/admin/projects">← Dự án</a>{(projectFilter||form.project_id)&&<a className="btn btn-primary" href={`/admin/projects/${projectFilter||form.project_id}/content`}>⚙ Quản lý Landing dự án</a>}{editing&&<button className="btn" type="button" onClick={reset}>Hủy</button>}</div></div>
    <form className="card form-grid" onSubmit={save}>
      <select className="input" value={form.project_id} onChange={e=>{const value=e.target.value;setForm({...form,project_id:value});setProjectFilter(value);}}><option value="">-- Chưa gắn dự án --</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <input className="input" placeholder="Tên BĐS *" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/>
      <input className="input" placeholder="Vị trí *" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} required/>
      <input className="input" placeholder="Giá" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/>
      <select className="input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="draft">Nháp</option><option value="published">Công khai</option><option value="sold">Đã bán</option></select>
      <div className="full"><label className="editor-label">Mô tả bất động sản</label><RichTextEditor key={editing||'new'} value={form.description} onChange={description=>setForm({...form,description})} placeholder="Soạn nội dung như Word: in đậm, nghiêng, màu chữ, highlight, tiêu đề, danh sách, link, xuống dòng..."/></div>
      <div className="full image-manager"><div className="image-manager-head"><div><label className="editor-label">Hình ảnh BĐS</label><p className="field-help">Tối đa {MAX_IMAGES} ảnh. Có thể chọn nhiều ảnh cùng lúc.</p></div><span className="image-count">{existingImages.length + files.length}/{MAX_IMAGES}</span></div>
        {existingImages.length>0&&<div className="image-grid-admin">{existingImages.map((img,i)=><div className="image-tile" key={img.id}><img src={img.image_url} alt={`Ảnh ${i+1}`}/><span>Ảnh {i+1}</span><button type="button" onClick={()=>removeImage(img.id)} aria-label="Xóa ảnh">×</button></div>)}</div>}
        <input className="input" type="file" accept="image/*" multiple onChange={e=>{const chosen=Array.from(e.target.files||[]);const remaining=MAX_IMAGES-existingImages.length;if(chosen.length>remaining){setMessage(`Chỉ có thể chọn thêm ${remaining} ảnh (tối đa ${MAX_IMAGES}).`);setFiles(chosen.slice(0,remaining))}else{setMessage('');setFiles(chosen)}}}/>
        {files.length>0&&<div className="new-files-note">Đã chọn thêm {files.length} ảnh: {files.map(f=>f.name).join(', ')}</div>}
      </div>
      <div className="full amenities-manager amenities-manager-prominent v14-amenity-section">
        <div className="image-manager-head">
          <div><label className="editor-label">📍 TIỆN ÍCH & ĐIỂM XUNG QUANH — V14</label><p className="field-help">Thêm ảnh các địa điểm du lịch, chùa, cafe, trường học, bệnh viện, cao tốc... và khoảng cách từ BĐS.</p></div>
          <span className="image-count">{amenities.length} địa điểm</span>
        </div>
        {!editing ? <div className="empty amenity-save-first">Hãy lưu BĐS trước, sau đó mở lại BĐS để thêm tiện ích & điểm xung quanh.</div> : <>
          <div className="amenity-toolbar"><button type="button" className="btn btn-primary" onClick={()=>{setEditingAmenity(null);setAmenityFile(null);setAmenityForm(emptyAmenity)}}>＋ Thêm tiện ích / điểm du lịch</button></div>
          <div className="amenity-form-card">
            <div className="amenity-form-image">
              {amenityForm.image_url?<img src={amenityForm.image_url} alt="Ảnh địa điểm"/>:<div className="amenity-image-empty">🖼️ Chọn ảnh địa điểm</div>}
              <input className="input" type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0]||null;setAmenityFile(f);if(f)setAmenityForm({...amenityForm,image_url:URL.createObjectURL(f)})}}/>
            </div>
            <div className="amenity-fields">
              <input className="input" placeholder="Tên địa điểm, ví dụ: Chùa Di Đà *" value={amenityForm.name} onChange={e=>setAmenityForm({...amenityForm,name:e.target.value})}/>
              <select className="input" value={amenityForm.category} onChange={e=>setAmenityForm({...amenityForm,category:e.target.value})}><option>Du lịch</option><option>Tâm linh</option><option>Tiện ích</option><option>Ăn uống</option><option>Thư giãn</option><option>Giao thông</option><option>Dịch vụ</option><option>Giáo dục</option><option>Y tế</option><option>Khác</option></select>
              <input className="input" type="number" min="0" placeholder="Số phút" value={amenityForm.travel_minutes} onChange={e=>setAmenityForm({...amenityForm,travel_minutes:e.target.value})}/>
              <input className="input" type="number" min="0" step="0.1" placeholder="Khoảng cách (km)" value={amenityForm.distance_km} onChange={e=>setAmenityForm({...amenityForm,distance_km:e.target.value})}/>
              <input className="input" placeholder="Ghi chú" value={amenityForm.note} onChange={e=>setAmenityForm({...amenityForm,note:e.target.value})}/>
              <div className="actions-row"><button type="button" className="btn btn-primary" onClick={saveAmenity} disabled={busy}>{editingAmenity?'Lưu tiện ích':'Lưu tiện ích'}</button>{editingAmenity&&<button type="button" className="btn" onClick={()=>{setEditingAmenity(null);setAmenityFile(null);setAmenityForm(emptyAmenity)}}>Hủy</button>}</div>
            </div>
          </div>
          {amenities.length>0&&<div className="amenity-list">{amenities.map(a=><div className="amenity-admin-row" key={a.id}>{a.image_url?<img src={a.image_url} alt={a.name}/>:<div className="amenity-admin-thumb-empty">🖼️</div>}<div><b>{a.name}</b><small>{a.category}{a.note?` · ${a.note}`:''}</small></div><div className="amenity-meta">{a.travel_minutes!=null&&<strong>🚗 {a.travel_minutes} phút</strong>}{a.distance_km!=null&&<span>📍 {a.distance_km} km</span>}</div><div className="actions-row"><button type="button" className="btn" onClick={()=>editAmenity(a)}>Sửa</button><button type="button" className="btn" onClick={()=>removeAmenity(a.id)}>Xóa</button></div></div>)}</div>}
        </>}
      </div>
      <div className="full actions-row"><button className="btn btn-primary" disabled={busy}>{busy?'Đang lưu...':editing?'Lưu thay đổi':'Thêm BĐS'}</button></div>{message&&<div className="full success">{message}</div>}
    </form>
    <div className="grid-auto">{items.map(x=><article className="card admin-project" key={x.id}>{x.image_url?<img src={x.image_url} alt={x.title}/>:<div className="placeholder">BẤT ĐỘNG SẢN</div>}<div><div className="eyebrow">{x.status}</div><h3>{x.title}</h3><p>{x.location} · {x.price||'Liên hệ'}</p><div className="actions-row">{x.project_id&&<a className="btn" href={`/admin/projects/${x.project_id}/content`}>Landing</a>}<button className="btn" onClick={()=>edit(x)}>Sửa</button><button className="btn" onClick={()=>remove(x.id)}>Xóa</button></div></div></article>)}</div>
  </main>
}
