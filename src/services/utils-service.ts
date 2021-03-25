import copy from 'copy-to-clipboard'
import * as bulmaToast from 'bulma-toast'

function copyToClipboard(text: string) {
  copy(text)
  bulmaToast.toast({
    message: 'Copied to clipboard',
    // @ts-expect-error bulma sets this string as a class, so we are hacking in our own classes
    type: 'ob-toast is-primary cypress-copy-to-clipboard-toast',
    duration: 1500,
    pauseOnHover: true,
    closeOnClick: true,
  })
}

export default {
  copyToClipboard,
}
