import * as React from 'react'
import { userService } from '@oneblink/sdk-core'
import { UserProfile } from '@oneblink/types/typescript/misc'
import { Chip, Avatar } from '@mui/material'
import {
  AccountCircle,
  VpnKey as KeyIcon,
  Help as HelpIcon,
} from '@mui/icons-material'
import TableCellCopyButton from './TableCellCopyButton'

function ActionedByTableCell({
  userProfile,
  developerKey,
  ...rest
}: React.ComponentProps<typeof Chip> & {
  userProfile?: UserProfile
  developerKey?: { name: string }
}) {
  const chipProps = useActionedByChipProps({
    userProfile,
    developerKey,
    ...rest,
  })

  return (
    <>
      <Chip {...chipProps} {...rest} />
      <TableCellCopyButton text={chipProps.label} />
    </>
  )
}

export default React.memo(ActionedByTableCell)

function useActionedByChipProps({
  userProfile,
  developerKey,
}: React.ComponentProps<typeof Chip> & {
  userProfile?: UserProfile
  developerKey?: { name: string }
}): {
  label: string
  icon?: React.ComponentProps<typeof Chip>['icon']
  avatar?: React.ComponentProps<typeof Chip>['avatar']
} {
  return React.useMemo(() => {
    if (userProfile) {
      const emptyChipProps: {
        label: string
        icon?: React.ComponentProps<typeof Chip>['icon']
        avatar?: React.ComponentProps<typeof Chip>['avatar']
      } = {
        label: '',
      }

      if (userProfile.picture) {
        emptyChipProps.avatar = (
          <Avatar alt={userProfile.fullName} src={userProfile.picture} />
        )
      } else {
        emptyChipProps.icon = <AccountCircle />
      }

      emptyChipProps.label = userService.getUserFriendlyName(userProfile)
      return emptyChipProps
    }

    if (developerKey) {
      return {
        icon: <KeyIcon />,
        label: developerKey.name,
      }
    }

    return {
      icon: <HelpIcon />,
      label: 'Anonymous',
    }
  }, [developerKey, userProfile])
}
