import processInjectableOption from '../../src/services/injectableOptions'
const otherArgs = {
  taskContext: {
    task: undefined,
    taskGroup: undefined,
    taskGroupInstance: undefined,
  },
  userProfile: {
    userId: 'userId',
    username: 'username',
    email: 'user@name.com',
  },
}
describe('processInjectableOption()', () => {
  it('should return user information', () => {
    const options = processInjectableOption({
      option: {
        id: '1edcce9e-3635-407b-8adc-ce614fde742c',
        label: '{USER:email}',
        value: '{USER:username}',
      },
      submission: {},
      formElements: [],
      ...otherArgs,
    })

    expect(options).toEqual([
      {
        id: '1edcce9e-3635-407b-8adc-ce614fde742c',
        label: otherArgs.userProfile.email,
        value: otherArgs.userProfile.username,
      },
    ])
  })

  it.skip('should return no options if any of the replaceable parameters are missing', () => {
    const options = processInjectableOption({
      option: {
        id: '1edcce9e-3635-407b-8adc-ce614fde742c',
        label: '{ELEMENT:First_Name} {ELEMENT:Last_Name}',
        value: '{ELEMENT:Email}',
      },
      submission: {
        First_Name: 'John',
        Last_Name: undefined,
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
      ...otherArgs,
    })

    expect(options).toEqual([])
  })

  it('should return correct values for root element', () => {
    const options = processInjectableOption({
      option: {
        id: '1edcce9e-3635-407b-8adc-ce614fde742c',
        label: '{ELEMENT:First_Name} {ELEMENT:Last_Name}',
        value: '{ELEMENT:Email}',
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
      ...otherArgs,
    })

    expect(options).toEqual([
      {
        id: '1edcce9e-3635-407b-8adc-ce614fde742c',
        label: 'John Smith',
        value: 'john@smith.com',
      },
    ])
  })

  it('should return correct values for root element with repeatable set entries. (De-duplication)', () => {
    const options = processInjectableOption({
      option: {
        id: '1edcce9e-3635-407b-8adc-ce614fde742c',
        label: '{ELEMENT:Name}, {ELEMENT:Set|SetText}',
        value: '{ELEMENT:Email}',
      },
      submission: {
        Name: 'John',
        Email: 'john@smith.com',
        Set: [
          {
            SetText: 'Letter A',
          },
          {
            SetText: 'Letter B',
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
              label: '{ELEMENT:Name}, {ELEMENT:Set|SetText}',
              value: '{ELEMENT:Email}',
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
      ...otherArgs,
    })

    expect(options).toEqual([
      {
        id: '1edcce9e-3635-407b-8adc-ce614fde742c',
        label: 'John, Letter A',
        value: 'john@smith.com',
      },
    ])
  })

  it('should return correct values for root element with repeatable set entries.', () => {
    const options = processInjectableOption({
      option: {
        id: '1edcce9e-3635-407b-8adc-ce614fde742c',
        label: '{ELEMENT:Name}, {ELEMENT:Set|SetText}',
        value: '{ELEMENT:Set|SetText}',
      },
      submission: {
        Name: 'John',
        Email: 'john@smith.com',
        Set: [
          {
            SetText: 'Letter A',
          },
          {
            SetText: 'Letter B',
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
              label: '{ELEMENT:Name}, {ELEMENT:Set|SetText}',
              value: '{ELEMENT:Set|SetText}',
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
      ...otherArgs,
    })

    expect(options.length).toBe(2)
    expect(options[0].label).toBe('John, Letter A')
    expect(options[0].value).toBe('Letter A')
    expect(options[1].label).toBe('John, Letter B')
    expect(options[1].value).toBe('Letter B')
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
          {
            Set_2: [
              {
                SetText_2: 'Third Text',
                SetNum_2: 3,
              },
              {
                SetText_2: 'Fourth Text',
                SetNum_2: 4,
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
      ...otherArgs,
    })

    expect(options.length).toBe(4)
    expect(options[0].label).toBe('John, First Text')
    expect(options[0].value).toBe('john@smith.com | 1')
    expect(options[1].label).toBe('John, Second Text')
    expect(options[1].value).toBe('john@smith.com | 2')
    expect(options[2].label).toBe('John, Third Text')
    expect(options[2].value).toBe('john@smith.com | 3')
    expect(options[3].label).toBe('John, Fourth Text')
    expect(options[3].value).toBe('john@smith.com | 4')
  })

  it('should return correct values for root element with repeatable set entries and nested repeatable set entries', () => {
    const options = processInjectableOption({
      option: {
        id: '1edcce9e-3635-407b-8adc-ce614fde742c',
        label:
          '{ELEMENT:Name}, {ELEMENT:Parents|Parent_Nickname} + {ELEMENT:Parents|Grand_Parents|Grand_Parent_Nickname}',
        value:
          '{ELEMENT:Email} | {ELEMENT:Parents|Grand_Parents|Grand_Parent_Age}',
      },
      submission: {
        Name: 'John',
        Email: 'john@smith.com',
        Parents: [
          {
            Parent_Nickname: 'Mum',
            Grand_Parents: [
              {
                Grand_Parent_Nickname: 'Grandma',
                Grand_Parent_Age: 1,
              },
              {
                Grand_Parent_Nickname: 'Grandpa',
                Grand_Parent_Age: 2,
              },
            ],
          },
          {
            Parent_Nickname: 'Dad',
            Grand_Parents: [
              {
                Grand_Parent_Nickname: 'Granny',
                Grand_Parent_Age: 3,
              },
              {
                Grand_Parent_Nickname: 'Pop',
                Grand_Parent_Age: 4,
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
          name: 'Parents',
          label: 'Parents',
          type: 'repeatableSet',
          id: '18dcd3e0-6e2f-462e-803b-e24562d9fa6d',
          conditionallyShow: false,
          elements: [
            {
              name: 'Parent_Nickname',
              label: 'Parent Nickname',
              type: 'text',
              required: false,
              id: 'f128138b-b6f5-4856-9e6c-9b3013b16c1b',
              conditionallyShow: false,
              readOnly: false,
              isDataLookup: false,
              isElementLookup: false,
            },
            {
              name: 'Grand_Parents',
              label: 'Grand Parents',
              type: 'repeatableSet',
              id: '4f54c954-7340-4be9-b8fc-3cfddaab26f7',
              conditionallyShow: false,
              elements: [
                {
                  name: 'Grand_Parent_Nickname',
                  label: 'GrandParent Nickname',
                  type: 'text',
                  required: false,
                  id: '286283f1-75eb-4225-be4e-05975cc47453',
                  conditionallyShow: false,
                  readOnly: false,
                  isDataLookup: false,
                  isElementLookup: false,
                },
                {
                  name: 'Grand_Parent_Age',
                  label: 'Grand Parent Age',
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
              label:
                '{ELEMENT:Name}, {ELEMENT:Parents|Parent_Nickname} + {ELEMENT:Parents|Grand_Parents|Grand_Parent_Nickname}',
              value:
                '{ELEMENT:Email} | {ELEMENT:Parents|Grand_Parents|Grand_Parent_Age}',
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
      ...otherArgs,
    })

    expect(options.length).toBe(4)
    expect(options[0].label).toBe('John, Mum + Grandma')
    expect(options[0].value).toBe('john@smith.com | 1')
    expect(options[1].label).toBe('John, Mum + Grandpa')
    expect(options[1].value).toBe('john@smith.com | 2')
    expect(options[2].label).toBe('John, Dad + Granny')
    expect(options[2].value).toBe('john@smith.com | 3')
    expect(options[3].label).toBe('John, Dad + Pop')
    expect(options[3].value).toBe('john@smith.com | 4')
  })
})
