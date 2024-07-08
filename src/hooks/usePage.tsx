import * as React from 'react'

type PageContextValue = {
  isPageVisible: boolean
  pageId: string
}

type Props = {
  isPageVisible: PageContextValue['isPageVisible']
  pageId: PageContextValue['pageId']
  children: React.ReactNode
}

const PageContext = React.createContext<PageContextValue>({
  isPageVisible: false,
  pageId: '',
})

export function PageProvider({ isPageVisible, pageId, children }: Props) {
  const value = React.useMemo(
    () => ({
      isPageVisible,
      pageId,
    }),
    [isPageVisible, pageId],
  )

  return <PageContext.Provider value={value}>{children}</PageContext.Provider>
}

export default function usePage() {
  return React.useContext(PageContext)
}
