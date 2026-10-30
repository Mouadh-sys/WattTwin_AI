import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SimulationProvider } from './context/SimulationContext';
import { AppLayout } from './components/layout/AppLayout';
import { OverviewPage } from './pages/OverviewPage';
import { DigitalTwinPage } from './pages/DigitalTwinPage';
import { ExperimentsPage } from './pages/ExperimentsPage';
import { EnergyAnalyticsPage } from './pages/EnergyAnalyticsPage';
import { DataTrustSecurityPage } from './pages/DataTrustSecurityPage';
import { AiAgentPage } from './pages/AiAgentPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { AuditHistoryPage } from './pages/AuditHistoryPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <SimulationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="digital-twin" element={<DigitalTwinPage />} />
            <Route path="experiments" element={<ExperimentsPage />} />
            <Route path="energy-analytics" element={<EnergyAnalyticsPage />} />
            <Route path="security" element={<DataTrustSecurityPage />} />
            <Route path="agent" element={<AiAgentPage />} />
            <Route path="recommendations" element={<RecommendationsPage />} />
            <Route path="audit" element={<AuditHistoryPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SimulationProvider>
  );
}
