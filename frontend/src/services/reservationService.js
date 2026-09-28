const RESERVATIONS_KEY = 'medifind_reservations'

const readReservations = () => {
	try {
		const value = localStorage.getItem(RESERVATIONS_KEY)
		const reservations = value ? JSON.parse(value) : []
		return Array.isArray(reservations) ? reservations : []
	} catch {
		return []
	}
}

const writeReservations = (reservations) => localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations))
const createReservationId = () => globalThis.crypto?.randomUUID?.() || `reservation-${Date.now()}-${Math.random().toString(36).slice(2)}`

export const createReservation = async (reservation) => {
	const reservations = readReservations()
	const existing = reservations.find((item) => item.patientId === reservation.patientId
		&& item.medicineId === reservation.medicineId
		&& item.pharmacyId === reservation.pharmacyId
		&& !['CANCELLED', 'COLLECTED'].includes(item.status))
	if (existing) throw new Error('You already have an active reservation for this medicine at this pharmacy.')

	const savedReservation = {
		...reservation,
		id: createReservationId(),
		status: 'PENDING',
		createdAt: new Date().toISOString(),
	}
	writeReservations([savedReservation, ...reservations])
	return savedReservation
}

export const getMyReservations = async (patientId) => readReservations().filter((reservation) => reservation.patientId === patientId)

export const getPharmacyReservations = async (pharmacyId) => readReservations().filter((reservation) => reservation.pharmacyId === pharmacyId)

export const updateReservationStatus = async (reservationId, status) => {
	const reservations = readReservations()
	const updatedReservations = reservations.map((reservation) => reservation.id === reservationId ? { ...reservation, status, updatedAt: new Date().toISOString() } : reservation)
	writeReservations(updatedReservations)
	return updatedReservations.find((reservation) => reservation.id === reservationId)
}
