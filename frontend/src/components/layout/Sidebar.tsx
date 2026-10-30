import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  FlaskConical,
  LineChart,
  ShieldAlert,
  Bot,
  CheckSquare,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/digital-twin', label: 'Digital Twin', icon: Cpu },
    { to: '/experiments', label: 'Experiments', icon: FlaskConical },
    { to: '/energy-analytics', label: 'Energy Analytics', icon: LineChart },
    { to: '/security', label: 'Data Trust & OT Security', icon: ShieldAlert },
    { to: '/agent', label: 'AI Agent (MCP)', icon: Bot },
    { to: '/recommendations', label: 'Recommendations', icon: CheckSquare },
    { to: '/audit', label: 'Audit & History', icon: ScrollText },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col bg-[#080d16] border-r border-slate-800 transition-all duration-200 select-none z-30 ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Zap className="w-4 h-4 fill-cyan-400" />
            </div>
            <div className="truncate">
              <h1 className="text-sm font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
                <span>WattTwin AI</span>
              </h1>
              <p className="text-[10px] text-slate-400 truncate">NexaForge Industrial Intel</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Zap className="w-4 h-4 fill-cyan-400" />
          </div>
        )}
      </div>

      {/* Environment Marker */}
      <div className="px-4 py-2 border-b border-slate-800/80 bg-[#060910]">
        {!isCollapsed ? (
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">ENV:</span>
            <span className="text-cyan-400 font-semibold tracking-wider">SIMULATION</span>
          </div>
        ) : (
          <div className="text-center text-[9px] font-mono font-bold text-cyan-400">SIM</div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Operator Profile & Collapse Toggle */}
      <div className="p-3 border-t border-slate-800 bg-[#060a12]">
        {!isCollapsed ? (
          <div className="flex items-center justify-between mb-2">
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-200 truncate">M. Boukari</div>
              <div className="text-[10px] text-slate-400 truncate">Lead Automation Engineer</div>
            </div>
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
