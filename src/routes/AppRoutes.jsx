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
import PharmacyInventory from '../pages/PharmacyInventory'
import AdminDashboard from '../pages/AdminDashboard'

function AppRoutes() {
  return (
    <BrowserRouter>
      <PublicLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/medicines/:id" element={<MedicineDetails />} />
          <Route path="/pharmacies/:id" element={<PharmacyDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute roles={['PATIENT']} />}>
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
          </Route>
          <Route element={<ProtectedRoute roles={['PHARMACY_STAFF']} />}>
            <Route path="/pharmacy/dashboard" element={<PharmacyDashboard />} />
            <Route path="/pharmacy/inventory" element={<PharmacyInventory />} />
          </Route>
          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>
          <Route path="*" element={<Home />} />
        </Routes>
      </PublicLayout>
    </BrowserRouter>
  )
}

export default AppRoutes
