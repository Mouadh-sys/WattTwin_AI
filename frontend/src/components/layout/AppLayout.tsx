import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { NewExperimentModal } from '../experiments/NewExperimentModal';
import { useSimulation } from '../../context/SimulationContext';

export const AppLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNewExperimentModalOpen, setIsNewExperimentModalOpen] = useState(false);
  const { selectExperiment } = useSimulation();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0e17] text-slate-100 font-sans">
      {/* Persistent Left Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <TopHeader onOpenNewExperiment={() => setIsNewExperimentModalOpen(true)} />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* New Experiment Modal */}
      <NewExperimentModal
        isOpen={isNewExperimentModalOpen}
        onClose={() => setIsNewExperimentModalOpen(false)}
        onCreated={(id) => selectExperiment(id)}
      />
    </div>
  );
};
