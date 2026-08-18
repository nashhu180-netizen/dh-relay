/** Return true only for values representable by ordinary JSON. */
export function isPlainJson(value, seen = new Set()) {
  if (value === null) return true

  switch (typeof value) {
    case 'string':
    case 'boolean':
      return true
    case 'number':
      return Number.isFinite(value)
    case 'object':
      break
    default:
      return false
  }

  if (seen.has(value)) return false
  seen.add(value)

  if (Array.isArray(value)) {
    const result = value.every(item => isPlainJson(item, seen))
    seen.delete(value)
    return result
  }

  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) {
    seen.delete(value)
    return false
  }

  const result = Reflect.ownKeys(value).every(key => (
    typeof key === 'string'
    && Object.prototype.propertyIsEnumerable.call(value, key)
    && isPlainJson(value[key], seen)
  ))
  seen.delete(value)
  return result
}
