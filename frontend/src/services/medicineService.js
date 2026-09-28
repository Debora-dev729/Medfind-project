import { mockMedicines } from '../data/mockMedicines'
import { mockPharmacies } from '../data/mockPharmacies'
import { getInventoryOverrides } from './inventoryService'

const waitForMockResponse = (value) => new Promise((resolve) => {
  window.setTimeout(() => resolve(value), 250)
})

const getMedicineAvailability = (medicineId) => mockPharmacies
  .filter((pharmacy) => pharmacy.medicines[medicineId])
  .map((pharmacy) => ({
    pharmacy: {
      ...pharmacy,
      medicines: {
        ...pharmacy.medicines,
        [medicineId]: { ...pharmacy.medicines[medicineId], ...(getInventoryOverrides(pharmacy.id)[medicineId] || {}) },
      },
    },
    availability: { ...pharmacy.medicines[medicineId], ...(getInventoryOverrides(pharmacy.id)[medicineId] || {}) },
  }))

export const searchMedicines = async (query = '') => {
  const normalizedQuery = query.trim().toLowerCase()
  const results = mockMedicines.flatMap((medicine) => {
    const medicineMatches = `${medicine.name} ${medicine.strength} ${medicine.form}`.toLowerCase().includes(normalizedQuery)
    const availability = getMedicineAvailability(medicine.id)
    const matchingAvailability = availability.filter(({ pharmacy }) => `${pharmacy.name} ${pharmacy.city} ${pharmacy.address}`.toLowerCase().includes(normalizedQuery))
    if (!normalizedQuery || medicineMatches) return [{ ...medicine, availability }]
    if (matchingAvailability.length) return [{ ...medicine, availability: matchingAvailability }]
    return []
  })

  return waitForMockResponse(results)
}

export const getMedicineById = async (id) => {
  const medicine = mockMedicines.find((item) => item.id === id)
  if (!medicine) return waitForMockResponse(null)

  return waitForMockResponse({
    ...medicine,
    availability: getMedicineAvailability(medicine.id),
  })
}
