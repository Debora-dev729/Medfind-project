export const mapPharmacy = (pharmacy) => ({
	id: pharmacy.id,
	name: pharmacy.name,
	city: pharmacy.city,
	address: pharmacy.address,
	coordinates: { latitude: pharmacy.latitude, longitude: pharmacy.longitude },
	phone: pharmacy.phone,
	hours: pharmacy.hours,
	distance: Number.POSITIVE_INFINITY,
	verified: pharmacy.verified,
})

export const mapAvailability = (availability) => {
	const updatedAt = Date.parse(availability.updatedAt)
	const ageInHours = Number.isFinite(updatedAt) ? Math.max(0, (Date.now() - updatedAt) / 3600000) : Infinity
	const updated = ageInHours < 1
		? 'just now'
		: ageInHours < 24
			? `${Math.floor(ageInHours)} hours ago`
			: `${Math.floor(ageInHours / 24)} days ago`

	return { ...availability, updated, ageInHours }
}