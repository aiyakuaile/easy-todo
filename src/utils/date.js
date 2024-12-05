export function formatDateTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const isThisYear = date.getFullYear() === now.getFullYear()
  
  const pad = (n) => n.toString().padStart(2, '0')
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  
  if (isToday) {
    return `${hours}:${minutes}`
  }
  
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  
  if (isThisYear) {
    return `${month}-${day} ${hours}:${minutes}`
  }
  
  const year = date.getFullYear()
  return `${year}-${month}-${day} ${hours}:${minutes}`
} 