import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Layers, ChevronLeft, ChevronRight, ChevronDown, X, Search, MoreVertical, LogOut } from 'lucide-react';
import { toggleSidebarCollapsed } from '../store/platformSlice.js';
import { navigationSections, navigationGroups, groupEntries, activeNavigation } from '../app/navigationConfig.js';
import { canAccess } from '../app/navigationAccess.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import { resolveNavigationIcon } from '../app/navigationIcons.js';
const accents = {dashboard:'text-blue-600',bm:'text-blue-600',ui:'text-violet-500',automation:'text-orange-500',packs:'text-indigo-500',runtime:'text-emerald-600',data:'text-teal-600',erp:'text-cyan-600',api:'text-blue-500'};
export default function Sidebar({ isOpen, onClose }) {
 const dispatch=useDispatch(), storedCollapsed=useSelector(state=>state.platform.sidebarCollapsed);
 const collapsed=storedCollapsed&&!isOpen;
 const {user,logout}=useAuth(); const {pathname}=useLocation(); const active=activeNavigation(pathname);
 const [expanded,setExpanded]=useState({}), [search,setSearch]=useState(''), [userMenu,setUserMenu]=useState(false);
 const name=user?.displayName || user?.name || user?.username || 'Utilisateur';
 const role=typeof user?.role==='string'?user.role:user?.isAdmin?'Administrateur':null;
 useEffect(()=>{setExpanded(active?{[active.group]:true}:{});setUserMenu(false);},[pathname,active?.group]);
 useEffect(()=>{if(!isOpen)return;const close=e=>{if(e.key==='Escape')onClose();};const previous=document.body.style.overflow;document.body.style.overflow='hidden';window.addEventListener('keydown',close);return()=>{document.body.style.overflow=previous;window.removeEventListener('keydown',close);};},[isOpen,onClose]);
 const query=search.trim().toLocaleLowerCase();
 return <>
 {isOpen&&<div data-testid="sidebar-overlay" onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" aria-hidden="true"/>}
 <aside id="main-sidebar" aria-label="Navigation principale" className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white text-slate-800 lg:translate-x-0 ${isOpen?'translate-x-0':'-translate-x-full'} ${collapsed?'w-20':'w-72'}`}>
 <div className="shrink-0 px-4 pt-5 pb-4"><div className="flex items-center gap-2.5"><Layers className="h-7 w-7 shrink-0 text-blue-600"/>{!collapsed&&<div className="min-w-0 flex-1"><p className="text-sm font-bold tracking-tight">Techzone Cloud</p><p className="mt-0.5 text-[10px] text-slate-500">Plateforme SaaS intégrée</p></div>}<button id="sidebar-collapse-toggle" onClick={()=>dispatch(toggleSidebarCollapsed())} className="hidden rounded p-1 text-slate-400 hover:bg-slate-50 transition-colors duration-150 ease-out motion-reduce:transition-none lg:block" aria-label={collapsed?'Agrandir le menu':'Réduire le menu'}>{collapsed?<ChevronRight size={16}/>:<ChevronLeft size={16}/>}</button><button onClick={onClose} className="lg:hidden" aria-label="Fermer le menu"><X size={18}/></button></div>
 {!collapsed&&<div className="relative mt-5"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input aria-label="Rechercher dans le menu" type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…" className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"/></div>}</div>
 <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 pb-4 [scrollbar-width:thin]">
 {navigationSections.map(section=>{
 const groups=navigationGroups.filter(g=>g.section===section.id&&!g.hidden).map(g=>{const available=groupEntries(g.id).filter(e=>canAccess(e,user));const matches=g.label.toLocaleLowerCase().includes(query);return {...g,entries:available.filter(e=>!query||matches||e.label.toLocaleLowerCase().includes(query))};}).filter(g=>g.entries.length);
 if(!groups.length)return null;
 return <section key={section.id} aria-label={section.label}><h2 className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400" title={section.label}>{collapsed?section.label.slice(0,3):section.label}</h2>{groups.map(group=>{
 const Icon=resolveNavigationIcon(group.icon), entries=group.entries, destination=entries.find(e=>e.component||e.redirectTo)?.route;
 const children=entries.length>1||group.id==='bm', open=!!query||expanded[group.id], planned=entries.every(e=>!e.implemented);
 return <div key={group.id} data-navigation-group={group.id} className="mb-0.5"><div className={`flex items-center rounded-lg ${active?.group===group.id?'bg-blue-50/70':'hover:bg-slate-50 transition-colors duration-150 ease-out motion-reduce:transition-none'}`}>
 <Link to={destination} title={group.label} aria-label={group.label} onClick={onClose} aria-current={!children&&active?.group===group.id?'page':undefined} className="flex min-w-0 flex-1 items-center gap-2.5 px-2 py-2 text-[13px] font-medium"><Icon className={`h-[18px] w-[18px] shrink-0 ${accents[group.id]||'text-slate-500'}`}/>{!collapsed&&<><span className="min-w-0 flex-1">{group.label}</span>{planned&&<span className="rounded-full bg-orange-50 px-1.5 py-0.5 text-[9px] font-medium text-orange-600">Bientôt</span>}</>}</Link>
 {!collapsed&&children&&<button aria-label={`Sous-menu ${group.label}`} aria-expanded={!!open} aria-controls={`submenu-${group.id}`} onClick={()=>setExpanded(v=>({...v,[group.id]:!open}))} className="p-2 text-slate-400"><ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ease-out motion-reduce:transition-none ${open?'rotate-180':''}`}/></button>}</div>
 {!collapsed&&children&&open&&<ul id={`submenu-${group.id}`} className="my-1 ml-4 space-y-0.5 border-l border-slate-200 pl-3">{entries.map(entry=><li key={entry.id}><Link to={entry.route} onClick={onClose} aria-current={active?.id===entry.id?'page':undefined} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs ${active?.id===entry.id?'bg-blue-50 font-semibold text-blue-700':'text-slate-600 hover:bg-slate-50 transition-colors duration-150 ease-out motion-reduce:transition-none'}`}>{active?.id===entry.id&&<span className="h-1 w-1 shrink-0 rounded-full bg-blue-600"/>}{entry.label}</Link></li>)}</ul>}</div>;
 })}</section>;
 })}
 {query&&!navigationGroups.some(g=>!g.hidden&&groupEntries(g.id).some(e=>canAccess(e,user)&&(g.label+' '+e.label).toLocaleLowerCase().includes(query)))&&<p className="p-2 text-xs text-slate-500">Aucun résultat.</p>}
 </nav>
 <div className="relative shrink-0 border-t border-slate-100 p-3">{userMenu&&<div className="absolute bottom-full left-3 right-3 mb-2 rounded-lg border border-slate-200 bg-white p-1 shadow-sm"><button onClick={()=>logout()} className="flex w-full items-center gap-2 rounded p-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors duration-150 ease-out motion-reduce:transition-none"><LogOut size={15}/>Se déconnecter</button></div>}<div className="flex items-center gap-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">{name.split(/\s+/).slice(0,2).map(v=>v[0]).join('').toUpperCase()}</span>{!collapsed&&<><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{name}</p>{role&&<p className="truncate text-[11px] text-slate-500">{role}</p>}</div><button aria-label="Menu utilisateur" aria-expanded={userMenu} onClick={()=>setUserMenu(!userMenu)} className="rounded p-1 text-slate-400 hover:bg-slate-50 transition-colors duration-150 ease-out motion-reduce:transition-none"><MoreVertical size={18}/></button></>}</div></div>
 </aside><div aria-hidden="true" className={`hidden shrink-0 lg:block ${storedCollapsed?'w-20':'w-72'}`}/></>;
}
