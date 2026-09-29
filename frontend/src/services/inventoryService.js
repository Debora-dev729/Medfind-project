import api from './api'

export const getInventory = async (pharmacyId) => {
  if (!pharmacyId) {
    throw new Error('Pharmacy is not assigned to this account.')
  }

  const response = await api.get(`/pharmacies/${pharmacyId}/inventory`)

  return response.data
}

export const updateInventoryItem = async (
  pharmacyId,
  medicineId,
  updates,
) => {
  if (!pharmacyId) {
    throw new Error('Pharmacy is not assigned to this account.')
  }

  const response = await api.put(
    `/pharmacies/${pharmacyId}/inventory/${medicineId}`,
    {
      quantity: Number(updates.quantity),
      price:
        updates.price === '' || updates.price == null
          ? null
          : Number(updates.price),
    },
  )

  return response.data
}

