export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

/**
 * Returns `next`, but with any arrays or plain objects that are deeply equal to
 * the matching value in `previous` replaced by the instance from `previous`. If
 * `next` is deeply equal to `previous`, `previous` is returned. This keeps
 * object identities stable across renders so memoised components can bail out
 * of rendering when their slice of a large computed object has not changed.
 *
 * The name, borrowed from TanStack Query's equivalent function, reads as
 * "replace equal values, deeply": it is not an equality check, it returns a
 * value in which unchanged parts are replaced by their previous instances
 * (structural sharing).
 */
export default function replaceEqualDeep<T>(previous: unknown, next: T): T {
  if (previous === next) {
    return previous as T
  }

  if (Array.isArray(previous) && Array.isArray(next)) {
    let equalItems = 0
    const result = next.map((item, index) => {
      const sharedItem = replaceEqualDeep(previous[index], item)
      if (sharedItem === previous[index]) {
        equalItems++
      }
      return sharedItem
    })
    if (previous.length === next.length && equalItems === next.length) {
      return previous as T
    }
    return result as T
  }

  if (isPlainObject(previous) && isPlainObject(next)) {
    const previousKeys = Object.keys(previous)
    const nextKeys = Object.keys(next)
    let equalItems = 0
    const result: Record<string, unknown> = {}
    for (const key of nextKeys) {
      const sharedItem = replaceEqualDeep(previous[key], next[key])
      if (sharedItem === previous[key] && key in previous) {
        equalItems++
      }
      result[key] = sharedItem
    }
    if (
      previousKeys.length === nextKeys.length &&
      equalItems === nextKeys.length
    ) {
      return previous as T
    }
    return result as T
  }

  return next
}
