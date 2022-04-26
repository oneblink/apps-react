import * as React from 'react'
import querystring, { ParsedQuery } from 'query-string'
import { useLocation } from 'react-router-dom'
export default function useQuery(): ParsedQuery {
  const location = useLocation()
  return React.useMemo(
    () => querystring.parse(location.search.substring(1)),
    [location.search],
  )
}
