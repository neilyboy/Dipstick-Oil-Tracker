import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { VehicleDetail } from './pages/VehicleDetail';
import { VehicleForm } from './pages/VehicleForm';
import { ServiceForm } from './pages/ServiceForm';
import { ServiceDetail } from './pages/ServiceDetail';
import { InventoryList } from './pages/InventoryList';
import { InventoryForm } from './pages/InventoryForm';
import { InventoryDetail } from './pages/InventoryDetail';
import { ReceiptDetail } from './pages/ReceiptDetail';
import { SettingsPage } from './pages/Settings';
import { RemindersPage } from './pages/Reminders';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/vehicles/new" element={<VehicleForm />} />
        <Route path="/vehicles/:id" element={<VehicleDetail />} />
        <Route path="/vehicles/:id/edit" element={<VehicleForm />} />
        <Route path="/vehicles/:vehicleId/services/new" element={<ServiceForm />} />
        <Route path="/vehicles/:vehicleId/services/:id/edit" element={<ServiceForm />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/inventory" element={<InventoryList />} />
        <Route path="/inventory/new" element={<InventoryForm />} />
        <Route path="/inventory/:id" element={<InventoryDetail />} />
        <Route path="/inventory/:id/edit" element={<InventoryForm />} />
        <Route path="/receipts/:id" element={<ReceiptDetail />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/reminders" element={<RemindersPage />} />
      </Routes>
    </Layout>
  );
}
