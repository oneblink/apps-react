import { bench, describe } from 'vitest'
import {
  LargeFormLayout,
  MountedLargeForm,
  mountLargeForm,
  navigateToPage,
  typeInto,
  unmountLargeForm,
} from './large-form'

const layouts: Array<[string, LargeFormLayout]> = [
  ['200 entries across 20 pages', { sets: 20, entriesPerSet: 10 }],
  ['200 entries in one repeatable set', { sets: 1, entriesPerSet: 200 }],
]

const mountOptions = {
  time: 0,
  iterations: 3,
  warmupTime: 0,
  warmupIterations: 1,
}

const interactionOptions = {
  time: 0,
  iterations: 20,
  warmupTime: 0,
  warmupIterations: 3,
}

/**
 * Mounts the form once per benchmark, before warm up, and unmounts it after the
 * measured run, so only the interaction is timed.
 */
function withMountedForm(layout: LargeFormLayout) {
  let mounted: MountedLargeForm | undefined
  return {
    get: () => {
      if (!mounted) {
        throw new Error('The form has not been mounted')
      }
      return mounted
    },
    setup: async () => {
      mounted = mounted ?? (await mountLargeForm(layout))
    },
    teardown: async (_task: unknown, mode: 'warmup' | 'run') => {
      if (mode === 'run' && mounted) {
        await unmountLargeForm(mounted)
        mounted = undefined
      }
    },
  }
}

function querySelector<T extends Element>(
  { container }: MountedLargeForm,
  selector: string,
) {
  const element = container.querySelector<T>(selector)
  if (!element) {
    throw new Error(`Could not find "${selector}"`)
  }
  return element
}

for (const [description, layout] of layouts) {
  describe(description, () => {
    bench(
      'mount and unmount',
      async () => {
        await unmountLargeForm(await mountLargeForm(layout))
      },
      mountOptions,
    )

    const typingOnFirstPage = withMountedForm(layout)
    let firstPageKeystroke = 0
    bench(
      'type in a field on the first page',
      async () => {
        await typeInto(
          querySelector<HTMLInputElement>(
            typingOnFirstPage.get(),
            '[data-ob-name="officerMobile"] input',
          ),
          `04${firstPageKeystroke++}`,
        )
      },
      {
        ...interactionOptions,
        setup: typingOnFirstPage.setup,
        teardown: typingOnFirstPage.teardown,
      },
    )

    const typingInEntry = withMountedForm(layout)
    let entryKeystroke = 0
    bench(
      'type in a field in a repeatable set entry',
      async () => {
        await typeInto(
          querySelector<HTMLTextAreaElement>(
            typingInEntry.get(),
            '[data-ob-name="sampleDescription"] textarea',
          ),
          `Description ${entryKeystroke++}`,
        )
      },
      {
        ...interactionOptions,
        setup: typingInEntry.setup,
        teardown: typingInEntry.teardown,
      },
    )

    const navigating = withMountedForm(layout)
    bench(
      'navigate to the first samples page and back',
      async () => {
        const mounted = navigating.get()
        await navigateToPage(mounted, 'page-samples-1')
        await navigateToPage(mounted, 'page-details')
      },
      {
        ...interactionOptions,
        setup: navigating.setup,
        teardown: navigating.teardown,
      },
    )
  })
}
