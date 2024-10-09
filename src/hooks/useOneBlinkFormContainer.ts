import { createContext, useContext } from 'react'

type OneBlinkFormContainerContextValue = HTMLElement | null

export const OneBlinkFormContainerContext =
  createContext<OneBlinkFormContainerContextValue>(null)

export default function useOneBlinkFormContainer() {
  return useContext(OneBlinkFormContainerContext)
}
