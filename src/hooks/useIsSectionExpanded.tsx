import { createContext, ReactNode, useContext } from 'react'

type IsSectionExpandedContextValue = boolean

type Props = {
  isExpanded: IsSectionExpandedContextValue
  children: ReactNode
}

// Elements that are not in a section are always expanded
const IsSectionExpandedContext =
  createContext<IsSectionExpandedContextValue>(true)

/**
 * Collapsed sections keep their elements mounted but hidden, so this allows
 * elements to know if they are visible. A section is only considered expanded
 * if all of its ancestor sections are also expanded.
 */
export const IsSectionExpandedProvider = ({ isExpanded, children }: Props) => {
  const isParentSectionExpanded = useContext(IsSectionExpandedContext)
  return (
    <IsSectionExpandedContext.Provider
      value={isParentSectionExpanded && isExpanded}
    >
      {children}
    </IsSectionExpandedContext.Provider>
  )
}

const useIsSectionExpanded = () => {
  return useContext(IsSectionExpandedContext)
}

export default useIsSectionExpanded
