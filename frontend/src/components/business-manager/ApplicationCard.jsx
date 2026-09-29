import { AppWindow, ArrowUpRight } from 'lucide-react';
import BMStatusBadge from './BMStatusBadge.jsx';
export function ApplicationCard({app,onClick}) {
 const date=app.updatedAt&&Number.isFinite(Date.parse(app.updatedAt))?new Date(app.updatedAt).toLocaleDateString('fr-FR'):null;
 return <article className="flex min-w-0 flex-col rounded-xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-[transform,box-shadow,border-color] duration-150 ease-out hover:-translate-y-px hover:border-slate-300 hover:shadow-sm motion-reduce:transition-none motion-reduce:hover:translate-y-0">
 <div className="flex items-start gap-3"><span className="rounded-lg bg-blue-50 p-2.5 text-blue-500"><AppWindow size={20}/></span><div className="min-w-0 flex-1"><button onClick={onClick} className="max-w-full text-left text-sm font-bold text-slate-900 hover:text-blue-600"><span className="block truncate">{app.name||app.code}</span></button>{app.code&&<p className="mt-1 truncate text-[10px] tracking-wide text-slate-400">{app.code}</p>}</div></div>
 {app.description&&<p className="mt-4 line-clamp-3 text-xs leading-relaxed text-slate-500">{app.description}</p>}
 <div className="mt-auto flex flex-wrap items-center gap-2 pt-5"><BMStatusBadge status={app.status}/>{date&&<time dateTime={app.updatedAt} className="ml-auto text-[11px] text-slate-400">Modifiée le {date}</time>}</div>
 <div className="mt-4 border-t border-slate-100 pt-3"><button onClick={onClick} className="flex items-center gap-1.5 text-xs font-medium text-blue-600 transition-colors duration-150 ease-out hover:text-blue-700 motion-reduce:transition-none">Ouvrir l’application<ArrowUpRight size={14}/></button></div>
 </article>;
}
