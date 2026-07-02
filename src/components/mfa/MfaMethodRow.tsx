import { memo } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  Tooltip,
  Typography,
} from '@mui/material'

type Props = {
  isEnabled: boolean
  isPreferred: boolean
  isUsedForLogin: boolean
  isSettingUp: boolean
  isSettingPreferredMfaMethod: boolean
  isSetupDisabled: boolean
  showSetupErrorTooltip?: boolean
  title: string
  description: string
  detail?: string
  mfaRequirementMessage?: string
  mfaRequirementMessageIsWarning?: boolean
  cypressPrefix: string
  extraButtons?: React.ReactNode
  onSetup: () => void
  onDisable: () => void
  onSetPreferred: () => void
}

function MfaMethodRow({
  isEnabled,
  isPreferred,
  isUsedForLogin,
  isSettingUp,
  isSettingPreferredMfaMethod,
  isSetupDisabled,
  showSetupErrorTooltip,
  title,
  description,
  detail,
  mfaRequirementMessage,
  mfaRequirementMessageIsWarning,
  cypressPrefix,
  extraButtons,
  onSetup,
  onDisable,
  onSetPreferred,
}: Props) {
  return (
    <Box data-cypress={`${cypressPrefix}-method-row`}>
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 'grow' }}>
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle1" component="span">
              {title}
            </Typography>
            {isEnabled && (
              <Chip
                size="small"
                label="Enabled"
                color="default"
                sx={{ ml: 1 }}
                data-cypress={`${cypressPrefix}-status-chip`}
              />
            )}
            {isPreferred && (
              <Chip
                size="small"
                label="Preferred"
                color="info"
                sx={{ ml: 1 }}
                data-cypress={`${cypressPrefix}-preferred-chip`}
              />
            )}
            {isUsedForLogin && (
              <Chip
                size="small"
                label="Used for login"
                color="success"
                sx={{ ml: 1 }}
                data-cypress={`${cypressPrefix}-used-for-login-chip`}
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
          {!!detail && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {detail}
            </Typography>
          )}
        </Grid>
        <Grid size="auto">
          <Box display="flex" gap={1} flexWrap="wrap" justifyContent="flex-end">
            {extraButtons}
            {isEnabled ? (
              <>
                {!isPreferred && (
                  <Button
                    size="small"
                    variant="outlined"
                    loading={isSettingPreferredMfaMethod}
                    disabled={isSettingPreferredMfaMethod}
                    onClick={onSetPreferred}
                    data-cypress={`${cypressPrefix}-set-preferred-button`}
                  >
                    Set as Preferred
                  </Button>
                )}
                <Button
                  size="small"
                  variant="outlined"
                  onClick={onDisable}
                  data-cypress={`${cypressPrefix}-disable-button`}
                >
                  Disable
                </Button>
              </>
            ) : (
              <Tooltip
                title={
                  showSetupErrorTooltip
                    ? 'We are unable to load your MFA status. Please try again by clicking the reload button on the chip above.'
                    : ''
                }
              >
                <span>
                  <Button
                    size="small"
                    variant="contained"
                    loading={isSettingUp}
                    disabled={isSetupDisabled}
                    onClick={onSetup}
                    data-cypress={`${cypressPrefix}-setup-button`}
                  >
                    Setup
                  </Button>
                </span>
              </Tooltip>
            )}
          </Box>
        </Grid>
      </Grid>

      {!!mfaRequirementMessage && (
        <Alert
          severity={mfaRequirementMessageIsWarning ? 'warning' : 'info'}
          data-cypress={`${cypressPrefix}-mfa-requirement-message`}
        >
          {mfaRequirementMessage}
        </Alert>
      )}
    </Box>
  )
}

export default memo(MfaMethodRow)
