import api from './api'

const getErrorMessage = (error) => {
  const status = error.response?.status
  const backendMessage = error.response?.data?.message

  if (status === 401) return 'Your session has expired. Please log in again.'
  if (status === 403) return 'You do not have permission to perform this action.'
  if (status === 404) return 'The requested reservation, medicine or pharmacy was not found.'
  if (status === 409) return backendMessage || 'Reservation conflict. The pharmacy may be closed or you already have an active reservation.'
  if (backendMessage) return backendMessage

  return 'Something went wrong. Please try again.'
}

export const createReservation = async (reservation) => {
  try {
    const response = await api.post('/reservations', {
      pharmacyId: reservation.pharmacyId,
      medicineId: reservation.medicineId,
      quantity: reservation.quantity,
    })
    return response.data
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}

export const getMyReservations = async (patientId) => {
  try {
    const response = await api.get(`/reservations/patient/${patientId}`)
    return response.data
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}

export const getPharmacyReservations = async (pharmacyId) => {
  try {
    const response = await api.get(`/reservations/pharmacy/${pharmacyId}`)
    return response.data
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}

export const updateReservationStatus = async (reservationId, status) => {
  try {
    const response = await api.patch(`/reservations/${reservationId}/status`, { status })
    return response.data
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}

export const cancelReservation = async (reservationId) => {
  try {
    const response = await api.patch(`/reservations/${reservationId}/cancel`)
    return response.data
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}
