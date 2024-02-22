import processInjectableOption from '../../src/services/injectableOptions'

describe('processInjectableOption()', () => {
  it('should return correct values for root element', () => {
    const options = processInjectableOption({
      option: {
        id: 'id',
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
          id: 'bef56860-60d7-11e9-8720-a17b00255555',
          name: 'Show_Selected_Person',
          type: 'boolean',
          label: 'Show "Why?"',
          isDataLookup: false,
          isElementLookup: false,
          required: false,
          conditionallyShow: false,
          defaultValue: true,
        },
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
})
