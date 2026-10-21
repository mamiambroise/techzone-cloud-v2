import {
  Activity, BarChart3, Bell, Box, Boxes, BriefcaseBusiness, Building2, CheckCircle2, Circle, ClipboardList, Cloud, Cog,
  CreditCard, Database, Eye, FileSearch, FileText, Fingerprint, Gauge, GitBranch, History, Home,
  FormInput, Image as ImageIcon, KeyRound, Landmark, Layers, LayoutDashboard, LayoutGrid, Link2, Lock, Monitor, MonitorPlay, Navigation,
  Network, Package, Palette, PanelsTopLeft, Play, Plug, Puzzle, Receipt, RefreshCw, Rocket,
  ScrollText, Search, Server, Settings, ShieldAlert, ShieldCheck, SlidersHorizontal, Table2, Tag, Waypoints,
  Undo2, UploadCloud, Users, Webhook, Zap, ListChecks,
} from "lucide-react";

export const navigationIcons = {
  Activity, BarChart3, Bell, Box, Boxes, BriefcaseBusiness, Building2, CheckCircle2, Circle, ClipboardList, Cloud, Cog,
  CreditCard, Database, Eye, FileSearch, FileText, Fingerprint, Gauge, GitBranch, History, Home,
  FormInput, ImageIcon, KeyRound, Landmark, Layers, LayoutDashboard, LayoutGrid, Link2, Lock, Monitor, MonitorPlay, Navigation, Network,
  Package, Palette, PanelsTopLeft, Play, Plug, Puzzle, Receipt, RefreshCw, Rocket, ScrollText,
  Search, Server, Settings, ShieldAlert, ShieldCheck, SlidersHorizontal, Table2, Tag, Undo2, Waypoints,
  UploadCloud, Users, Webhook, Zap, ListChecks,
};

export const resolveNavigationIcon = (name) => navigationIcons[name] || Circle;
