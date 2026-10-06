import { BrowserRouter, Route, Routes } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import Home from '../pages/Home'
import Search from '../pages/Search'
import MedicineDetails from '../pages/MedicineDetails'
import PharmacyDetails from '../pages/PharmacyDetails'
import Login from '../pages/Login'
import Register from '../pages/Register'
import ProtectedRoute from '../components/ProtectedRoute'
import PatientDashboard from '../pages/PatientDashboard'
import PharmacyDashboard from '../pages/PharmacyDashboard'
import ChangePassword from '../pages/ChangePassword'
import PharmacyInventory from '../pages/PharmacyInventory'
import AdminDashboard from '../pages/AdminDashboard'
import StaffManagement from '../pages/StaffManagement'
import PharmacyManagement from '../pages/PharmacyManagement'

function AppRoutes() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <PublicLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute roles={['PATIENT']} />}>
            <Route path="/search" element={<Search />} />
            <Route path="/medicines/:id" element={<MedicineDetails />} />
            <Route path="/pharmacies/:id" element={<PharmacyDetails />} />
          </Route>
          <Route element={<ProtectedRoute roles={['PATIENT']} />}>
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
          </Route>
          <Route element={<ProtectedRoute roles={['PHARMACY_STAFF']} />}>
            <Route path="/pharmacy/change-password" element={<ChangePassword />} />
            <Route path="/pharmacy/dashboard" element={<PharmacyDashboard />} />
            <Route path="/pharmacy/inventory" element={<PharmacyInventory />} />
          </Route>
          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/staff" element={<StaffManagement />} />
            <Route path="/admin/pharmacy-staff" element={<StaffManagement />} />
            <Route path="/admin/pharmacies" element={<PharmacyManagement />} />
            <Route path="/admin/pharmacies/new" element={<PharmacyManagement />} />
            <Route path="/admin/payments" element={<PharmacyManagement key="payments" initialFilter="payments" />} />
          </Route>
          <Route path="*" element={<Home />} />
        </Routes>
      </PublicLayout>
    </BrowserRouter>
  )
}

export default AppRoutes
