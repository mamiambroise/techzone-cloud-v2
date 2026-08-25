"use client";

import React from "react";
import { ShoppingBag, UtensilsCrossed, Wrench, GraduationCap, Pill, Hotel, Sparkles, Package, Layers, Store, Car, Building2, Briefcase, Boxes, HeartPulse, Activity, FileText, Database, Workflow, ShieldCheck, Code2, LayoutGrid, Zap, Globe, Settings } from "lucide-react";
export const ICON_MAP = {
  ShoppingBag,
  Store,
  UtensilsCrossed,
  Wrench,
  Car,
  GraduationCap,
  Pill,
  HeartPulse,
  Hotel,
  Building2,
  Briefcase,
  Sparkles,
  Package,
  Layers,
  Boxes,
  Activity,
  FileText,
  Database,
  Workflow,
  ShieldCheck,
  Code2,
  LayoutGrid,
  Zap,
  Globe,
  Settings
};
export function IconRenderer({
  name,
  className = "w-5 h-5"
}) {
  const IconComponent = name && ICON_MAP[name] ? ICON_MAP[name] : Package;
  return <IconComponent className={className} />;
}