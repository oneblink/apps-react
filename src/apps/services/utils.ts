import { createInstance } from 'localforage'
import _cloneDeep from 'lodash.clonedeep'

const localForage = createInstance({
  name: 'OneBlinkForms',
  storeName: 'FORMS_V1',
  description: 'Store of forms related data',
})

async function getLocalForageKeys(keyPrefix: string): Promise<string[]> {
  const keys = await localForage.keys()
  return keys.filter((key) => key.startsWith(keyPrefix))
}

function setValuesOnData<T>(
  key: string,
  items: Array<
    | {
        key: string
        value: unknown
      }
    | undefined
    | null
  >,
  data?: T,
) {
  if (!data) {
    return null
  }
  Object.keys(data).forEach((property) => {
    // @ts-expect-error
    const value = data[property]

    if (typeof value === 'string' && value.startsWith(key)) {
      const item = items.find((item) => item && item.key === value)
      // If we did not find the item that is suppose to be referenced
      // by the `key` property, we will remove the data as something has
      // gone wrong and the data has been lost to the IndexDB gods...
      // @ts-expect-error
      data[property] = item?.value
    } else if (value !== null && typeof value === 'object') {
      setValuesOnData(key, items, value)
    }
  })
  return data
}

async function getLocalForageItem<T>(key: string): Promise<T | null> {
  const localForageKeys = await getLocalForageKeys(key)

  const items = []
  for (const localForageKey of localForageKeys) {
    const item = await localForage.getItem<{
      key: string
      value: unknown
    }>(localForageKey)
    items.push(item)
  }
  const rootItem = items.find((item) => item && item.key === key)
  if (!rootItem || !rootItem.value) {
    return null
  }
  return setValuesOnData(key, items, rootItem.value as T)
}

function generateKeyValuesReducer(
  key: string,
  // eslint-disable-next-line @typescript-eslint/ban-types
  data: object,
  initialKeyValues: {
    keys: string[]
    items: Array<{
      key: string
      value: unknown
    }>
  },
) {
  if (data === null) {
    return
  }
  Object.keys(data).reduce((keyValues, property) => {
    // @ts-expect-error
    const value = data[property]

    if (
      (typeof value === 'string' && value.length > 25000) ||
      value instanceof Blob
    ) {
      const newKey = `${key}_${property}`
      keyValues.keys.push(newKey)
      keyValues.items.push({
        key: newKey,
        value,
      })
      // @ts-expect-error
      data[property] = newKey
    } else if (value !== null && typeof value === 'object') {
      generateKeyValuesReducer(`${key}_${property}`, value, keyValues)
    }
    return keyValues
  }, initialKeyValues)
}

// eslint-disable-next-line @typescript-eslint/ban-types
async function setLocalForageItem<T extends object>(
  key: string,
  originalData: T,
): Promise<T> {
  const data: T = _cloneDeep(originalData)
  await removeLocalForageItem(key)
  const keyValues = {
    keys: [key],
    items: [{ key, value: data }],
  }
  generateKeyValuesReducer(key, data, keyValues)
  for (const keyToSet of keyValues.keys) {
    const index = keyValues.keys.findIndex((k) => k === keyToSet)
    const item = keyValues.items[index]
    if (item) {
      await localForage.setItem(keyToSet, item)
    }
  }
  return originalData
}

async function removeLocalForageItem(key: string): Promise<void> {
  const keysToDelete = await getLocalForageKeys(key)
  for (const keyToDelete of keysToDelete) {
    await localForage.removeItem(keyToDelete)
  }
}

export default {
  localForage,
  getLocalForageItem,
  setLocalForageItem,
  removeLocalForageItem,
  getLocalForageKeys,
}
