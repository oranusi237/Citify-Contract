export const formatNaira = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return ''

  return `₦${Number(digits).toLocaleString('en-NG')}`
}

export const parseNairaAmount = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits ? Number(digits) : 0
}
