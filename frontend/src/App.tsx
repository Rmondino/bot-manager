import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage from './features/dashboard/pages/DashboardPage'
import LeadsPage from './features/leads/pages/LeadsPage'
import LeadDetailPage from './features/leads/pages/LeadDetailPage'
import HistorialPage from './features/historial/pages/HistorialPage'
import ConfigPage from './features/config/pages/ConfigPage'
import CompanyInfoPage from './features/company_info/pages/CompanyInfoPage'
import CamposLeadPage from './features/campos_lead/pages/CamposLeadPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/leads/:id" element={<LeadDetailPage />} />
        <Route path="/historial" element={<HistorialPage />} />
        <Route path="/config" element={<ConfigPage />} />
        <Route path="/company-info" element={<CompanyInfoPage />} />
        <Route path="/campos-lead" element={<CamposLeadPage />} />
      </Route>
    </Routes>
  )
}
