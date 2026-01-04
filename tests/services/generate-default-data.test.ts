import { vi, expect, test, describe, beforeEach, afterEach } from 'vitest'
import { FormTypes } from '@oneblink/types'
import generateDefaultData, {
  ENTRY_ID_PROPERTY_NAME,
} from '../../src/services/generate-default-data'

vi.mock('uuid', () => ({
  v4: () => 'my-uuid',
}))

describe('generateDefaultData()', () => {
  test('it should remove data from elements that do not allow defaults or pre-fill', () => {
    const result = generateDefaultData(
      [
        {
          name: 'heading',
          label: 'heading',
          type: 'heading',
          id: '4f38224e-f963-4c4c-9ee5-73d5a847cccf',
          conditionallyShow: false,
          requiresAllConditionallyShowPredicates: false,
          headingType: 2,
        },
        {
          name: 'html',
          label: 'html',
          type: 'html',
          id: 'b1856b03-4cf5-4709-8706-6b09ebc53183',
          conditionallyShow: false,
          requiresAllConditionallyShowPredicates: false,
          defaultValue: '<p>info</p>',
        },
        {
          name: 'image',
          label: 'image',
          type: 'image',
          id: 'b1856b03-4cf5-4709-8706-6b09ebc53183',
          conditionallyShow: false,
          requiresAllConditionallyShowPredicates: false,
          defaultValue: 'https://example.com/image.png',
        },
        {
          formId: 1,
          name: 'infoPage',
          type: 'infoPage',
          id: 'b1856b03-4cf5-4709-8706-6b09ebc53183',
          conditionallyShow: false,
          requiresAllConditionallyShowPredicates: false,
        },
        {
          name: 'calculation',
          label: 'calculation',
          type: 'calculation',
          id: 'f4f5878d-2bb9-475e-873d-408ad3d2c3c4',
          conditionallyShow: false,
          requiresAllConditionallyShowPredicates: false,
          defaultValue: '{RESULT}',
          calculation: '1 + 1',
        },
        {
          name: 'captcha',
          label: 'captcha',
          type: 'captcha',
          required: false,
          id: '6ceb9208-0e7b-4333-b571-28210e57f2d2',
          conditionallyShow: false,
          requiresAllConditionallyShowPredicates: false,
        },
        {
          name: 'summary',
          label: 'summary',
          type: 'summary',
          id: '3390610c-eb5f-4842-95a6-b6daf719aa88',
          conditionallyShow: false,
          requiresAllConditionallyShowPredicates: false,
          elementIds: ['d1f0ee6c-2fdd-4dbf-b4df-c3b02bf41be4'],
        },
      ],
      {
        heading: 'invalid',
        html: 'invalid',
        image: 'invalid',
        infoPage: 'invalid',
        calculation: 2,
        captcha: 'invalid',
        summary: 'invalid',
      },
    )

    expect(result).toEqual({
      heading: undefined,
      html: undefined,
      image: undefined,
      infoPage: undefined,
      calculation: 2,
      captcha: undefined,
      summary: undefined,
    })
  })

  describe('"text" element type', () => {
    const element: FormTypes.TextElement = {
      name: 'text',
      label: 'text',
      type: 'text',
      required: false,
      id: 'd1f0ee6c-2fdd-4dbf-b4df-c3b02bf41be4',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
    }
    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        text: 1,
      })

      expect(result).toEqual({
        text: undefined,
      })
    })

    test('it should set default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: 'defaultValue',
          },
        ],
        {},
      )

      expect(result).toEqual({
        text: 'defaultValue',
      })
    })

    test('it should not set default data if pre-fill has property', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: 'defaultValue',
          },
        ],
        {
          text: undefined,
        },
      )

      expect(result).toEqual({
        text: undefined,
      })
    })

    test('it should set valid pre-fill data over default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: 'defaultValue',
          },
        ],
        {
          text: 'text',
        },
      )

      expect(result).toEqual({
        text: 'text',
      })
    })
  })

  describe('"bsb" element type', () => {
    const element: FormTypes.BSBElement = {
      name: 'bsb',
      label: 'bsb',
      type: 'bsb',
      required: false,
      id: 'd1f0ee6c-2fdd-4dbf-b4df-c3b02bf41be4',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
    }
    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        bsb: 1,
      })

      expect(result).toEqual({
        bsb: undefined,
      })
    })

    test('it should set default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: '123-321',
          },
        ],
        {},
      )

      expect(result).toEqual({
        bsb: '123-321',
      })
    })

    test('it should not set default data if pre-fill has property', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: '123-321',
          },
        ],
        {
          bsb: undefined,
        },
      )

      expect(result).toEqual({
        bsb: undefined,
      })
    })

    test('it should set valid pre-fill data over default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: 'defaultValue',
          },
        ],
        {
          bsb: '123-321',
        },
      )

      expect(result).toEqual({
        bsb: '123-321',
      })
    })
  })

  describe('"textarea" element type', () => {
    const element: FormTypes.TextareaElement = {
      name: 'textarea',
      label: 'textarea',
      type: 'textarea',
      required: false,
      id: 'd1f0ee6c-2fdd-4dbf-b4df-c3b02bf41be4',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
    }
    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        textarea: 1,
      })

      expect(result).toEqual({
        textarea: undefined,
      })
    })

    test('it should set default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: 'defaultValue',
          },
        ],
        {},
      )

      expect(result).toEqual({
        textarea: 'defaultValue',
      })
    })

    test('it should set valid pre-fill data over default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: 'defaultValue',
          },
        ],
        {
          textarea: 'text',
        },
      )

      expect(result).toEqual({
        textarea: 'text',
      })
    })
  })

  describe('"number" element type', () => {
    const element: FormTypes.NumberElement = {
      name: 'number',
      label: 'number',
      type: 'number',
      required: false,
      id: '9e0c3460-6095-41b7-b697-f42bd82208f5',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
      isSlider: false,
      isInteger: false,
    }

    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        number: 'invalid',
      })

      expect(result).toEqual({
        number: undefined,
      })
    })

    test('it should set default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: 123,
          },
        ],
        {},
      )

      expect(result).toEqual({
        number: 123,
      })
    })

    test('it should set valid pre-fill data over default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: 123,
          },
        ],
        {
          number: 321,
        },
      )

      expect(result).toEqual({
        number: 321,
      })
    })
  })

  describe('"email" element type', () => {
    const element: FormTypes.EmailElement = {
      name: 'email',
      label: 'email',
      type: 'email',
      required: false,
      id: '9e0c3460-6095-41b7-b697-f42bd82208f5',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
    }

    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        email: '',
      })

      expect(result).toEqual({
        email: undefined,
      })
    })

    test('it should set default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: 'default@example.com',
          },
        ],
        {},
      )

      expect(result).toEqual({
        email: 'default@example.com',
      })
    })

    test('it should set valid pre-fill data over default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: 'default@example.com',
          },
        ],
        {
          email: 'email@example.com',
        },
      )

      expect(result).toEqual({
        email: 'email@example.com',
      })
    })
  })

  describe('"telephone" element type', () => {
    const element: FormTypes.TelephoneElement = {
      name: 'telephone',
      label: 'telephone',
      type: 'telephone',
      required: false,
      id: '9e0c3460-6095-41b7-b697-f42bd82208f5',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
    }

    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        telephone: 321,
      })

      expect(result).toEqual({
        telephone: undefined,
      })
    })

    test('it should set default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: 'defaultValue',
          },
        ],
        {},
      )

      expect(result).toEqual({
        telephone: 'defaultValue',
      })
    })

    test('it should set valid pre-fill data over default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: 'default@example.com',
          },
        ],
        {
          telephone: '123',
        },
      )

      expect(result).toEqual({
        telephone: '123',
      })
    })
  })

  describe('"barcodeScanner" element type', () => {
    const element: FormTypes.BarcodeScannerElement = {
      name: 'barcodeScanner',
      label: 'barcodeScanner',
      type: 'barcodeScanner',
      required: false,
      id: '9e0c3460-6095-41b7-b697-f42bd82208f5',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
      restrictBarcodeTypes: false,
    }

    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        barcodeScanner: false,
      })

      expect(result).toEqual({
        barcodeScanner: undefined,
      })
    })

    test('it should set default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: 'defaultValue',
          },
        ],
        {},
      )

      expect(result).toEqual({
        barcodeScanner: 'defaultValue',
      })
    })

    test('it should set valid pre-fill data over default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: 'default@example.com',
          },
        ],
        {
          barcodeScanner: '123',
        },
      )

      expect(result).toEqual({
        barcodeScanner: '123',
      })
    })
  })

  describe('"switch" element type', () => {
    const element: FormTypes.BooleanElement = {
      name: 'boolean',
      label: 'boolean',
      type: 'boolean',
      required: false,
      defaultValue: false,
      id: '9e0c3460-6095-41b7-b697-f42bd82208f5',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
    }

    test('it should set truthy pre-fill data to a `false` boolean', () => {
      const result = generateDefaultData([element], {
        boolean: 'truthy',
      })

      expect(result).toEqual({
        boolean: false,
      })
    })

    test('it should set falsey pre-fill data to a `false` boolean', () => {
      const result = generateDefaultData([element], {
        boolean: 0,
      })

      expect(result).toEqual({
        boolean: false,
      })
    })

    test('it should set `true` pre-fill data to a `true` boolean', () => {
      const result = generateDefaultData([element], {
        boolean: true,
      })

      expect(result).toEqual({
        boolean: true,
      })
    })

    test('it should set default value', () => {
      const result = generateDefaultData([element], {})

      expect(result).toEqual({
        boolean: false,
      })
    })

    test('it should set valid pre-fill data over default value', () => {
      const result = generateDefaultData([element], {
        boolean: true,
      })

      expect(result).toEqual({
        boolean: true,
      })
    })
  })

  describe('"radio" element type', () => {
    const element: FormTypes.RadioButtonElement = {
      name: 'radio',
      label: 'radio',
      type: 'radio',
      required: false,
      id: '6a9c70e3-d196-4eb4-9fdc-079f86a16e36',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      options: [
        {
          id: '1',
          label: 'Option 1',
          value: 'option-1',
        },
        {
          id: '2',
          label: 'Option 2',
          value: 'option-2',
        },
      ],
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
      buttons: false,
      optionsType: 'CUSTOM',
      conditionallyShowOptions: false,
    }

    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        radio: {},
      })

      expect(result).toEqual({
        radio: undefined,
      })
    })

    test('it should set default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: '1',
          },
        ],
        {},
      )

      expect(result).toEqual({
        radio: 'option-1',
      })
    })

    test('it should set valid pre-fill data over default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: '1',
          },
        ],
        {
          radio: 'option-2',
        },
      )

      expect(result).toEqual({
        radio: 'option-2',
      })
    })
  })

  describe('"checkboxes" element type', () => {
    const element: FormTypes.CheckboxElement = {
      name: 'checkboxes',
      label: 'checkboxes',
      type: 'checkboxes',
      required: false,
      id: '6a9c70e3-d196-4eb4-9fdc-079f86a16e36',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      options: [
        {
          id: '1',
          label: 'Option 1',
          value: 'option-1',
        },
        {
          id: '2',
          label: 'Option 2',
          value: 'option-2',
        },
      ],
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
      buttons: false,
      optionsType: 'CUSTOM',
      conditionallyShowOptions: false,
    }

    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        checkboxes: '1',
      })

      expect(result).toEqual({
        checkboxes: undefined,
      })
    })

    test('it should set default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: ['1'],
          },
        ],
        {},
      )

      expect(result).toEqual({
        checkboxes: ['option-1'],
      })
    })

    test('it should set valid pre-fill data over default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: ['1'],
          },
        ],
        {
          checkboxes: ['option-2'],
        },
      )

      expect(result).toEqual({
        checkboxes: ['option-2'],
      })
    })
  })

  describe('"select" element type', () => {
    const element: FormTypes.SelectElement = {
      name: 'select',
      label: 'select',
      type: 'select',
      required: false,
      id: '6a9c70e3-d196-4eb4-9fdc-079f86a16e36',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      options: [
        {
          id: '1',
          label: 'Option 1',
          value: 'option-1',
        },
        {
          id: '2',
          label: 'Option 2',
          value: 'option-2',
        },
      ],
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
      multi: false,
      optionsType: 'CUSTOM',
      conditionallyShowOptions: false,
    }
    const elementMulti: FormTypes.SelectElement = {
      ...element,
      name: 'multi',
      multi: true,
    }

    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element, elementMulti], {
        select: [],
        multi: 123,
      })

      expect(result).toEqual({
        select: undefined,
        multi: undefined,
      })
    })

    test('it should set default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: '1',
          },
          {
            ...elementMulti,
            defaultValue: ['1'],
          },
        ],
        {},
      )

      expect(result).toEqual({
        select: 'option-1',
        multi: ['option-1'],
      })
    })

    test('it should set valid pre-fill data over default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: '1',
          },
          {
            ...elementMulti,
            defaultValue: ['1'],
          },
        ],
        {
          select: 'option-2',
          multi: ['option-2'],
        },
      )

      expect(result).toEqual({
        select: 'option-2',
        multi: ['option-2'],
      })
    })
  })

  describe('"autocomplete" element type', () => {
    const element: FormTypes.AutoCompleteElement = {
      name: 'autocomplete',
      label: 'autocomplete',
      type: 'autocomplete',
      required: false,
      id: '6a9c70e3-d196-4eb4-9fdc-079f86a16e36',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      options: [
        {
          id: '1',
          label: 'Option 1',
          value: 'option-1',
        },
        {
          id: '2',
          label: 'Option 2',
          value: 'option-2',
        },
      ],
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
      optionsType: 'CUSTOM',
      conditionallyShowOptions: false,
    }

    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        autocomplete: {},
      })

      expect(result).toEqual({
        autocomplete: undefined,
      })
    })

    test('it should set default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: '1',
          },
        ],
        {},
      )

      expect(result).toEqual({
        autocomplete: 'option-1',
      })
    })

    test('it should set valid pre-fill data over default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: '1',
          },
        ],
        {
          autocomplete: 'option-2',
        },
      )

      expect(result).toEqual({
        autocomplete: 'option-2',
      })
    })
  })

  describe('"compliance" element type', () => {
    const element: FormTypes.ComplianceElement = {
      name: 'compliance',
      label: 'compliance',
      type: 'compliance',
      required: false,
      id: '1973359f-3ec2-4b78-ad8d-d7fad3016a18',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      options: [
        {
          id: '1',
          label: 'Option 1',
          value: 'option-1',
        },
        {
          id: '2',
          label: 'Option 2',
          value: 'option-2',
        },
      ],
      storageType: 'private',
      readOnly: false,
      optionsType: 'CUSTOM',
      conditionallyShowOptions: false,
      isDataLookup: false,
      isElementLookup: false,
    }

    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        compliance: {},
      })

      expect(result).toEqual({
        compliance: undefined,
      })
    })

    test('it should set default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: '1',
          },
        ],
        {},
      )

      expect(result).toEqual({
        compliance: { value: 'option-1' },
      })
    })

    test('it should set valid pre-fill data over default value', () => {
      const compliance = {
        value: 'option-2',
        notes: 'notes',
        files: [
          {
            s3: {
              region: 'ap-southeast-2',
              bucket: 'customer.forms.oneblink.io',
              key: 'submissions/1/attachments/44cdee6f-edbd-4620-aaf5-df25ce976e43',
            },
            url: 'https://auth-api.blinkm.io/submissions/1/attachments/44cdee6f-edbd-4620-aaf5-df25ce976e43',
            contentType: 'image/png',
            fileName: 'dot.png',
            id: '44cdee6f-edbd-4620-aaf5-df25ce976e43',
            isPrivate: true,
          },
        ],
      }
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: '1',
          },
        ],
        {
          compliance,
        },
      )

      expect(result).toEqual({
        compliance,
      })
    })

    test('it should prepare files for upload if data is in legacy format, but element storage is not legacy', () => {
      const result = generateDefaultData([element], {
        compliance: {
          value: 'option-2',
          files: [
            {
              fileName: 'dot.png',
              data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAADCAYAAABWKLW/AAAAIElEQVQYV2NkYGBoYGBgqGdgYGhkZGBg+M8ABSAOXAYATFcEA8STCz8AAAAASUVORK5CYII=',
            },
          ],
        },
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const compliance = result.compliance as any
      expect(compliance.value).toBe('option-2')
      expect(compliance.files[0].type).toBe('NEW')
      expect(compliance.files[0].fileName).toBe('dot.png')
      expect(compliance.files[0].data).toBeInstanceOf(Blob)
      expect(typeof compliance.files[0]._id).toBe('string')
    })
  })

  describe('"files" element type', () => {
    const element: FormTypes.FilesElement = {
      name: 'files',
      label: 'files',
      type: 'files',
      id: '1973359f-3ec2-4b78-ad8d-d7fad3016a18',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      storageType: 'private',
      readOnly: false,
      restrictFileTypes: false,
      isDataLookup: false,
      isElementLookup: false,
    }

    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        files: [{}],
      })

      expect(result).toEqual({
        files: undefined,
      })
    })

    test('it should set default value', () => {
      const files = [
        {
          s3: {
            region: 'ap-southeast-2',
            bucket: 'customer.forms.oneblink.io',
            key: 'submissions/1/attachments/44cdee6f-edbd-4620-aaf5-df25ce976e43',
          },
          url: 'https://auth-api.blinkm.io/submissions/1/attachments/44cdee6f-edbd-4620-aaf5-df25ce976e43',
          contentType: 'image/png',
          fileName: 'dot.png',
          id: '44cdee6f-edbd-4620-aaf5-df25ce976e43',
          isPrivate: true,
        },
      ]
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: files,
          },
        ],
        {},
      )

      expect(result).toEqual({
        files,
      })
    })

    test('it should set valid pre-fill data over default value', () => {
      const files = [
        {
          s3: {
            region: 'ap-southeast-2',
            bucket: 'customer.forms.oneblink.io',
            key: 'submissions/1/attachments/44cdee6f-edbd-4620-aaf5-df25ce976e43',
          },
          url: 'https://auth-api.blinkm.io/submissions/1/attachments/44cdee6f-edbd-4620-aaf5-df25ce976e43',
          contentType: 'image/png',
          fileName: 'dot.png',
          id: '44cdee6f-edbd-4620-aaf5-df25ce976e43',
          isPrivate: true,
        },
      ]
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: [],
          },
        ],
        {
          files,
        },
      )

      expect(result).toEqual({
        files,
      })
    })

    test('it should prepare files for upload if data is in legacy format, but element storage is not legacy', () => {
      const result = generateDefaultData([element], {
        files: [
          {
            fileName: 'dot.png',
            data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAADCAYAAABWKLW/AAAAIElEQVQYV2NkYGBoYGBgqGdgYGhkZGBg+M8ABSAOXAYATFcEA8STCz8AAAAASUVORK5CYII=',
          },
        ],
      })

      const files = result.files as Record<string, unknown>[]
      expect(files[0].type).toBe('NEW')
      expect(files[0].fileName).toBe('dot.png')
      expect(files[0].data).toBeInstanceOf(Blob)
      expect(typeof files[0]._id).toBe('string')
    })
  })

  describe('"camera" element type', () => {
    const element: FormTypes.CameraElement = {
      name: 'camera',
      label: 'camera',
      type: 'camera',
      required: false,
      id: 'eadae42b-3eb8-4236-8ef1-5cf9d4567304',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      storageType: 'private',
      readOnly: false,
      includeTimestampWatermark: false,
    }

    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        camera: 123,
      })

      expect(result).toEqual({
        camera: undefined,
      })
    })

    test('it should set default value', () => {
      const camera = {
        s3: {
          region: 'ap-southeast-2',
          bucket: 'customer.forms.oneblink.io',
          key: 'submissions/1/attachments/44cdee6f-edbd-4620-aaf5-df25ce976e43',
        },
        url: 'https://auth-api.blinkm.io/submissions/1/attachments/44cdee6f-edbd-4620-aaf5-df25ce976e43',
        contentType: 'image/png',
        fileName: 'dot.png',
        id: '44cdee6f-edbd-4620-aaf5-df25ce976e43',
        isPrivate: true,
      }

      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: camera,
          },
        ],
        {},
      )

      expect(result).toEqual({
        camera,
      })
    })

    test('it should set valid pre-fill data over default value', () => {
      const camera = {
        s3: {
          region: 'ap-southeast-2',
          bucket: 'customer.forms.oneblink.io',
          key: 'submissions/1/attachments/44cdee6f-edbd-4620-aaf5-df25ce976e43',
        },
        url: 'https://auth-api.blinkm.io/submissions/1/attachments/44cdee6f-edbd-4620-aaf5-df25ce976e43',
        contentType: 'image/png',
        fileName: 'dot.png',
        id: '44cdee6f-edbd-4620-aaf5-df25ce976e43',
        isPrivate: true,
      }

      const result = generateDefaultData(
        [
          // @ts-expect-error intentionally using incorrect type
          {
            ...element,
            defaultValue: 'invalid',
          },
        ],
        {
          camera,
        },
      )

      expect(result).toEqual({
        camera,
      })
    })

    test('it should prepare files for upload if data is in legacy format, but element storage is not legacy', () => {
      const result = generateDefaultData([element], {
        camera:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAADCAYAAABWKLW/AAAAIElEQVQYV2NkYGBoYGBgqGdgYGhkZGBg+M8ABSAOXAYATFcEA8STCz8AAAAASUVORK5CYII=',
      })

      const camera = result.camera as Record<string, unknown>
      expect(camera.type).toBe('NEW')
      expect(camera.fileName).toBe('file')
      expect(camera.data).toBeInstanceOf(Blob)
      expect(typeof camera._id).toBe('string')
    })
  })

  describe('"draw" element type', () => {
    const element: FormTypes.DrawElement = {
      name: 'draw',
      label: 'draw',
      type: 'draw',
      required: false,
      id: '288a977d-53ac-4aae-b7ea-6b894c859759',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      storageType: 'private',
      readOnly: false,
    }

    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        draw: 123,
      })

      expect(result).toEqual({
        draw: undefined,
      })
    })

    test('it should set default value', () => {
      const draw = {
        s3: {
          region: 'ap-southeast-2',
          bucket: 'customer.forms.oneblink.io',
          key: 'submissions/1/attachments/44cdee6f-edbd-4620-aaf5-df25ce976e43',
        },
        url: 'https://auth-api.blinkm.io/submissions/1/attachments/44cdee6f-edbd-4620-aaf5-df25ce976e43',
        contentType: 'image/png',
        fileName: 'dot.png',
        id: '44cdee6f-edbd-4620-aaf5-df25ce976e43',
        isPrivate: true,
      }

      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: draw,
          },
        ],
        {},
      )

      expect(result).toEqual({
        draw,
      })
    })

    test('it should set valid pre-fill data over default value', () => {
      const draw = {
        s3: {
          region: 'ap-southeast-2',
          bucket: 'customer.forms.oneblink.io',
          key: 'submissions/1/attachments/44cdee6f-edbd-4620-aaf5-df25ce976e43',
        },
        url: 'https://auth-api.blinkm.io/submissions/1/attachments/44cdee6f-edbd-4620-aaf5-df25ce976e43',
        contentType: 'image/png',
        fileName: 'dot.png',
        id: '44cdee6f-edbd-4620-aaf5-df25ce976e43',
        isPrivate: true,
      }

      const result = generateDefaultData(
        [
          // @ts-expect-error intentionally using incorrect type
          {
            ...element,
            defaultValue: 'invalid',
          },
        ],
        {
          draw,
        },
      )

      expect(result).toEqual({
        draw,
      })
    })

    test('it should prepare files for upload if data is in legacy format, but element storage is not legacy', () => {
      const result = generateDefaultData([element], {
        draw: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAADCAYAAABWKLW/AAAAIElEQVQYV2NkYGBoYGBgqGdgYGhkZGBg+M8ABSAOXAYATFcEA8STCz8AAAAASUVORK5CYII=',
      })

      const draw = result.draw as Record<string, unknown>
      expect(draw.type).toBe('NEW')
      expect(draw.fileName).toBe('file')
      expect(draw.data).toBeInstanceOf(Blob)
      expect(typeof draw._id).toBe('string')
    })
  })

  describe('"date" element type', () => {
    const element: FormTypes.DateElement = {
      name: 'date',
      label: 'date',
      type: 'date',
      id: '6513e83e-ae6b-4f13-9d30-f643788fa9e8',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      required: false,
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
    }

    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        date: 'invalid',
      })

      expect(result).toEqual({
        date: undefined,
      })
    })

    test('it should set default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: '2020-01-01',
          },
        ],
        {},
      )

      expect(result).toEqual({
        date: '2020-01-01',
      })
    })

    test('it should set valid pre-fill data over default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: '2020-01-01',
          },
        ],
        {
          date: '2020-02-02',
        },
      )

      expect(result).toEqual({
        date: '2020-02-02',
      })
    })

    test('it should convert defaultValue full ISO string to just date', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: '2020-01-01T12:00:00.000Z',
          },
        ],
        {},
      )

      expect(result).toEqual({
        date: '2020-01-01',
      })
    })

    test('it should convert pre-fill full ISO string to just date', () => {
      const result = generateDefaultData([element], {
        date: '2020-01-01T12:00:00.000Z',
      })

      expect(result).toEqual({
        date: '2020-01-01',
      })
    })
  })

  describe('"datetime" element type', () => {
    beforeEach(() => {
      vi.stubEnv('TZ', 'UTC')
    })

    afterEach(() => {
      vi.unstubAllEnvs()
    })

    const element: FormTypes.DateTimeElement = {
      name: 'datetime',
      label: 'datetime',
      type: 'datetime',
      required: false,
      id: 'a99933fd-f335-4676-bd71-d612b5cb6f75',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
    }

    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        datetime: 'invalid',
      })

      expect(result).toEqual({
        datetime: undefined,
      })
    })

    test('it should set default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: '2020-01-01T12:00:00.000Z',
          },
        ],
        {},
      )

      expect(result).toEqual({
        datetime: '2020-01-01T12:00:00.000Z',
      })
    })

    test('it should set valid pre-fill data over default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: '2020-01-01T12:00:00.000Z',
          },
        ],
        {
          datetime: '2020-02-02T12:00:00.000Z',
        },
      )

      expect(result).toEqual({
        datetime: '2020-02-02T12:00:00.000Z',
      })
    })

    test('it should convert defaultValue date ISO string to full ISO', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: '2020-01-01',
          },
        ],
        {},
      )

      expect(result).toEqual({
        datetime: '2020-01-01T00:00:00.000Z',
      })
    })

    test('it should convert pre-fill date ISO string to full ISO', () => {
      const result = generateDefaultData([element], {
        datetime: '2020-01-01',
      })

      expect(result).toEqual({
        datetime: '2020-01-01T00:00:00.000Z',
      })
    })
  })

  describe('"time" element type', () => {
    const element: FormTypes.TimeElement = {
      name: 'time',
      label: 'time',
      type: 'time',
      required: false,
      id: 'd572b61d-2602-4dc2-9d95-b7ddcafb929f',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
    }

    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        time: 'invalid',
      })

      expect(result).toEqual({
        time: undefined,
      })
    })

    test('it should set default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: '2020-01-01T12:00:00.000Z',
          },
        ],
        {},
      )

      expect(result).toEqual({
        time: '2020-01-01T12:00:00.000Z',
      })
    })

    test('it should set valid pre-fill data over default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: '2020-01-01T12:00:00.000Z',
          },
        ],
        {
          time: '2020-02-02T12:00:00.000Z',
        },
      )

      expect(result).toEqual({
        time: '2020-02-02T12:00:00.000Z',
      })
    })
  })

  describe('"location" element type', () => {
    const element: FormTypes.LocationElement = {
      name: 'location',
      label: 'location',
      type: 'location',
      required: false,
      id: 'd572b61d-2602-4dc2-9d95-b7ddcafb929f',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
    }

    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        location: 'invalid',
      })

      expect(result).toEqual({
        location: undefined,
      })
    })
    test('it should remove pre-fill data without latitude', () => {
      const result = generateDefaultData([element], {
        location: {
          longitude: 1,
        },
      })

      expect(result).toEqual({
        location: undefined,
      })
    })
    test('it should remove pre-fill data without longitude', () => {
      const result = generateDefaultData([element], {
        location: {
          latitude: 1,
        },
      })

      expect(result).toEqual({
        location: undefined,
      })
    })

    test('it should set default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: {
              longitude: 1,
              latitude: 1,
              zoom: 15,
            },
          },
        ],
        {},
      )

      expect(result).toEqual({
        location: {
          longitude: 1,
          latitude: 1,
          zoom: 15,
        },
      })
    })

    test('it should set valid pre-fill data over default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: {
              longitude: 1,
              latitude: 1,
              zoom: 15,
            },
          },
        ],
        {
          location: {
            longitude: 2,
            latitude: 2,
            zoom: 20,
          },
        },
      )

      expect(result).toEqual({
        location: {
          longitude: 2,
          latitude: 2,
          zoom: 20,
        },
      })
    })
  })

  describe('"form" element type', () => {
    const element: FormTypes.FormFormElement = {
      formId: 1,
      name: 'form',
      type: 'form',
      id: 'd572b61d-2602-4dc2-9d95-b7ddcafb929f',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      elements: [
        {
          name: 'text',
          label: 'text',
          type: 'text',
          required: false,
          id: '9b9e477b-577c-44a6-a727-cef8dd57670a',
          defaultValue: 'default text',
          conditionallyShow: false,
          requiresAllConditionallyShowPredicates: false,
          readOnly: false,
          isDataLookup: false,
          isElementLookup: false,
        },
      ],
    }

    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        form: 'invalid',
      })

      expect(result).toEqual({
        form: undefined,
      })
    })

    test('it should remove set default values for nested elements', () => {
      const result = generateDefaultData([element], {})

      expect(result).toEqual({
        form: {
          text: 'default text',
        },
      })
    })

    test('it should set valid pre-fill data over default data', () => {
      const result = generateDefaultData([element], {
        form: {
          text: 'pre-fill',
        },
      })

      expect(result).toEqual({
        form: {
          text: 'pre-fill',
        },
      })
    })

    test('it should not set default if pre-fill has no value', () => {
      const result = generateDefaultData([element], {
        form: {},
      })

      expect(result).toEqual({
        form: {
          text: undefined,
        },
      })
    })
  })

  describe('"repeatableSet" element type', () => {
    const element: FormTypes.RepeatableSetElement = {
      name: 'repeatableSet',
      label: 'repeatableSet',
      type: 'repeatableSet',
      id: 'd0b1a6bc-8ec4-488c-9d42-5c1109bfad94',
      readOnly: false,
      minSetEntries: 1,
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      elements: [
        {
          name: 'text',
          label: 'text',
          type: 'text',
          required: false,
          defaultValue: 'default text',
          id: '9b9e477b-577c-44a6-a727-cef8dd57670a',
          conditionallyShow: false,
          requiresAllConditionallyShowPredicates: false,
          readOnly: false,
          isDataLookup: false,
          isElementLookup: false,
        },
      ],
    }

    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        repeatableSet: 'invalid',
      })

      expect(result).toEqual({
        repeatableSet: undefined,
      })
    })

    test('it should set default based on "minSetEntries" property', () => {
      const result = generateDefaultData([element], {})

      expect(result).toEqual({
        repeatableSet: [
          {
            [ENTRY_ID_PROPERTY_NAME]: 'my-uuid',
            text: 'default text',
          },
        ],
      })
    })

    test('it should set valid pre-fill data', () => {
      const result = generateDefaultData([element], {
        repeatableSet: [
          {
            text: 'pre-fill',
          },
          {
            text: 'pre-fill',
          },
        ],
      })

      expect(result).toEqual({
        repeatableSet: [
          {
            [ENTRY_ID_PROPERTY_NAME]: 'my-uuid',
            text: 'pre-fill',
          },
          {
            [ENTRY_ID_PROPERTY_NAME]: 'my-uuid',
            text: 'pre-fill',
          },
        ],
      })
    })

    test('it should not set default if pre-fill has no value', () => {
      const result = generateDefaultData([element], {
        repeatableSet: [{}, {}],
      })

      expect(result).toEqual({
        repeatableSet: [
          {
            [ENTRY_ID_PROPERTY_NAME]: 'my-uuid',
            text: undefined,
          },
          {
            [ENTRY_ID_PROPERTY_NAME]: 'my-uuid',
            text: undefined,
          },
        ],
      })
    })
  })

  describe('"geoscapeAddress" element type', () => {
    const element: FormTypes.GeoscapeAddressElement = {
      name: 'geoscapeAddress',
      label: 'geoscapeAddress',
      type: 'geoscapeAddress',
      required: false,
      id: '6b7a8936-a6ac-417a-85b3-2d7d428be5ec',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
    }

    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        geoscapeAddress: {},
      })

      expect(result).toEqual({
        geoscapeAddress: undefined,
      })
    })

    test('it should set default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: {
              addressId: 'id',
              addressRecordType: 'Primary',
              buildingsRolloutStatus: 'RELEASED',
              links: {},
            },
          },
        ],
        {},
      )

      expect(result).toEqual({
        geoscapeAddress: {
          addressId: 'id',
          addressRecordType: 'Primary',
          buildingsRolloutStatus: 'RELEASED',
          links: {},
        },
      })
    })

    test('it should set valid pre-fill data', () => {
      const result = generateDefaultData([element], {
        geoscapeAddress: {
          addressId: 'id',
          addressRecordType: 'Primary',
          buildingsRolloutStatus: 'RELEASED',
          links: {},
        },
      })

      expect(result).toEqual({
        geoscapeAddress: {
          addressId: 'id',
          addressRecordType: 'Primary',
          buildingsRolloutStatus: 'RELEASED',
          links: {},
        },
      })
    })
  })

  describe('"pointAddress" element type', () => {
    const element: FormTypes.PointAddressElement = {
      name: 'pointAddress',
      label: 'pointAddress',
      type: 'pointAddress',
      required: false,
      id: 'a82012b8-a2ab-42de-b131-220000b7d60f',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
    }

    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        pointAddress: {},
      })

      expect(result).toEqual({
        pointAddress: undefined,
      })
    })

    test('it should set default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: {
              addressId: 'id',
              addressRecordType: 'Primary',
            },
          },
        ],
        {},
      )

      expect(result).toEqual({
        pointAddress: {
          addressId: 'id',
          addressRecordType: 'Primary',
        },
      })
    })

    test('it should set valid pre-fill data', () => {
      const result = generateDefaultData([element], {
        pointAddress: {
          addressId: 'id',
          addressRecordType: 'Primary',
        },
      })

      expect(result).toEqual({
        pointAddress: {
          addressId: 'id',
          addressRecordType: 'Primary',
        },
      })
    })
  })

  describe('"civicaStreetName" element type', () => {
    const element: FormTypes.CivicaStreetNameElement = {
      name: 'civicaStreetName',
      label: 'civicaStreetName',
      type: 'civicaStreetName',
      required: false,
      id: '008d9516-761a-42c4-8698-befe76b6292d',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
    }

    const civicaStreetName = {
      streetId: 123,
      blockId: 0,
      name: 'Fake',
      typeCode: 'RD',
      typeDescription: 'Road',
      suburbId: 321,
      suburbName: 'FAKEVILLE',
      postCode: '2444',
      localityName: null,
      postTown: null,
      formattedAccount: '00004321.0000',
      suburbState: 'NSW',
      formattedStreet: 'Fake Road FAKEVILLE',
    }

    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        civicaStreetName: {},
      })

      expect(result).toEqual({
        civicaStreetName: undefined,
      })
    })

    test('it should set default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: civicaStreetName,
          },
        ],
        {},
      )

      expect(result).toEqual({
        civicaStreetName,
      })
    })

    test('it should set valid pre-fill data', () => {
      const result = generateDefaultData([element], {
        civicaStreetName,
      })

      expect(result).toEqual({
        civicaStreetName,
      })
    })
  })

  describe('"civicaNameRecord" element type', () => {
    const element: FormTypes.CivicaNameRecordElement = {
      name: 'civicaNameRecord',
      label: 'civicaNameRecord',
      type: 'civicaNameRecord',
      required: false,
      id: '66ffe648-8ffc-462d-97c9-d71091635a75',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      readOnly: false,
      useGeoscapeAddressing: false,
      givenName1IsRequired: false,
      givenName1IsHidden: false,
      emailAddressIsRequired: false,
      emailAddressIsHidden: false,
      homePhoneIsRequired: false,
      homePhoneIsHidden: false,
      businessPhoneIsRequired: false,
      businessPhoneIsHidden: false,
      mobilePhoneIsRequired: false,
      mobilePhoneIsHidden: false,
      faxPhoneIsRequired: false,
      faxPhoneIsHidden: false,
    }

    const civicaNameRecord = {
      title: 'MR',
      givenName1: 'John',
      familyName: 'Smith',
      emailAddress: 'john.smith@exmaple.com',
      homePhone: '12',
      businessPhone: '34',
      mobilePhone: '56',
      faxPhone: '78',
      streetAddress: [
        {
          address1: '1 High St',
          address2: 'Sydney',
          postcode: '2000',
        },
      ],
    }

    test('it should remove pre-fill data with invalid title', () => {
      const result = generateDefaultData([element], {
        civicaNameRecord: {
          title: 123,
          familyName: 'Smith',
          streetAddress: [],
        },
      })

      expect(result).toEqual({
        civicaNameRecord: undefined,
      })
    })

    test('it should remove pre-fill data invalid familyName', () => {
      const result = generateDefaultData([element], {
        civicaNameRecord: {
          title: 'MR',
          familyName: 123,
          streetAddress: [],
        },
      })

      expect(result).toEqual({
        civicaNameRecord: undefined,
      })
    })

    test('it should remove pre-fill data without streetAddress', () => {
      const result = generateDefaultData([element], {
        civicaNameRecord: {
          title: 'MR',
          familyName: 'Smith',
        },
      })

      expect(result).toEqual({
        civicaNameRecord: undefined,
      })
    })

    test('it should set default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: civicaNameRecord,
          },
        ],
        {},
      )

      expect(result).toEqual({
        civicaNameRecord: {
          ...civicaNameRecord,
          streetAddress: civicaNameRecord.streetAddress.map(
            (streetAddress) => ({
              ...streetAddress,
              [ENTRY_ID_PROPERTY_NAME]: 'my-uuid',
            }),
          ),
        },
      })
    })

    test('it should set valid pre-fill data over default data', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: {
              ...civicaNameRecord,
              title: 'Sir',
            },
          },
        ],
        {
          civicaNameRecord,
        },
      )

      expect(result).toEqual({
        civicaNameRecord,
      })
    })
  })

  describe('"apiNSWLiquorLicence" element type', () => {
    const element: FormTypes.APINSWLiquorLicenceElement = {
      name: 'apiNSWLiquorLicence',
      label: 'API NSW Liquor Licence',
      type: 'apiNSWLiquorLicence',
      required: false,
      id: '6b7a8936-a6ac-417a-85b3-2d7d428be5ec',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
    }

    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        apiNSWLiquorLicence: {},
      })

      expect(result).toEqual({
        apiNSWLiquorLicence: undefined,
      })
    })

    test('it should set default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            defaultValue: {
              licenceDetail: {
                licenceNumber: '123abc',
              },
            },
          },
        ],
        {},
      )

      expect(result).toEqual({
        apiNSWLiquorLicence: {
          licenceDetail: {
            licenceNumber: '123abc',
          },
        },
      })
    })

    test('it should set valid pre-fill data', () => {
      const result = generateDefaultData([element], {
        apiNSWLiquorLicence: {
          licenceDetail: {
            licenceNumber: 'abc123',
          },
        },
      })

      expect(result).toEqual({
        apiNSWLiquorLicence: {
          licenceDetail: {
            licenceNumber: 'abc123',
          },
        },
      })
    })
  })

  describe('"arcGISWebMap" element type', () => {
    const element: FormTypes.ArcGISWebMapElement = {
      name: 'arcGISWebMap',
      label: 'Arc GIS Web Map',
      type: 'arcGISWebMap',
      required: false,
      id: '6b7a8936-a6ac-417a-85b3-2d7d428be5ec',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
      showLayerPanel: false,
    }

    test('it should remove invalid pre-fill data', () => {
      const result = generateDefaultData([element], {
        arcGISWebMap: {
          view: 123,
          userInput: '',
          invalidProp: {},
          layers: {},
          drawingLayer: {},
        },
      })

      expect(result).toEqual({
        arcGISWebMap: {
          view: undefined,
          layers: undefined,
          drawingLayer: undefined,
          userInput: undefined,
        },
      })
    })

    test('it should set default value', () => {
      const result = generateDefaultData(
        [
          {
            ...element,
            type: 'arcGISWebMap',
            defaultValue: {
              view: {
                zoom: 15,
                latitude: 123,
                longitude: 123,
              },
              userInput: [],
              drawingLayer: [],
              layers: [{ id: '', title: 'perimeter', graphics: [] }],
            },
          },
        ],
        {},
      )

      expect(result).toEqual({
        arcGISWebMap: {
          view: {
            zoom: 15,
            latitude: 123,
            longitude: 123,
          },
          userInput: [],
          drawingLayer: [],
          layers: [{ id: '', title: 'perimeter', graphics: [] }],
        },
      })
    })

    test('it should set valid pre-fill data', () => {
      const result = generateDefaultData([element], {
        arcGISWebMap: {
          view: {
            zoom: 15,
            latitude: 123,
            longitude: 123,
          },
          userInput: [],
          drawingLayer: [],
          layers: [{ title: 'perimeter', graphics: [] }],
        },
      })

      expect(result).toEqual({
        arcGISWebMap: {
          view: {
            zoom: 15,
            latitude: 123,
            longitude: 123,
          },
          userInput: [],
          drawingLayer: [],
          layers: [{ title: 'perimeter', graphics: [] }],
        },
      })
    })
  })
})
