import { createContext, useContext, RefObject, createRef } from 'react'

type OneBlinkFormContainerContextValue = RefObject<HTMLElement | null>

export const OneBlinkFormContainerContext =
  createContext<OneBlinkFormContainerContextValue>(createRef())

export default function useOneBlinkFormContainer() {
  return useContext(OneBlinkFormContainerContext)
}
