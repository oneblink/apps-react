import processInjectableOption from '../../src/services/injectableOptions'

describe('processInjectableOption()', () => {
  it('should return correct values for root element', () => {
    const options = processInjectableOption({
      option: {
        id: '1edcce9e-3635-407b-8adc-ce614fde742c',
        label: '{ELEMENT:Name}, {ELEMENT:Set|Set_2|SetText_2}',
        value: '{ELEMENT:Email} | {ELEMENT:Set|Set_2|SetNum_2}',
      },
      submission: {
        First_Name: 'John',
        Last_Name: 'Smith',
        Email: 'john@smith.com',
      },
      formElements: [
        {
          id: 'bef56860-60d7-11e9-8720-a17b002a77a6',
          name: 'First_Name',
          type: 'text',
          label: 'First Name',
          isDataLookup: false,
          isElementLookup: false,
          required: false,
          conditionallyShow: false,
        },
        {
          id: 'bef56860-60d7-11e9-8720-a17b002a77a7',
          name: 'Last_Name',
          type: 'text',
          label: 'Last Name',
          isDataLookup: false,
          isElementLookup: false,
          required: false,
          conditionallyShow: false,
        },
        {
          id: 'bef56860-60d7-11e9-8720-a17b002a7766',
          name: 'Email',
          type: 'email',
          label: 'Email',
          isDataLookup: false,
          isElementLookup: false,
          required: false,
          conditionallyShow: false,
        },
      ],
    })

    expect(options).toEqual([
      {
        id: 'id',
        label: 'John Smith',
        value: 'john@smith.com',
      },
    ])
  })

  it('should return correct values for root element with nested repeatable set entries', () => {
    const options = processInjectableOption({
      option: {
        id: '1edcce9e-3635-407b-8adc-ce614fde742c',
        label: '{ELEMENT:Name}, {ELEMENT:Set|Set_2|SetText_2}',
        value: '{ELEMENT:Email} | {ELEMENT:Set|Set_2|SetNum_2}',
      },
      submission: {
        Name: 'John',
        Email: 'john@smith.com',
        Set: [
          {
            Set_2: [
              {
                SetText_2: 'First Text',
                SetNum_2: 1,
              },
              {
                SetText_2: 'Second Text',
                SetNum_2: 2,
              },
            ],
          },
        ],
      },
      formElements: [
        {
          name: 'Name',
          label: 'Name',
          type: 'text',
          required: true,
          id: '9331449b-46de-4573-82cd-b9494b01d126',
          conditionallyShow: false,
          requiredMessage: 'You must name your character!',
          readOnly: false,
          isDataLookup: true,
          isElementLookup: false,
          dataLookupId: 290,
          lookupButton: {
            icon: 'search',
            label: 'Find',
          },
          hintPosition: 'BELOW_LABEL',
          hint: '<div>Search for your character name to find pre-existing character data</div>',
        },
        {
          name: 'Age',
          label: 'Age',
          type: 'number',
          required: true,
          id: 'f468592a-cf58-4a98-a41b-b376ec267dac',
          conditionallyShow: false,
          readOnly: false,
          isDataLookup: false,
          isElementLookup: false,
          isSlider: false,
          isInteger: false,
        },
        {
          name: 'Email',
          label: 'Email',
          type: 'email',
          required: false,
          id: 'd0902113-3f77-4070-adbd-ca3ae95ce091',
          conditionallyShow: false,
          readOnly: false,
          isDataLookup: false,
          isElementLookup: false,
        },
        {
          name: 'Class',
          label: 'Class',
          type: 'select',
          required: false,
          id: 'f7652f9d-51ca-420b-a090-34ee1d7f53f6',
          conditionallyShow: false,
          optionsType: 'CUSTOM',
          conditionallyShowOptions: false,
          readOnly: false,
          isDataLookup: false,
          isElementLookup: false,
          multi: false,
          options: [
            {
              id: '80ea6679-3bba-4137-8e90-cfc1e3283714',
              label: 'Ranger',
              value: 'Ranger',
              displayAlways: false,
            },
            {
              id: 'e8dc3f35-938f-47b2-960b-645883e187c3',
              label: 'Warrior',
              value: 'Warrior',
              displayAlways: false,
            },
            {
              id: '1de4bbcc-58d3-4a70-a338-0343fdf2be58',
              label: 'Mage',
              value: 'Mage',
              displayAlways: false,
            },
            {
              id: '0774915f-55dd-4ea6-b608-1b2515af2bbd',
              label: 'Guardian',
              value: 'Guardian',
              displayAlways: false,
            },
            {
              id: 'a041eed8-c35a-4abd-8a67-6463b393d604',
              label: 'Necromancer',
              value: 'Necromancer',
              displayAlways: false,
            },
          ],
        },
        {
          name: 'Files',
          label: 'Files',
          type: 'files',
          id: 'acb19322-5225-4b6b-a055-99c07df4038c',
          conditionallyShow: false,
          storageType: 'private',
          readOnly: false,
          restrictFileTypes: false,
          allowExtensionlessAttachments: false,
          isDataLookup: false,
          isElementLookup: false,
        },
        {
          label: 'Backstory',
          type: 'section',
          id: 'b463630b-4f20-4afb-8ec8-4d66f80c5364',
          conditionallyShow: false,
          elements: [
            {
              name: 'Background',
              label: 'Background',
              type: 'textarea',
              required: false,
              id: 'f0070c1d-467c-42f2-b0e2-fc9fa1aa86eb',
              conditionallyShow: false,
              readOnly: false,
              isDataLookup: false,
              isElementLookup: false,
            },
          ],
          isCollapsed: false,
        },
        {
          name: 'Set',
          label: 'Set',
          type: 'repeatableSet',
          id: '18dcd3e0-6e2f-462e-803b-e24562d9fa6d',
          conditionallyShow: false,
          elements: [
            {
              name: 'SetText',
              label: 'SetText',
              type: 'text',
              required: false,
              id: 'f128138b-b6f5-4856-9e6c-9b3013b16c1b',
              conditionallyShow: false,
              readOnly: false,
              isDataLookup: false,
              isElementLookup: false,
            },
            {
              name: 'Set_2',
              label: 'Set 2',
              type: 'repeatableSet',
              id: '4f54c954-7340-4be9-b8fc-3cfddaab26f7',
              conditionallyShow: false,
              elements: [
                {
                  name: 'SetText_2',
                  label: 'SetText 2',
                  type: 'text',
                  required: false,
                  id: '286283f1-75eb-4225-be4e-05975cc47453',
                  conditionallyShow: false,
                  readOnly: false,
                  isDataLookup: false,
                  isElementLookup: false,
                },
                {
                  name: 'SetNum_2',
                  label: 'SetNum 2',
                  type: 'number',
                  required: false,
                  id: 'c36ba384-23f5-402e-b9fb-4df0e94f1fa7',
                  conditionallyShow: false,
                  readOnly: false,
                  isDataLookup: false,
                  isElementLookup: false,
                  isSlider: false,
                  isInteger: false,
                },
              ],
              readOnly: false,
            },
          ],
          readOnly: false,
        },
        {
          name: 'Select',
          label: 'Select',
          type: 'select',
          required: false,
          id: 'ad7ff12d-57f3-44a8-999b-d1716ed4e988',
          conditionallyShow: false,
          options: [
            {
              id: '1edcce9e-3635-407b-8adc-ce614fde742c',
              label: '{ELEMENT:Name}, {ELEMENT:Set|Set_2|SetText_2}',
              value: '{ELEMENT:Email} | {ELEMENT:Set|Set_2|SetNum_2}',
              displayAlways: false,
            },
          ],
          readOnly: false,
          isDataLookup: false,
          isElementLookup: false,
          multi: false,
          optionsType: 'CUSTOM',
          conditionallyShowOptions: false,
        },
      ],
    })

    expect(options.length).toBe(2)
    expect(options[0].label).toBe('John, First Text')
    expect(options[0].value).toBe('john@smith.com | 1')
    expect(options[1].label).toBe('John, Second Text')
    expect(options[1].value).toBe('john@smith.com | 2')
  })
})
