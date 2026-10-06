import api from './api'

export const getAdminPharmacies = async (view = 'all') => {
  const response = await api.get('/admin/pharmacies', { params: { view } })
  return response.data
}

export const getAdminPharmacy = async (id) => {
  const response = await api.get(`/admin/pharmacies/${id}`)
  return response.data
}

export const createAdminPharmacy = async (pharmacy) => {
  const response = await api.post('/admin/pharmacies', pharmacy)
  return response.data
}

export const updateAdminPharmacy = async (id, pharmacy) => {
  const response = await api.put(`/admin/pharmacies/${id}`, pharmacy)
  return response.data
}

export const decidePharmacyApplication = async (id, decision) => {
  const response = await api.patch(`/admin/pharmacies/${id}/application`, { decision })
  return response.data
}

export const updatePharmacyPayment = async (id, status, reference) => {
  const response = await api.patch(`/admin/pharmacies/${id}/payment`, { status, reference })
  return response.data
}

export const updatePharmacyStatus = async (id, status) => {
  const response = await api.patch(`/admin/pharmacies/${id}/status`, { status })
  return response.data
}