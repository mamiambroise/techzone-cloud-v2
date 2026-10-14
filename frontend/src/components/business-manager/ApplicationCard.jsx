import { AppWindow, ArrowUpRight } from 'lucide-react';
import BMStatusBadge from './BMStatusBadge.jsx';
export function ApplicationCard({app,onClick}) {
 const date=app.updatedAt&&Number.isFinite(Date.parse(app.updatedAt))?new Date(app.updatedAt).toLocaleDateString('fr-FR'):null;
 return <article className="flex min-w-0 flex-col rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition-[transform,box-shadow,border-color] duration-150 ease-out hover:-translate-y-px hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0">
 <div className="flex items-start gap-3"><span className="rounded-lg bg-blue-50 p-2.5 text-blue-500"><AppWindow size={20}/></span><div className="min-w-0 flex-1"><button onClick={onClick} className="max-w-full text-left text-sm font-bold text-[var(--color-text)] hover:text-[var(--color-primary)]"><span className="block truncate">{app.name||app.code}</span></button>{app.code&&<p className="mt-1 truncate text-[10px] tracking-wide text-[var(--color-text-muted)]">{app.code}</p>}</div></div>
 {app.description&&<p className="mt-4 line-clamp-3 text-xs leading-relaxed text-[var(--color-text-muted)]">{app.description}</p>}
 <div className="mt-auto flex flex-wrap items-center gap-2 pt-5"><BMStatusBadge status={app.status}/>{date&&<time dateTime={app.updatedAt} className="ml-auto text-[11px] text-[var(--color-text-muted)]">Modifiée le {date}</time>}</div>
 <div className="mt-4 border-t border-[var(--color-border)] pt-3"><button onClick={onClick} className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary)] transition-colors duration-150 ease-out hover:text-[var(--color-primary-hover)] motion-reduce:transition-none">Ouvrir l’application<ArrowUpRight size={14}/></button></div>
 </article>;
}
