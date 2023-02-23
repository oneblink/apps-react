const WYSIWYGRegex = /({ELEMENT:)([^}]+)(})/g

export default function matchElementsRegex(
  str: string,
  matchHandler: (elementName: string) => void,
) {
  let matches
  while ((matches = WYSIWYGRegex.exec(str)) !== null) {
    if (matches?.length < 3) continue

    const elementName = matches[2]
    matchHandler(elementName)
  }
}
