import { convictValidateTrafficSplitting } from './validate-traffic-splitting.js'

describe('#convictValidateTrafficSplitting', () => {
  describe('coerce', () => {
    test('Should parse a serialized JSON string into an array', () => {
      const result = convictValidateTrafficSplitting.coerce(
        '[{"value":"TB15","sharepoint":100,"salesforce":0}]'
      )

      expect(result).toEqual([
        { value: 'TB15', sharepoint: 100, salesforce: 0 }
      ])
    })

    test('Should return non-string values unchanged', () => {
      const input = [{ value: 'TB15', sharepoint: 100, salesforce: 0 }]

      expect(convictValidateTrafficSplitting.coerce(input)).toBe(input)
    })

    test('Should throw for malformed JSON', () => {
      expect(() =>
        convictValidateTrafficSplitting.coerce('{not json')
      ).toThrow()
    })
  })

  describe('validate', () => {
    test('With an empty array, Should not throw', () => {
      expect(() => convictValidateTrafficSplitting.validate([])).not.toThrow()
    })

    test('With valid entries totalling 100, Should not throw', () => {
      expect(() =>
        convictValidateTrafficSplitting.validate([
          { value: 'TB15', sharepoint: 100, salesforce: 0 },
          { value: 'TB16', sharepoint: 60, salesforce: 40 },
          { value: 'TB24c', sharepoint: 0, salesforce: 100 }
        ])
      ).not.toThrow()
    })

    test.each([
      ['below 100', 50, 49],
      ['above 100', 99, 10]
    ])(
      'With percentages totalling %s, Should throw',
      (_, sharepoint, salesforce) => {
        expect(() =>
          convictValidateTrafficSplitting.validate([
            { value: 'TB15', sharepoint, salesforce }
          ])
        ).toThrow('sharepoint and salesforce must total 100')
      }
    )

    test('With one invalid entry among valid ones, Should throw', () => {
      expect(() =>
        convictValidateTrafficSplitting.validate([
          { value: 'TB15', sharepoint: 100, salesforce: 0 },
          { value: 'TB16', sharepoint: 90, salesforce: 20 }
        ])
      ).toThrow()
    })

    test.each([
      [
        'sharepoint above 100',
        { value: 'TB15', sharepoint: 101, salesforce: 0 }
      ],
      [
        'negative salesforce',
        { value: 'TB15', sharepoint: 101, salesforce: -1 }
      ],
      ['missing value', { sharepoint: 100, salesforce: 0 }],
      ['missing sharepoint', { value: 'TB15', salesforce: 100 }],
      ['missing salesforce', { value: 'TB15', sharepoint: 100 }],
      [
        'non-numeric percentage',
        { value: 'TB15', sharepoint: 'a', salesforce: 0 }
      ]
    ])('With %s, Should throw', (_, entry) => {
      expect(() => convictValidateTrafficSplitting.validate([entry])).toThrow()
    })

    test('With a non-array value, Should throw', () => {
      expect(() =>
        convictValidateTrafficSplitting.validate({
          value: 'TB15',
          sharepoint: 100,
          salesforce: 0
        })
      ).toThrow()
    })
  })
})
