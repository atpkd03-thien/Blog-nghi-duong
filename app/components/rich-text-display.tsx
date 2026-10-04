function escapeHtml(value:string){return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}
function sanitize(html:string){
  const allowed=html.replace(/<!--([\s\S]*?)-->/g,'')
    .replace(/<\/?(script|style|iframe|object|embed|form|input|textarea|button|svg|math)[^>]*>/gi,'')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,'')
    .replace(/(href|src)\s*=\s*["']\s*javascript:[^"']*["']/gi,'$1="#"')
  return allowed
}
export default function RichTextDisplay({html,className='rich-output'}:{html?:string|null;className?:string}){
  const raw=html||''
  const safe=raw.includes('<')?sanitize(raw):escapeHtml(raw).replace(/\n/g,'<br/>')
  return <div className={className} dangerouslySetInnerHTML={{__html:safe}} />
}
