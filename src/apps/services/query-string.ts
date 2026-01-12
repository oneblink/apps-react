export function formatQueryString(obj: Record<string, unknown>): string {
  const params = Object.entries(obj).reduce<URLSearchParams>(
    (memo, [key, value]) => {
      if (value === undefined || value === null) {
        return memo
      }

      if (Array.isArray(value)) {
        value.forEach((val) => memo.append(key, val))
      } else {
        memo.append(key, String(value))
      }
      return memo
    },
    new URLSearchParams(),
  )
  return params.toString()
}
