'use client'
import Link from 'next/link'
import {useEffect,useState} from 'react'
import {supabaseBrowser} from '@/lib/supabase'

type Settings={brand_name:string;tagline:string;phone:string;zalo_url:string;facebook_url:string;logo_url:string|null}
const defaults:Settings={brand_name:'TÂN DŨNG SALES',tagline:'Bất động sản & Du lịch',phone:'0900000000',zalo_url:'https://zalo.me/0900000000',facebook_url:'https://facebook.com/',logo_url:null}

function storagePath(url:string|null){
  if(!url) return null
  const marker='/storage/v1/object/public/media/'
  const i=url.indexOf(marker)
  return i>=0 ? decodeURIComponent(url.slice(i+marker.length)) : null
}

export default function Settings(){
 const [form,setForm]=useState<Settings>(defaults)
 const [message,setMessage]=useState('')
 const [busy,setBusy]=useState(false)
 const [logoFile,setLogoFile]=useState<File|null>(null)

 useEffect(()=>{
   supabaseBrowser().from('site_settings').select('*').eq('id',1).single().then(({data})=>{
     if(data)setForm({...defaults,...data})
   })
 },[])

 async function uploadLogo(){
   if(!logoFile) return form.logo_url
   const ext=logoFile.name.split('.').pop()?.toLowerCase()||'png'
   const path=`site/logo-${crypto.randomUUID()}.${ext}`
   const s=supabaseBrowser()
   const {error}=await s.storage.from('media').upload(path,logoFile,{upsert:false,contentType:logoFile.type})
   if(error) throw error
   return s.storage.from('media').getPublicUrl(path).data.publicUrl
 }

 async function save(e:React.FormEvent){
   e.preventDefault()
   setBusy(true);setMessage('')
   try{
     const oldUrl=form.logo_url
     const logo_url=await uploadLogo()
     const s=supabaseBrowser()
     const {error}=await s.from('site_settings').upsert({...form,id:1,logo_url,updated_at:new Date().toISOString()})
     if(error) throw error
     if(logoFile && oldUrl && oldUrl!==logo_url){
       const oldPath=storagePath(oldUrl)
       if(oldPath) await s.storage.from('media').remove([oldPath])
     }
     setForm({...form,logo_url})
     setLogoFile(null)
     setMessage('Đã lưu cài đặt website.')
   }catch(e:any){
     setMessage(e?.message||'Có lỗi khi lưu cài đặt.')
   }finally{setBusy(false)}
 }

 async function removeLogo(){
   setBusy(true);setMessage('')
   try{
     const s=supabaseBrowser()
     const oldPath=storagePath(form.logo_url)
     if(oldPath) await s.storage.from('media').remove([oldPath])
     const {error}=await s.from('site_settings').update({logo_url:null,updated_at:new Date().toISOString()}).eq('id',1)
     if(error) throw error
     setForm({...form,logo_url:null})
     setLogoFile(null)
     setMessage('Đã xóa logo.')
   }catch(e:any){setMessage(e?.message||'Không thể xóa logo.')}finally{setBusy(false)}
 }

 return <main className="container section">
   <div className="admin-top">
     <div><div className="eyebrow">WEBSITE</div><h1>Cài đặt thương hiệu & liên hệ</h1><p>Thay đổi thông tin hiển thị trên website mà không cần sửa code.</p></div>
     <Link className="btn" href="/admin">← Dashboard</Link>
   </div>
   <form className="settings-card" onSubmit={save}>
     <div className="settings-section"><div className="settings-icon"><i className="bi bi-person-lines-fill"/></div><div><h3>Thông tin thương hiệu</h3><p>Tên, tagline và thông tin liên hệ.</p></div></div>
     <div className="form-grid compact">
       <label>Tên thương hiệu<input className="input" value={form.brand_name} onChange={e=>setForm({...form,brand_name:e.target.value})}/></label>
       <label>Tagline<input className="input" value={form.tagline} onChange={e=>setForm({...form,tagline:e.target.value})}/></label>
       <label>Số điện thoại<input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
       <label>Link Zalo<input className="input" value={form.zalo_url} onChange={e=>setForm({...form,zalo_url:e.target.value})}/></label>
       <label className="full">Link Facebook<input className="input" value={form.facebook_url} onChange={e=>setForm({...form,facebook_url:e.target.value})}/></label>
     </div>

     <div className="settings-section mt-4"><div className="settings-icon"><i className="bi bi-image"/></div><div><h3>Logo website</h3><p>Upload, thay thế hoặc xóa logo. Logo được lưu trong Storage và quản lý từ đây.</p></div></div>
     <div className="logo-crud-box">
       <div className="logo-preview-box">
         {form.logo_url ? <img src={form.logo_url} alt="Logo hiện tại" className="settings-logo-preview"/> : <div className="logo-empty"><i className="bi bi-image"/> Chưa có logo</div>}
       </div>
       <div className="logo-actions">
         <label className="btn btn-outline-primary mb-0"><i className="bi bi-upload"/> {form.logo_url ? 'Chọn logo mới' : 'Upload logo'}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={e=>setLogoFile(e.target.files?.[0]||null)}/></label>
         {form.logo_url && <button type="button" className="btn btn-outline-danger" onClick={removeLogo} disabled={busy}><i className="bi bi-trash"/> Xóa logo</button>}
         {logoFile && <div className="small text-muted">Đã chọn: {logoFile.name}</div>}
       </div>
     </div>

     <div className="settings-preview">
       <div className="preview-brand">{form.logo_url ? <img src={form.logo_url} alt="" className="settings-preview-logo"/> : <span className="brand-mark"><i className="bi bi-buildings-fill"/></span>}<strong>{form.brand_name||'TÂN DŨNG SALES'}</strong></div>
       <div className="preview-links"><a href={form.phone?`tel:${form.phone.replace(/\s/g,'')}`:'#'}><i className="bi bi-telephone-fill"/> {form.phone||'Chưa nhập số'}</a><a href={form.zalo_url||'#'} target="_blank" rel="noreferrer"><b>Z</b> Zalo</a><a href={form.facebook_url||'#'} target="_blank" rel="noreferrer"><i className="bi bi-facebook"/> Facebook</a></div>
     </div>
     {message&&<div className={message.startsWith('Đã')?'success':'error'}>{message}</div>}
     <button className="btn btn-primary" disabled={busy}>{busy?'Đang lưu...':'Lưu cài đặt'}</button>
   </form>
 </main>
}
