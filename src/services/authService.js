const USERS_KEY = 'medifind_users'
const SESSION_KEY = 'medifind_current_user'

const demoAdmin = {
	id: 'demo-admin',
	fullName: 'MediFind Administrator',
	email: 'admin@medifind.tz',
	phone: '+255 700 000 001',
	password: 'Admin123!',
	role: 'ADMIN',
	createdAt: '2026-01-01T00:00:00.000Z',
}

const readStorage = (key, fallback) => {
	try {
		const value = localStorage.getItem(key)
		return value ? JSON.parse(value) : fallback
	} catch {
		return fallback
	}
}

const readUsers = () => {
	const storedUsers = readStorage(USERS_KEY, [])
	const users = Array.isArray(storedUsers) ? storedUsers : []
	if (users.some((user) => user.role === 'ADMIN')) return users
	const seededUsers = [...users, demoAdmin]
	writeUsers(seededUsers)
	return seededUsers
}
const writeUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users))

const publicUser = ({ password, ...user }) => user
const createUserId = () => globalThis.crypto?.randomUUID?.() || `user-${Date.now()}-${Math.random().toString(36).slice(2)}`

export const registerUser = async (userDetails) => {
	const users = readUsers()
	const fullName = userDetails.fullName?.trim()
	const normalizedEmail = userDetails.email?.trim().toLowerCase()
	const phone = userDetails.phone?.trim()
	const password = userDetails.password || ''
	const role = userDetails.role
	if (!fullName || !normalizedEmail || !phone || password.length < 8) {
		throw new Error('Please complete all fields with a password of at least 8 characters.')
	}
	if (!['PATIENT', 'PHARMACY_STAFF'].includes(role)) {
		throw new Error('Choose a valid account type.')
	}
	if (users.some((user) => user.email === normalizedEmail)) {
		throw new Error('An account with this email already exists.')
	}

	const user = {
		id: createUserId(),
		fullName,
		email: normalizedEmail,
		phone,
		password,
		role,
		...(role === 'PHARMACY_STAFF' ? { pharmacyId: 'afya-pharmacy' } : {}),
		createdAt: new Date().toISOString(),
	}
	writeUsers([...users, user])
	return publicUser(user)
}

export const loginUser = async ({ email, password }) => {
	const user = readUsers().find((item) => item.email === email.trim().toLowerCase() && item.password === password)
	if (!user) throw new Error('Email or password is incorrect.')

	const sessionUser = publicUser(user)
	localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))
	return sessionUser
}

export const getCurrentUser = () => readStorage(SESSION_KEY, null)

export const logoutUser = () => localStorage.removeItem(SESSION_KEY)
