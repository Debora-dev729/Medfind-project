import { mockMedicines } from '../data/mockMedicines'
import { mockPharmacies } from '../data/mockPharmacies'

const INVENTORY_KEY = 'medifind_inventory'

const readInventory = () => {
	try {
		const value = localStorage.getItem(INVENTORY_KEY)
		const inventory = value ? JSON.parse(value) : {}
		return inventory && typeof inventory === 'object' ? inventory : {}
	} catch {
		return {}
	}
}

const writeInventory = (inventory) => localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory))

const getDefaultInventory = (pharmacyId) => {
	const pharmacy = mockPharmacies.find((item) => item.id === pharmacyId)
	if (!pharmacy) return []

	return Object.entries(pharmacy.medicines).map(([medicineId, availability]) => ({
		medicine: mockMedicines.find((item) => item.id === medicineId),
		availability,
	}))
}

export const getInventory = async (pharmacyId = 'afya-pharmacy') => {
	const savedInventory = readInventory()[pharmacyId] || {}
	return getDefaultInventory(pharmacyId).map((item) => ({
		...item,
		availability: { ...item.availability, ...(savedInventory[item.medicine.id] || {}) },
	}))
}

export const updateInventoryItem = async (pharmacyId, medicineId, updates) => {
	const quantity = Math.max(0, Number(updates.quantity) || 0)
	const inventory = readInventory()
	inventory[pharmacyId] = {
		...(inventory[pharmacyId] || {}),
		[medicineId]: {
			  ...updates,
			  quantity,
			  status: quantity === 0 ? 'OUT_OF_STOCK' : quantity <= 5 ? 'LOW_STOCK' : 'AVAILABLE',
			updated: 'just now',
			ageInHours: 0,
		},
	}
	writeInventory(inventory)
	return getInventory(pharmacyId)
}

export const getInventoryOverrides = (pharmacyId) => readInventory()[pharmacyId] || {}
