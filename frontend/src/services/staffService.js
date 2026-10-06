import api from './api'

export const getPharmacyStaff = async () => {
  const response = await api.get('/admin/staff')
  return response.data
}

export const createPharmacyStaff = async (staff) => {
  const response = await api.post('/admin/staff', staff)
  return response.data
}

export const resetPharmacyStaffPassword = async (id) => {
  const response = await api.post(`/admin/staff/${id}/reset-password`)
  return response.data
}

export const updatePharmacyStaff = async (id, staff) => {
  const response = await api.put(`/admin/staff/${id}`, staff)
  return response.data
}

export const setPharmacyStaffActive = async (id, active) => {
  const response = await api.patch(`/admin/staff/${id}/active`, { active })
  return response.data
}

export const deletePharmacyStaff = async (id) => {
  await api.delete(`/admin/staff/${id}`)
}