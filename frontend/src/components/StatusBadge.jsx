const statusContent = {
  AVAILABLE: { label: 'Available', className: 'status-available', icon: '●' },
  LOW_STOCK: { label: 'Low stock', className: 'status-low', icon: '●' },
  OUT_OF_STOCK: { label: 'Out of stock', className: 'status-out', icon: '●' },
  PENDING: { label: 'Pending', className: 'status-pending', icon: '●' },
  CONFIRMED: { label: 'Order Confirmed', className: 'status-confirmed', icon: '●' },
  READY_FOR_COLLECTION: { label: 'Ready for collection', className: 'status-confirmed', icon: '●' },
  COLLECTED: { label: 'Collected', className: 'status-available', icon: '●' },
  CANCELLED: { label: 'Order Cancelled', className: 'status-out', icon: '●' },
  EXPIRED: { label: 'Order Expired', className: 'status-out', icon: '●' },
}

function StatusBadge({ status }) {
  const content = statusContent[status] || statusContent.OUT_OF_STOCK
  return <span className={`status-badge ${content.className}`}><span aria-hidden="true">{content.icon}</span>{content.label}</span>
}

export default StatusBadge
