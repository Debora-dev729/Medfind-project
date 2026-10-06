import api from './api'

function mapPharmacy(pharmacy) {
  return {
    ...pharmacy,
    coordinates: {
      latitude: pharmacy.latitude,
      longitude: pharmacy.longitude,
    },
    distance: Number.POSITIVE_INFINITY,
  }
}

function mapMedicineResult(item, pharmacies) {
  const medicine = item.medicine

  return {
    ...medicine,
    availability: (item.availability || [])
      .filter((availability) => availability.quantity > 0 && availability.status !== 'OUT_OF_STOCK')
      .map((availability) => {
        const pharmacy = pharmacies.find(
          (item) => item.id === availability.pharmacyId,
        )

        if (!pharmacy) return null

        return {
          pharmacy: mapPharmacy(pharmacy),
          availability: {
            ...availability,
            medicineName: medicine.name,
            medicineStrength: medicine.strength,
            updated: availability.updatedAt
              ? formatUpdatedTime(availability.updatedAt)
              : 'Recently',
            ageInHours: getAgeInHours(availability.updatedAt),
          },
        }
      })
      .filter(Boolean),
  }
}

function getAgeInHours(updatedAt) {
  if (!updatedAt) return 0

  const updatedTime = new Date(updatedAt).getTime()

  if (Number.isNaN(updatedTime)) return 0

  return Math.max(0, (Date.now() - updatedTime) / (1000 * 60 * 60))
}

function formatUpdatedTime(updatedAt) {
  if (!updatedAt) return 'Recently'

  const updatedTime = new Date(updatedAt).getTime()

  if (Number.isNaN(updatedTime)) return 'Recently'

  const ageInHours = getAgeInHours(updatedAt)

  if (ageInHours < 1) {
    const minutes = Math.max(1, Math.round(ageInHours * 60))
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }

  if (ageInHours < 24) {
    const hours = Math.round(ageInHours)
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }

  const days = Math.round(ageInHours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

async function getPharmacies() {
  const response = await api.get('/pharmacies')
  return response.data
}

async function getMedicineResults() {
  const [medicineResponse, pharmacyResponse] = await Promise.all([
    api.get('/medicines'),
    getPharmacies(),
  ])

  return medicineResponse.data.map((item) =>
    mapMedicineResult(item, pharmacyResponse),
  )
}

export async function searchMedicines(query = '') {
  const [medicineResponse, pharmacyResponse] = await Promise.all([
    api.get('/medicines', {
      params: query.trim() ? { query: query.trim() } : {},
    }),
    getPharmacies(),
  ])

  return medicineResponse.data.map((item) =>
    mapMedicineResult(item, pharmacyResponse),
  )
}

export async function getMedicineById(id) {
  const results = await getMedicineResults()
  return results.find((medicine) => medicine.id === id) || null
}
