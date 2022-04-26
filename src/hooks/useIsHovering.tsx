import * as React from 'react'
import useBooleanState from './useBooleanState'

const IsHoveringContext = React.createContext<boolean>(false)

export const IsHoveringProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(function IsHoveringProvider(props: React.ComponentProps<'div'>, ref) {
  const [isHovering, startHovering, stopHovering] = useBooleanState(false)

  return (
    <IsHoveringContext.Provider value={isHovering}>
      <div
        {...props}
        onMouseEnter={startHovering}
        onMouseLeave={stopHovering}
        ref={ref}
      />
    </IsHoveringContext.Provider>
  )
})

export function useIsHovering() {
  return React.useContext(IsHoveringContext)
}

export default IsHoveringContext
