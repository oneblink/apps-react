import * as React from 'react'
import MaterialIcon from '../MaterialIcon'

type Props = {
  label: string
  icon?: string
}

const CustomisableButton = ({ label, icon }: Props) => {
  return (
    <>
      <span className="ob-customisable-button-inner">
        {!!icon && <MaterialIcon>{icon}</MaterialIcon>}
        <span>{label}</span>
      </span>
    </>
  )
}

export default React.memo<Props>(CustomisableButton)
