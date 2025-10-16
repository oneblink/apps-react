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

  it('should return no options if any of the replaceable parameters are missing', () => {
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

  it('should allow root elements to inject options into nested repeatable sets', () => {
    const options = [
      ...processInjectableOption({
        option: {
          id: '9fb5ad84-4f3e-4e00-b245-7e1f6d7364a5',
          label: '{ELEMENT:Name}',
          value: '{ELEMENT:Name}',
          displayAlways: false,
        },
        submission: {},
        formElements: [
          {
            name: 'Description',
            label: 'Description',
            type: 'text',
            required: false,
            id: '0746e268-1a39-4bda-a0a4-b9dee05ca101',
            conditionallyShow: false,
            readOnly: false,
            isDataLookup: false,
            isElementLookup: false,
          },
          {
            name: 'Name_or_Email',
            label: 'Name or Email',
            type: 'radio',
            required: false,
            id: 'c7ac663f-dd40-49aa-8066-d733f55656f2',
            conditionallyShow: false,
            options: [
              {
                id: '9fb5ad84-4f3e-4e00-b245-7e1f6d7364a5',
                label: '{ELEMENT:Name}',
                value: '{ELEMENT:Name}',
                displayAlways: false,
              },
              {
                id: '696be191-098f-42e9-9029-161ca7d9894e',
                label: '{ELEMENT:Email}',
                value: '{ELEMENT:Email}',
                displayAlways: false,
              },
            ],
            readOnly: false,
            isDataLookup: false,
            isElementLookup: false,
            buttons: false,
            optionsType: 'CUSTOM',
            conditionallyShowOptions: false,
          },
        ],
        contextSubmission: {
          Name: 'Ryan',
          Email: 'ryan@oneblink.io',
          Repeatable_Set: [{}],
        },

        ...otherArgs,
      }),
      ...processInjectableOption({
        option: {
          id: '696be191-098f-42e9-9029-161ca7d9894e',
          label: '{ELEMENT:Email}',
          value: '{ELEMENT:Email}',
          displayAlways: false,
        },
        submission: {},
        formElements: [
          {
            name: 'Description',
            label: 'Description',
            type: 'text',
            required: false,
            id: '0746e268-1a39-4bda-a0a4-b9dee05ca101',
            conditionallyShow: false,
            readOnly: false,
            isDataLookup: false,
            isElementLookup: false,
          },
          {
            name: 'Name_or_Email',
            label: 'Name or Email',
            type: 'radio',
            required: false,
            id: 'c7ac663f-dd40-49aa-8066-d733f55656f2',
            conditionallyShow: false,
            options: [
              {
                id: '9fb5ad84-4f3e-4e00-b245-7e1f6d7364a5',
                label: '{ELEMENT:Name}',
                value: '{ELEMENT:Name}',
                displayAlways: false,
              },
              {
                id: '696be191-098f-42e9-9029-161ca7d9894e',
                label: '{ELEMENT:Email}',
                value: '{ELEMENT:Email}',
                displayAlways: false,
              },
            ],
            readOnly: false,
            isDataLookup: false,
            isElementLookup: false,
            buttons: false,
            optionsType: 'CUSTOM',
            conditionallyShowOptions: false,
          },
        ],
        contextSubmission: {
          Name: 'Ryan',
          Email: 'ryan@oneblink.io',
          Repeatable_Set: [{}],
        },

        ...otherArgs,
      }),
    ]

    expect(options).toEqual([
      {
        id: '9fb5ad84-4f3e-4e00-b245-7e1f6d7364a5',
        label: 'Ryan',
        value: 'Ryan',
        displayAlways: false,
      },
      {
        id: '696be191-098f-42e9-9029-161ca7d9894e',
        label: 'ryan@oneblink.io',
        value: 'ryan@oneblink.io',
        displayAlways: false,
      },
    ])
  })

  it('should allow injected options based on other form element values', () => {
    const options = [
      ...processInjectableOption({
        option: {
          id: '05324017-4598-4a4a-b08c-2efb096216aa',
          label: '{ELEMENT:First_Name} {ELEMENT:Last_Name}',
          value: '{ELEMENT:Email}',
          displayAlways: false,
        },
        submission: {
          Show_Why: false,
          First_Name: 'Ryan',
          Last_Name: 'Button',
          Email: 'ryan@oneblink.io',
          People: [
            {
              First_Name: 'Big',
              Last_Name: 'Greg',
              Email: 'greg@greg.com',
            },
            {
              First_Name: 'Terry',
              Last_Name: 'Chap',
              Email: 'tez@tez.com',
            },
          ],
        },
        formElements: [
          {
            id: 'e9af56ca-17e9-42b3-8098-956d7ba1e38f',
            label: 'Page 1',
            type: 'page',
            conditionallyShow: false,
            requiresAllConditionallyShowPredicates: false,
            elements: [
              {
                name: 'Show_Why',
                label: 'Show Why?',
                type: 'boolean',
                required: false,
                id: 'e4eb86b2-91b1-4df4-980e-30bb52b224f7',
                conditionallyShow: false,
                readOnly: false,
                isDataLookup: false,
                isElementLookup: false,
                defaultValue: false,
              },
              {
                label: 'Section On Page One',
                type: 'section',
                id: '31151149-f044-4757-9522-70c13e1fbb8a',
                conditionallyShow: false,
                elements: [
                  {
                    name: 'First_Name',
                    label: 'First Name',
                    type: 'text',
                    required: false,
                    id: '4d73866a-859f-4d2f-b492-4c95aceebeaa',
                    conditionallyShow: false,
                    readOnly: false,
                    isDataLookup: false,
                    isElementLookup: false,
                  },
                  {
                    name: 'Last_Name',
                    label: 'Last Name',
                    type: 'text',
                    required: false,
                    id: '9fd33cd2-4d16-4c2e-9937-52b6eb1d0e68',
                    conditionallyShow: false,
                    readOnly: false,
                    isDataLookup: false,
                    isElementLookup: false,
                  },
                  {
                    name: 'Email',
                    label: 'Email',
                    type: 'email',
                    required: false,
                    id: '8a881370-21ee-4a2b-b0ca-00352857c303',
                    conditionallyShow: false,
                    readOnly: false,
                    isDataLookup: false,
                    isElementLookup: false,
                    requiresConfirmation: false,
                  },
                ],
                canCollapseFromBottom: true,
                isCollapsed: false,
              },
              {
                name: 'People',
                label: 'People',
                type: 'repeatableSet',
                id: 'b00a07d0-3617-43e6-963e-3edb7984bbed',
                conditionallyShow: false,
                elements: [
                  {
                    name: 'First_Name',
                    label: 'First Name',
                    type: 'text',
                    required: false,
                    id: '2154f99f-e036-48f2-81e0-5847533553c0',
                    conditionallyShow: false,
                    readOnly: false,
                    isDataLookup: false,
                    isElementLookup: false,
                  },
                  {
                    name: 'Last_Name',
                    label: 'Last Name',
                    type: 'text',
                    required: false,
                    id: '6b48742c-1da0-4eb4-a682-01cfe2a8e98b',
                    conditionallyShow: false,
                    readOnly: false,
                    isDataLookup: false,
                    isElementLookup: false,
                  },
                  {
                    name: 'Email',
                    label: 'Email',
                    type: 'email',
                    required: false,
                    id: '33ed454b-8cfc-4d29-9419-50330845e344',
                    conditionallyShow: false,
                    readOnly: false,
                    isDataLookup: false,
                    isElementLookup: false,
                    requiresConfirmation: false,
                  },
                ],
                layout: 'MULTIPLE_ADD_BUTTONS',
                readOnly: false,
              },
            ],
          },
          {
            id: '03733754-80b8-4d32-ad2a-9e2bc70be9b1',
            label: 'Page 2',
            type: 'page',
            conditionallyShow: false,
            requiresAllConditionallyShowPredicates: false,
            elements: [
              {
                label: 'Section On Page Two',
                type: 'section',
                id: '8b3b237e-3b95-4a6f-8791-9e39c9faf89a',
                conditionallyShow: false,
                elements: [
                  {
                    name: 'Selected_Person',
                    label: 'Who?',
                    type: 'checkboxes',
                    required: false,
                    id: '5ae84dda-8bdd-4457-bcdb-0ce9a2a384ff',
                    conditionallyShow: false,
                    options: [
                      {
                        id: '05324017-4598-4a4a-b08c-2efb096216aa',
                        label: '{ELEMENT:First_Name} {ELEMENT:Last_Name}',
                        value: '{ELEMENT:Email}',
                        displayAlways: false,
                      },
                      {
                        id: '6d3bcc9b-e58c-493c-a5ec-e62b4d8a3ce5',
                        label:
                          '{ELEMENT:People|First_Name} {ELEMENT:People|Last_Name}',
                        value: '{ELEMENT:People|Email}',
                        displayAlways: false,
                      },
                      {
                        id: 'ae22bd01-6d6a-4291-9c61-babfce3cd175',
                        label: 'Unknown',
                        value: 'Unknown',
                        displayAlways: false,
                      },
                    ],
                    readOnly: false,
                    isDataLookup: false,
                    isElementLookup: false,
                    buttons: false,
                    optionsType: 'CUSTOM',
                    conditionallyShowOptions: false,
                    canToggleAll: false,
                  },
                ],
                canCollapseFromBottom: true,
                isCollapsed: false,
              },
            ],
          },
        ],
        contextSubmission: {
          Show_Why: false,
          First_Name: 'Ryan',
          Last_Name: 'Button',
          Email: 'ryan@oneblink.io',
          People: [
            {
              First_Name: 'Big',
              Last_Name: 'Greg',
              Email: 'greg@greg.com',
            },
            {
              First_Name: 'Terry',
              Last_Name: 'Chap',
              Email: 'tez@tez.com',
            },
          ],
        },
        taskContext: {
          task: undefined,
          taskGroup: undefined,
          taskGroupInstance: undefined,
        },
        userProfile: undefined,
      }),
      ...processInjectableOption({
        option: {
          id: '6d3bcc9b-e58c-493c-a5ec-e62b4d8a3ce5',
          label: '{ELEMENT:People|First_Name} {ELEMENT:People|Last_Name}',
          value: '{ELEMENT:People|Email}',
          displayAlways: false,
        },
        submission: {
          Show_Why: false,
          First_Name: 'Ryan',
          Last_Name: 'Button',
          Email: 'ryan@oneblink.io',
          People: [
            {
              First_Name: 'Big',
              Last_Name: 'Greg',
              Email: 'greg@greg.com',
            },
            {
              First_Name: 'Terry',
              Last_Name: 'Chap',
              Email: 'tez@tez.com',
            },
          ],
        },
        formElements: [
          {
            id: 'e9af56ca-17e9-42b3-8098-956d7ba1e38f',
            label: 'Page 1',
            type: 'page',
            conditionallyShow: false,
            requiresAllConditionallyShowPredicates: false,
            elements: [
              {
                name: 'Show_Why',
                label: 'Show Why?',
                type: 'boolean',
                required: false,
                id: 'e4eb86b2-91b1-4df4-980e-30bb52b224f7',
                conditionallyShow: false,
                readOnly: false,
                isDataLookup: false,
                isElementLookup: false,
                defaultValue: false,
              },
              {
                label: 'Section On Page One',
                type: 'section',
                id: '31151149-f044-4757-9522-70c13e1fbb8a',
                conditionallyShow: false,
                elements: [
                  {
                    name: 'First_Name',
                    label: 'First Name',
                    type: 'text',
                    required: false,
                    id: '4d73866a-859f-4d2f-b492-4c95aceebeaa',
                    conditionallyShow: false,
                    readOnly: false,
                    isDataLookup: false,
                    isElementLookup: false,
                  },
                  {
                    name: 'Last_Name',
                    label: 'Last Name',
                    type: 'text',
                    required: false,
                    id: '9fd33cd2-4d16-4c2e-9937-52b6eb1d0e68',
                    conditionallyShow: false,
                    readOnly: false,
                    isDataLookup: false,
                    isElementLookup: false,
                  },
                  {
                    name: 'Email',
                    label: 'Email',
                    type: 'email',
                    required: false,
                    id: '8a881370-21ee-4a2b-b0ca-00352857c303',
                    conditionallyShow: false,
                    readOnly: false,
                    isDataLookup: false,
                    isElementLookup: false,
                    requiresConfirmation: false,
                  },
                ],
                canCollapseFromBottom: true,
                isCollapsed: false,
              },
              {
                name: 'People',
                label: 'People',
                type: 'repeatableSet',
                id: 'b00a07d0-3617-43e6-963e-3edb7984bbed',
                conditionallyShow: false,
                elements: [
                  {
                    name: 'First_Name',
                    label: 'First Name',
                    type: 'text',
                    required: false,
                    id: '2154f99f-e036-48f2-81e0-5847533553c0',
                    conditionallyShow: false,
                    readOnly: false,
                    isDataLookup: false,
                    isElementLookup: false,
                  },
                  {
                    name: 'Last_Name',
                    label: 'Last Name',
                    type: 'text',
                    required: false,
                    id: '6b48742c-1da0-4eb4-a682-01cfe2a8e98b',
                    conditionallyShow: false,
                    readOnly: false,
                    isDataLookup: false,
                    isElementLookup: false,
                  },
                  {
                    name: 'Email',
                    label: 'Email',
                    type: 'email',
                    required: false,
                    id: '33ed454b-8cfc-4d29-9419-50330845e344',
                    conditionallyShow: false,
                    readOnly: false,
                    isDataLookup: false,
                    isElementLookup: false,
                    requiresConfirmation: false,
                  },
                ],
                layout: 'MULTIPLE_ADD_BUTTONS',
                readOnly: false,
              },
            ],
          },
          {
            id: '03733754-80b8-4d32-ad2a-9e2bc70be9b1',
            label: 'Page 2',
            type: 'page',
            conditionallyShow: false,
            requiresAllConditionallyShowPredicates: false,
            elements: [
              {
                label: 'Section On Page Two',
                type: 'section',
                id: '8b3b237e-3b95-4a6f-8791-9e39c9faf89a',
                conditionallyShow: false,
                elements: [
                  {
                    name: 'Selected_Person',
                    label: 'Who?',
                    type: 'checkboxes',
                    required: false,
                    id: '5ae84dda-8bdd-4457-bcdb-0ce9a2a384ff',
                    conditionallyShow: false,
                    options: [
                      {
                        id: '05324017-4598-4a4a-b08c-2efb096216aa',
                        label: '{ELEMENT:First_Name} {ELEMENT:Last_Name}',
                        value: '{ELEMENT:Email}',
                        displayAlways: false,
                      },
                      {
                        id: '6d3bcc9b-e58c-493c-a5ec-e62b4d8a3ce5',
                        label:
                          '{ELEMENT:People|First_Name} {ELEMENT:People|Last_Name}',
                        value: '{ELEMENT:People|Email}',
                        displayAlways: false,
                      },
                      {
                        id: 'ae22bd01-6d6a-4291-9c61-babfce3cd175',
                        label: 'Unknown',
                        value: 'Unknown',
                        displayAlways: false,
                      },
                    ],
                    readOnly: false,
                    isDataLookup: false,
                    isElementLookup: false,
                    buttons: false,
                    optionsType: 'CUSTOM',
                    conditionallyShowOptions: false,
                    canToggleAll: false,
                  },
                ],
                canCollapseFromBottom: true,
                isCollapsed: false,
              },
            ],
          },
        ],
        contextSubmission: {
          Show_Why: false,
          First_Name: 'Ryan',
          Last_Name: 'Button',
          Email: 'ryan@oneblink.io',
          People: [
            {
              First_Name: 'Big',
              Last_Name: 'Greg',
              Email: 'greg@greg.com',
            },
            {
              First_Name: 'Terry',
              Last_Name: 'Chap',
              Email: 'tez@tez.com',
            },
          ],
        },
        taskContext: {
          task: undefined,
          taskGroup: undefined,
          taskGroupInstance: undefined,
        },
        userProfile: undefined,
      }),
      ...processInjectableOption({
        option: {
          id: 'ae22bd01-6d6a-4291-9c61-babfce3cd175',
          label: 'Unknown',
          value: 'Unknown',
          displayAlways: false,
        },
        submission: {
          Show_Why: false,
          First_Name: 'Ryan',
          Last_Name: 'Button',
          Email: 'ryan@oneblink.io',
          People: [
            {
              First_Name: 'Big',
              Last_Name: 'Greg',
              Email: 'greg@greg.com',
            },
            {
              First_Name: 'Terry',
              Last_Name: 'Chap',
              Email: 'tez@tez.com',
            },
          ],
        },
        formElements: [
          {
            id: 'e9af56ca-17e9-42b3-8098-956d7ba1e38f',
            label: 'Page 1',
            type: 'page',
            conditionallyShow: false,
            requiresAllConditionallyShowPredicates: false,
            elements: [
              {
                name: 'Show_Why',
                label: 'Show Why?',
                type: 'boolean',
                required: false,
                id: 'e4eb86b2-91b1-4df4-980e-30bb52b224f7',
                conditionallyShow: false,
                readOnly: false,
                isDataLookup: false,
                isElementLookup: false,
                defaultValue: false,
              },
              {
                label: 'Section On Page One',
                type: 'section',
                id: '31151149-f044-4757-9522-70c13e1fbb8a',
                conditionallyShow: false,
                elements: [
                  {
                    name: 'First_Name',
                    label: 'First Name',
                    type: 'text',
                    required: false,
                    id: '4d73866a-859f-4d2f-b492-4c95aceebeaa',
                    conditionallyShow: false,
                    readOnly: false,
                    isDataLookup: false,
                    isElementLookup: false,
                  },
                  {
                    name: 'Last_Name',
                    label: 'Last Name',
                    type: 'text',
                    required: false,
                    id: '9fd33cd2-4d16-4c2e-9937-52b6eb1d0e68',
                    conditionallyShow: false,
                    readOnly: false,
                    isDataLookup: false,
                    isElementLookup: false,
                  },
                  {
                    name: 'Email',
                    label: 'Email',
                    type: 'email',
                    required: false,
                    id: '8a881370-21ee-4a2b-b0ca-00352857c303',
                    conditionallyShow: false,
                    readOnly: false,
                    isDataLookup: false,
                    isElementLookup: false,
                    requiresConfirmation: false,
                  },
                ],
                canCollapseFromBottom: true,
                isCollapsed: false,
              },
              {
                name: 'People',
                label: 'People',
                type: 'repeatableSet',
                id: 'b00a07d0-3617-43e6-963e-3edb7984bbed',
                conditionallyShow: false,
                elements: [
                  {
                    name: 'First_Name',
                    label: 'First Name',
                    type: 'text',
                    required: false,
                    id: '2154f99f-e036-48f2-81e0-5847533553c0',
                    conditionallyShow: false,
                    readOnly: false,
                    isDataLookup: false,
                    isElementLookup: false,
                  },
                  {
                    name: 'Last_Name',
                    label: 'Last Name',
                    type: 'text',
                    required: false,
                    id: '6b48742c-1da0-4eb4-a682-01cfe2a8e98b',
                    conditionallyShow: false,
                    readOnly: false,
                    isDataLookup: false,
                    isElementLookup: false,
                  },
                  {
                    name: 'Email',
                    label: 'Email',
                    type: 'email',
                    required: false,
                    id: '33ed454b-8cfc-4d29-9419-50330845e344',
                    conditionallyShow: false,
                    readOnly: false,
                    isDataLookup: false,
                    isElementLookup: false,
                    requiresConfirmation: false,
                  },
                ],
                layout: 'MULTIPLE_ADD_BUTTONS',
                readOnly: false,
              },
            ],
          },
          {
            id: '03733754-80b8-4d32-ad2a-9e2bc70be9b1',
            label: 'Page 2',
            type: 'page',
            conditionallyShow: false,
            requiresAllConditionallyShowPredicates: false,
            elements: [
              {
                label: 'Section On Page Two',
                type: 'section',
                id: '8b3b237e-3b95-4a6f-8791-9e39c9faf89a',
                conditionallyShow: false,
                elements: [
                  {
                    name: 'Selected_Person',
                    label: 'Who?',
                    type: 'checkboxes',
                    required: false,
                    id: '5ae84dda-8bdd-4457-bcdb-0ce9a2a384ff',
                    conditionallyShow: false,
                    options: [
                      {
                        id: '05324017-4598-4a4a-b08c-2efb096216aa',
                        label: '{ELEMENT:First_Name} {ELEMENT:Last_Name}',
                        value: '{ELEMENT:Email}',
                        displayAlways: false,
                      },
                      {
                        id: '6d3bcc9b-e58c-493c-a5ec-e62b4d8a3ce5',
                        label:
                          '{ELEMENT:People|First_Name} {ELEMENT:People|Last_Name}',
                        value: '{ELEMENT:People|Email}',
                        displayAlways: false,
                      },
                      {
                        id: 'ae22bd01-6d6a-4291-9c61-babfce3cd175',
                        label: 'Unknown',
                        value: 'Unknown',
                        displayAlways: false,
                      },
                    ],
                    readOnly: false,
                    isDataLookup: false,
                    isElementLookup: false,
                    buttons: false,
                    optionsType: 'CUSTOM',
                    conditionallyShowOptions: false,
                    canToggleAll: false,
                  },
                ],
                canCollapseFromBottom: true,
                isCollapsed: false,
              },
            ],
          },
        ],
        contextSubmission: {
          Show_Why: false,
          First_Name: 'Ryan',
          Last_Name: 'Button',
          Email: 'ryan@oneblink.io',
          People: [
            {
              First_Name: 'Big',
              Last_Name: 'Greg',
              Email: 'greg@greg.com',
            },
            {
              First_Name: 'Terry',
              Last_Name: 'Chap',
              Email: 'tez@tez.com',
            },
          ],
        },
        taskContext: {
          task: undefined,
          taskGroup: undefined,
          taskGroupInstance: undefined,
        },
        userProfile: undefined,
      }),
    ]

    const strippedOptions = options.map((o) => ({ ...o, id: undefined }))

    expect(strippedOptions).toEqual([
      {
        label: 'Ryan Button',
        value: 'ryan@oneblink.io',
        displayAlways: false,
      },
      {
        label: 'Big Greg',
        value: 'greg@greg.com',
        displayAlways: false,
      },
      {
        label: 'Terry Chap',
        value: 'tez@tez.com',
        displayAlways: false,
      },
      {
        label: 'Unknown',
        value: 'Unknown',
        displayAlways: false,
      },
    ])
  })
})
