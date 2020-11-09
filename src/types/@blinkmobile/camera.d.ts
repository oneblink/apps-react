declare module '@blinkmobile/camera' {
  export interface BlinkmobileCamera {
    open: () => void
    close: () => void
    getDevices: () => void
    availableDevices: MediaDeviceInfo[]
    useDevice: (device: MediaDeviceInfo) => void
  }

  export default function (
    htmlVideoElement: HTMLVideoElement,
  ): BlinkmobileCamera
}
