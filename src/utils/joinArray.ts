export function joinArray<T>(arr: T[], type?: Intl.ListFormatType): string {
  const listFormat = new Intl.ListFormat('en', {
    type,
  })
  return listFormat.format(arr as string[])
}
