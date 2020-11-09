import Quagga from 'quagga'

const BARCODE_TYPES = [
  'code_128_reader',
  'ean_reader',
  'ean_8_reader',
  'code_39_reader',
  'code_39_vin_reader',
  'codabar_reader',
  'upc_reader',
  'upc_e_reader',
  'i2of5_reader',
  '2of5_reader',
  'code_93_reader',
]

export default function (imgData: string, barcodeTypes: string[] | void) {
  return new Promise((resolve) => {
    Quagga.decodeSingle(
      {
        decoder: {
          readers: (barcodeTypes && barcodeTypes.length
            ? barcodeTypes
            : BARCODE_TYPES
          ).filter((type) => type !== 'qr_reader'),
        },
        locate: true, // try to locate the barcode in the image
        src: imgData,
      },
      function (result: any) {
        if (result && result.codeResult) {
          resolve(result.codeResult.code)
        } else {
          resolve()
        }
      },
    )
  })
}
