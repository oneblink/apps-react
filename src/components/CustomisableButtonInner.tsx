import * as React from 'react'
type Props = {
  label: string
  icon?: string
}

const CustomisableButton = ({ label, icon }: Props) => {
  return (
    <>
      <span
        style={{ display: 'flex', gap: '8px' }}
        className="ob-customisable-button-inner"
      >
        {!!icon && <i className="material-icons">{icon}</i>}
        <span>{label}</span>
      </span>
    </>
  )
}

export default React.memo<Props>(CustomisableButton)
