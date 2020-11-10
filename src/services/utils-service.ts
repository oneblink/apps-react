import copy from 'copy-to-clipboard'
import * as bulmaToast from 'bulma-toast'

function copyToClipboard(text: string) {
  copy(text)
  bulmaToast.toast({
    message: 'Copied to clipboard',
    // @ts-expect-error ???
    type: 'ob-toast is-primary cypress-copy-to-clipboard-toast',
    position: 'bottom-right',
    duration: 1500,
    pauseOnHover: true,
    closeOnClick: true,
    opacity: 0.95,
  })
}

export default {
  copyToClipboard,
}
