import { mockPharmacies } from '../data/mockPharmacies'
import { mockMedicines } from '../data/mockMedicines'
import { getInventoryOverrides } from './inventoryService'

export const getPharmacyById = async (id) => {
  const pharmacy = mockPharmacies.find((item) => item.id === id)
  if (!pharmacy) return null
  const overrides = getInventoryOverrides(id)
  const medicines = Object.fromEntries(Object.entries(pharmacy.medicines).map(([medicineId, availability]) => [
    medicineId,
    { ...availability, ...(overrides[medicineId] || {}) },
  ]))

  return {
    ...pharmacy,
    medicines: Object.entries(medicines).map(([medicineId, availability]) => ({
      medicine: mockMedicines.find((item) => item.id === medicineId),
      availability,
    })),
  }
}

export const getNearbyPharmacies = async () => mockPharmacies.map((pharmacy) => ({
  ...pharmacy,
  medicines: Object.fromEntries(Object.entries(pharmacy.medicines).map(([medicineId, availability]) => [
    medicineId,
    { ...availability, ...(getInventoryOverrides(pharmacy.id)[medicineId] || {}) },
  ])),
}))
