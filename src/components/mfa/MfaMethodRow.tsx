import { memo } from 'react'
import { Box, Button, Chip, Grid, Tooltip, Typography } from '@mui/material'
import { authService } from '../../apps'
import useMfa from '../../hooks/useMfa'

type Props = {
  method: authService.MfaSetupMethod
  title: string
  description: string
  detail?: string
  cypressPrefix: string
  extraButtons?: React.ReactNode
}

function MfaMethodRow({
  method,
  title,
  description,
  detail,
  cypressPrefix,
  extraButtons,
}: Props) {
  const {
    mfaSettings,
    isSettingUpMfa,
    settingUpMfaMethod,
    loadingError,
    beginMfaSetup,
    beginDisablingMfaMethod,
    setPreferredMfaMethod,
  } = useMfa()

  const methodSettings =
    method === 'authenticator' ? mfaSettings?.authenticator : mfaSettings?.sms
  const isEnabled = !!methodSettings?.enabled
  const isPreferred = !!methodSettings?.preferred
  const isSettingUpThisMethod = isSettingUpMfa && settingUpMfaMethod === method

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
                color="info"
                sx={{ ml: 1 }}
                data-cypress={`${cypressPrefix}-status-chip`}
              />
            )}
            {isPreferred && (
              <Chip
                size="small"
                label="Preferred"
                color="success"
                sx={{ ml: 1 }}
                data-cypress={`${cypressPrefix}-preferred-chip`}
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
                    onClick={() => setPreferredMfaMethod(method)}
                    data-cypress={`${cypressPrefix}-set-preferred-button`}
                  >
                    Set as Preferred
                  </Button>
                )}
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => beginDisablingMfaMethod(method)}
                  data-cypress={`${cypressPrefix}-disable-button`}
                >
                  Disable
                </Button>
              </>
            ) : (
              <Tooltip
                title={
                  loadingError
                    ? 'We are unable to load your MFA status. Please try again by clicking the reload button on the chip above.'
                    : ''
                }
              >
                <span>
                  <Button
                    size="small"
                    variant="contained"
                    loading={isSettingUpThisMethod}
                    disabled={
                      !!loadingError || isSettingUpMfa || isSettingUpThisMethod
                    }
                    onClick={() => beginMfaSetup(method)}
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
    </Box>
  )
}

export default memo(MfaMethodRow)
