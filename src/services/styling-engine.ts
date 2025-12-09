export type RequiredKeyValuePair<
  T extends object,
  K extends keyof T = keyof T,
> = K extends unknown ? [K, NonNullable<T[K]>] : never

export type CssMappings<T extends object> = Record<
  keyof T,
  Record<string, string | number>
>

export type GenericCssMappings = Record<string, Record<string, string | number>>

export const objectEntriesAsTypedKeyValuePairs = <T extends object>(obj: T) => {
  return Object.entries(obj).reduce<RequiredKeyValuePair<T>[]>((memo, item) => {
    if (item[1] !== undefined) {
      memo.push(item as RequiredKeyValuePair<T>)
    }
    return memo
  }, [])
}

export const makeCssFromCssMappings = (cssMappings: GenericCssMappings) => {
  const cssBlocks: string[] = []

  Object.entries(cssMappings).forEach((item) => {
    const vals = Object.entries(item[1])
    if (vals.length) {
      const cssBlock = `
            ${item[0]} {
              ${vals.reduce((memo, item) => {
                return `${memo}
                  ${item[0]}: ${item[1]};`
              }, '')}
            }
          `

      cssBlocks.push(cssBlock)
    }
  })

  return cssBlocks.join('')
}

//  This can be used to throw a type error in a default switch clause if we forget to account for something in the cases.
export const cssMappingsNeverKeyLog = (key: never) => {
  console.log(
    'A key has been left unprocessed when applying css mappings for user defined styling. This should not have made it to production.',
    key,
  )
}
