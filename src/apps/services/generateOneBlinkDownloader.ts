import { OneBlinkDownloader } from '@oneblink/storage'
import { getIdToken } from './forms-key'
import tenants from '../tenants'

export default function generateOneBlinkDownloader() {
  return new OneBlinkDownloader({
    apiOrigin: tenants.current.apiOrigin,
    region: tenants.current.awsRegion,
    getBearerToken: getIdToken,
  })
}
