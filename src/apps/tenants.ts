interface OneBlinkAppsTenant {
  awsRegion: string
  loginDomain: string
  apiOrigin: string
  vapidPublicKey: string
  intlFormats: {
    number: Intl.NumberFormat
    currency: Intl.NumberFormat
    date: Intl.DateTimeFormat
    dateLong: Intl.DateTimeFormat
    time: Intl.DateTimeFormat
    olderIOSTime: Intl.DateTimeFormat
  }
  name: string
  productShortName: string
  distanceUnit: string
  distanceUnitShortName: string
}
type Locale = 'en-AU' | 'en-US'

const getCurrency = (locale: Locale) => {
  switch (locale) {
    case 'en-US':
      return 'USD'
    case 'en-AU':
    default:
      return 'AUD'
  }
}

const generateFormatters = (locale: Locale) => {
  return {
    number: new Intl.NumberFormat(locale, {
      style: 'decimal',
      maximumFractionDigits: 20,
    }),
    currency: new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: getCurrency(locale),
    }),
    date: new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }),
    dateLong: new Intl.DateTimeFormat(locale, {
      dateStyle: 'full',
    }),
    time: new Intl.DateTimeFormat(locale, {
      timeStyle: 'short',
    }),
    olderIOSTime: new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }),
  }
}

const tenants = {
  test: {
    oneblink: {
      awsRegion: 'ap-southeast-2',
      loginDomain: 'login.test.oneblink.io',
      apiOrigin: 'https://auth-api.test.blinkm.io',
      vapidPublicKey:
        'BE5wtYdaQW3z7DWc08rzNlOwPuituVWFRLW_lUMD78ZJatFOjio8fYDHaIpQCRyeKsJ5j4kLaFU374J4dM90iUc',
      intlFormats: generateFormatters('en-AU'),
      name: 'OneBlink',
      productShortName: 'OneBlink LcS',
      distanceUnit: 'meters',
      distanceUnitShortName: 'm',
    },
    civicplus: {
      awsRegion: 'us-east-2',
      loginDomain: 'login.test.transform.civicplus.com',
      apiOrigin: 'https://auth-api.test.transform.civicplus.com',
      vapidPublicKey:
        'BLg2Dn9sYj1a0I3AcS22Fg71uubdMLwoemG8zfnPOljgFKB-5MR3FIxc2Mtt0AzM3zk2QWl3YzEy6EEwIUmz19k',
      intlFormats: generateFormatters('en-US'),
      name: 'CivicPlus',
      productShortName: 'CivicOptimize',
      distanceUnit: 'feet',
      distanceUnitShortName: 'ft',
    },
  },
  prod: {
    oneblink: {
      awsRegion: 'ap-southeast-2',
      loginDomain: 'login.oneblink.io',
      apiOrigin: 'https://auth-api.blinkm.io',
      vapidPublicKey:
        'BADH0JnMngI0uFKUnbC79VGXy5d6WutccnEvVuFBMx--BrZtFAHGTgOBiABJXmE8_VHC92_jK5K-2qdP2kZeius',
      intlFormats: generateFormatters('en-AU'),
      name: 'OneBlink',
      productShortName: 'OneBlink LcS',
      distanceUnit: 'meters',
      distanceUnitShortName: 'm',
    },
    civicplus: {
      awsRegion: 'us-east-2',
      loginDomain: 'login.transform.civicplus.com',
      apiOrigin: 'https://auth-api.transform.civicplus.com',
      vapidPublicKey:
        'BLoDtCutrC7tEd75x89zBaIyz3Fk8AeWOcABasV3YO4Tei5UO8WjJVPFyilNLYxeseaiKlgoa0DOh1HoR59M_G4',
      intlFormats: generateFormatters('en-US'),
      name: 'CivicPlus',
      productShortName: 'CivicOptimize',
      distanceUnit: 'feet',
      distanceUnitShortName: 'ft',
    },
  },
}

class Tenants {
  tenant: 'oneblink' | 'civicplus'

  constructor() {
    this.tenant = 'oneblink'
  }

  get isTestEnvironment() {
    // @ts-expect-error
    return window.ONEBLINK_APPS_ENVIRONMENT === 'test'
  }

  get current(): OneBlinkAppsTenant {
    switch (this.tenant) {
      case 'civicplus':
        return this.isTestEnvironment
          ? tenants.test.civicplus
          : tenants.prod.civicplus
      case 'oneblink':
      default:
        return this.isTestEnvironment
          ? tenants.test.oneblink
          : tenants.prod.oneblink
    }
  }

  get locale() /* : string */ {
    switch (this.tenant) {
      case 'civicplus':
        return 'en-US'
      case 'oneblink':
      default:
        return 'en-AU'
    }
  }

  useOneBlink() {
    this.tenant = 'oneblink'
  }

  useCivicPlus() {
    console.log('triggered')
    this.tenant = 'civicplus'
  }
}

export default new Tenants()
