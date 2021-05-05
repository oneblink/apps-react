declare interface Navigator {
  camera?: {
    getPicture: (
      onSuccess: (base64Data: string) => void,
      onError: (error: Error) => void,
      options: Record<string, unknown>,
    ) => Promise<void>
  }
}

declare interface Window {
  Camera: {
    DestinationType: {
      DATA_URL: unknown
    }
    PictureSourceType: {
      CAMERA: unknown
    }
    EncodingType: {
      JPEG: unknown
    }
    MediaType: {
      PICTURE: unknown
    }
    Direction: {
      BACK: unknown
    }
  }
}
