'use client'
import Link from 'next/link'
import {useEffect,useState, type ReactNode} from 'react'
import {supabaseBrowser} from '@/lib/supabase'

type Settings={brand_name:string;tagline:string;phone:string;zalo_url:string;facebook_url:string;logo_url:string|null}
const fallback:Settings={brand_name:'TÂN DŨNG SALES',tagline:'Bất động sản & Du lịch',phone:'0900000000',zalo_url:'https://zalo.me/0900000000',facebook_url:'https://facebook.com/',logo_url:null}

export default function SiteShell({children}:{children:ReactNode}){
 const [settings,setSettings]=useState<Settings>(fallback)
 useEffect(()=>{
   supabaseBrowser().from('site_settings').select('*').eq('id',1).single().then(({data})=>{
     if(data) setSettings({...fallback,...data})
   })
 },[])

 return <>
   <header className="nav">
     <div className="container nav-inner">
       <Link href="/" className="brand-wrap" aria-label={settings.brand_name}>
         {settings.logo_url ? (
           <img src={settings.logo_url} alt={settings.brand_name} className="site-logo-header" />
         ) : (
           <span className="brand-mark"><i className="bi bi-buildings-fill" /></span>
         )}
         <span className="brand">
           {settings.brand_name.replace(/\s+SALES$/i,'')}
           <em>SALES</em>
           <small>{settings.tagline}</small>
         </span>
       </Link>
       <nav aria-label="Điều hướng chính">
         <Link href="/#du-an-lon">Dự án</Link>
         <Link href="/#du-lich">Du lịch</Link>
         <Link href="/#tu-van">Liên hệ</Link>
         <Link href="/admin">Quản trị</Link>
       </nav>
     </div>
   </header>
   {children}
   <footer className="footer">
     <div className="container footer-grid">
       <div className="brand-wrap">
         {settings.logo_url ? <img src={settings.logo_url} alt={settings.brand_name} className="site-logo-footer"/> : null}
         <span className="brand">{settings.brand_name}<em>SALES</em><small>{settings.tagline}</small></span>
       </div>
       <div className="footer-note">Tư vấn dự án • BĐS • Tour du lịch · <a href={settings.facebook_url} target="_blank" rel="noreferrer"><i className="bi bi-facebook"/> Facebook</a></div>
     </div>
   </footer>
   <div className="mobile-cta"><a href={`tel:${settings.phone.replace(/\s/g,'')}`}><i className="bi bi-telephone-fill"/> Gọi ngay</a><a href={settings.zalo_url} target="_blank" rel="noreferrer"><b>Z</b> Zalo</a></div>
 </>
}
