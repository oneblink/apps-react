import * as React from 'react'

export const EditableFormElementIdsContext = React.createContext<
  string[] | undefined
>(undefined)

export default function useEditableFormElementIds(): string[] | undefined {
  return React.useContext(EditableFormElementIdsContext)
}
