import { OneBlinkUploader } from '@oneblink/storage'
import { getIdToken } from './forms-key'
import tenants from '../tenants'

export default function generateOneBlinkUploader() {
  return new OneBlinkUploader({
    apiOrigin: tenants.current.apiOrigin,
    region: tenants.current.awsRegion,
    getBearerToken: getIdToken,
  })
}
