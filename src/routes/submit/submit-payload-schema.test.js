import { ApplicationSchema } from './submit-payload-schema.js'

const nameQuestion = {
  question: 'Name Question',
  questionKey: 'nameQuestionKey',
  answer: {
    type: 'name',
    value: { firstName: 'Name', lastName: 'Surname' },
    displayText: 'Name Surname'
  }
}
const fileQuestion = {
  question: 'File Question',
  questionKey: 'fileQuestionKey',
  answer: {
    type: 'file',
    value: { skipped: false, path: 'pathToFile' },
    displayText: 'file.pdf'
  }
}
const addressQuestion = {
  question: 'Address Question',
  questionKey: 'addressQuestionKey',
  answer: {
    type: 'address',
    value: {
      addressLine1: '123 Main St',
      addressTown: 'London',
      addressPostcode: 'SW1A 1AA'
    },
    displayText: '123 Main St, London, SW1A 1AA'
  }
}
const radioQuestion = {
  question: 'Radio Question',
  questionKey: 'radioQuestionKey',
  answer: {
    type: 'radio',
    value: 'yes',
    displayText: 'Yes'
  }
}
const checkboxQuestion = {
  question: 'Checkbox Question',
  questionKey: 'checkboxQuestionKey',
  answer: {
    type: 'checkbox',
    value: ['option1', 'option2'],
    displayText: 'Option 1, Option 2'
  }
}
const textQuestion = {
  question: 'Text Question',
  questionKey: 'textQuestionKey',
  answer: {
    type: 'text',
    value: 'some text',
    displayText: 'some text'
  }
}
const numberQuestion = {
  question: 'Number Question',
  questionKey: 'numberQuestionKey',
  answer: {
    type: 'number',
    value: 1,
    displayText: '1'
  }
}
const dateQuestion = {
  question: 'Date Question',
  questionKey: 'dateQuestionKey',
  answer: {
    type: 'date',
    value: { day: '01', month: '01', year: '2020' },
    displayText: '01/01/2020'
  }
}
const section = {
  sectionKey: 'sectionKey',
  title: 'Section Title',
  questionAnswers: [
    nameQuestion,
    fileQuestion,
    addressQuestion,
    radioQuestion,
    checkboxQuestion,
    textQuestion,
    numberQuestion,
    dateQuestion
  ]
}
const validPayload = {
  journeyId: 'journeyId',
  journeyVersion: { major: 1, minor: 0 },
  sections: [section]
}

const missingSectionsPayload = {
  journeyId: 'journeyId',
  journeyVersion: { major: 1, minor: 0 }
}

describe('ApplicationSchema - answer types', () => {
  describe('text answer', () => {
    it('validates a correct text answer', () => {
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [textQuestion]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeUndefined()
    })

    it('allows empty text value', () => {
      const emptyTextQuestion = {
        question: 'Empty Text Question',
        questionKey: 'emptyTextQuestionKey',
        answer: {
          type: 'text',
          value: '',
          displayText: 'some text'
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [emptyTextQuestion]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeUndefined()
    })

    it('fails if text answer value is not a string', () => {
      const textValueNotString = {
        question: 'Text Question',
        questionKey: 'textQuestionKey',
        answer: {
          type: 'text',
          value: 123,
          displayText: '123'
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [textValueNotString]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toEqual(
        '"sections[0].questionAnswers[0].answer.value" must be a string'
      )
    })

    it('fails if displayText is missing', () => {
      const missingPropertyQuestion = {
        question: 'Text Question',
        questionKey: 'textQuestionKey',
        answer: {
          type: 'text',
          value: 'some text'
          // displayText missing
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [missingPropertyQuestion]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toEqual(
        '"sections[0].questionAnswers[0].answer.displayText" is required'
      )
    })
  })

  describe('checkbox answer', () => {
    it('validates a correct checkbox answer', () => {
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [checkboxQuestion]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeUndefined()
    })

    it('allows empty checkbox value array', () => {
      const emptyCheckboxQuestion = {
        question: 'Empty Checkbox Question',
        questionKey: 'emptyCheckboxQuestionKey',
        answer: {
          type: 'checkbox',
          value: [],
          displayText: ''
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [emptyCheckboxQuestion]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeUndefined()
    })

    it('fails if checkbox value is not an array', () => {
      const invalidCheckboxQuestion = {
        question: 'Invalid Checkbox Question',
        questionKey: 'invalidCheckboxKey',
        answer: {
          type: 'checkbox',
          value: 'not-an-array',
          displayText: 'not-an-array'
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [invalidCheckboxQuestion]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toEqual(
        '"sections[0].questionAnswers[0].answer.value" must be an array'
      )
    })

    it('fails if displayText is missing', () => {
      const checkboxMissingDisplayText = {
        question: 'Checkbox Question',
        questionKey: 'checkboxQuestionKey',
        answer: {
          type: 'checkbox',
          value: ['option1', 'option2']
          // displayText missing
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [checkboxMissingDisplayText]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toEqual(
        '"sections[0].questionAnswers[0].answer.displayText" is required'
      )
    })
  })

  describe('radio answer', () => {
    it('validates a correct radio answer', () => {
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [radioQuestion]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeUndefined()
    })

    it('fails if radio value is missing', () => {
      const invalidRadioQuestion = {
        question: 'Invalid Radio Question',
        questionKey: 'invalidRadioKey',
        answer: {
          type: 'radio',
          // value missing
          displayText: 'Yes'
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [invalidRadioQuestion]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toEqual(
        '"sections[0].questionAnswers[0].answer.value" is required'
      )
    })

    it('fails if displayText is missing in radio answer', () => {
      const radioMissingDisplayText = {
        question: 'Radio Question',
        questionKey: 'radioQuestionKey',
        answer: {
          type: 'radio',
          value: 'yes'
          // displayText missing
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [radioMissingDisplayText]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toEqual(
        '"sections[0].questionAnswers[0].answer.displayText" is required'
      )
    })
  })

  describe('file answer', () => {
    it('validates a correct file answer', () => {
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [fileQuestion]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeUndefined()
    })

    it('allows a file answer with no path when skipped is true', () => {
      const fileSkippedNoPath = {
        question: 'File Skipped Question',
        questionKey: 'fileSkippedQuestionKey',
        answer: {
          type: 'file',
          value: { skipped: true },
          displayText: 'No file uploaded'
        }
      }
      const payloadSkippedNoPath = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [fileSkippedNoPath]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payloadSkippedNoPath)
      expect(error).toBeUndefined()
    })

    it('fails if file path is missing when skipped is false', () => {
      const fileNotSkippedNoPath = {
        question: 'File Not Skipped No Path',
        questionKey: 'fileNotSkippedNoPathKey',
        answer: {
          type: 'file',
          value: { skipped: false },
          displayText: 'file.pdf'
        }
      }
      const payloadNotSkippedNoPath = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [fileNotSkippedNoPath]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payloadNotSkippedNoPath)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toEqual(
        '"sections[0].questionAnswers[0].answer.value.path" is required'
      )
    })

    it('allows a file answer with path when skipped is false', () => {
      const fileNotSkippedWithPath = {
        question: 'File Not Skipped With Path',
        questionKey: 'fileNotSkippedWithPathKey',
        answer: {
          type: 'file',
          value: { skipped: false, path: 'pathToFile' },
          displayText: 'file.pdf'
        }
      }
      const payloadNotSkippedWithPath = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [fileNotSkippedWithPath]
          }
        ]
      }
      const { error: errorNotSkippedWithPath } = ApplicationSchema.validate(
        payloadNotSkippedWithPath
      )
      expect(errorNotSkippedWithPath).toBeUndefined()
    })

    it('fails if file answer value.skipped is missing', () => {
      const fileMissingSkipped = {
        question: 'File Question',
        questionKey: 'fileQuestionKey',
        answer: {
          type: 'file',
          value: { path: 'pathToFile' }, // skipped missing
          displayText: 'file.pdf'
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [fileMissingSkipped]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toEqual(
        '"sections[0].questionAnswers[0].answer.value.skipped" is required'
      )
    })

    it('fails if file answer value.skipped is not a boolean', () => {
      const fileSkippedNotBoolean = {
        question: 'File Question',
        questionKey: 'fileQuestionKey',
        answer: {
          type: 'file',
          value: { skipped: 'not-a-boolean', path: 'pathToFile' },
          displayText: 'file.pdf'
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [fileSkippedNotBoolean]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toEqual(
        '"sections[0].questionAnswers[0].answer.value.skipped" must be a boolean'
      )
    })

    it('fails if file answer value is not an object', () => {
      const fileValueNotObject = {
        question: 'File Question',
        questionKey: 'fileQuestionKey',
        answer: {
          type: 'file',
          value: 'not-an-object',
          displayText: 'file.pdf'
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [fileValueNotObject]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toEqual(
        '"sections[0].questionAnswers[0].answer.value" must be of type object'
      )
    })

    it('fails if file answer displayText is missing', () => {
      const fileMissingDisplayText = {
        question: 'File Question',
        questionKey: 'fileQuestionKey',
        answer: {
          type: 'file',
          value: { skipped: false, path: 'pathToFile' }
          // displayText missing
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [fileMissingDisplayText]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toEqual(
        '"sections[0].questionAnswers[0].answer.displayText" is required'
      )
    })
  })

  describe('address answer', () => {
    it('validates a correct address answer', () => {
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [addressQuestion]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeUndefined()
    })

    it('fails if address is missing required fields', () => {
      const incompleteAddressQuestion = {
        question: 'Incomplete Address Question',
        questionKey: 'incompleteAddressKey',
        answer: {
          type: 'address',
          value: {
            // addressLine1 missing
            addressTown: 'London'
            // addressPostcode missing
          },
          displayText: 'London, SW1A 1AA'
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [incompleteAddressQuestion]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error?.details.length).toEqual(2)
      expect(error?.details[0].message).toEqual(
        '"sections[0].questionAnswers[0].answer.value.addressLine1" is required'
      )
      expect(error?.details[1].message).toEqual(
        '"sections[0].questionAnswers[0].answer.value.addressPostcode" is required'
      )
    })

    it('allows address answer missing optional fields (addressLine2, addressCounty)', () => {
      const addressWithMissingOptionalFields = {
        question: 'Address Question',
        questionKey: 'addressQuestionKey',
        answer: {
          type: 'address',
          value: {
            addressLine1: '123 Main St',
            addressTown: 'London',
            addressPostcode: 'SW1A 1AA'
            // addressLine2 and addressCounty missing (optional)
          },
          displayText: '123 Main St, London, SW1A 1AA'
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [addressWithMissingOptionalFields]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeUndefined()
    })
  })

  describe('name answer', () => {
    it('validates a correct name answer', () => {
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [nameQuestion]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeUndefined()
    })

    it('fails if name answer value is not an object', () => {
      const nameValueNotObject = {
        question: 'Name Question',
        questionKey: 'nameQuestionKey',
        answer: {
          type: 'name',
          value: 'not-an-object',
          displayText: 'Name Surname'
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [nameValueNotObject]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toEqual(
        '"sections[0].questionAnswers[0].answer.value" must be of type object'
      )
    })

    it('fails if name answer is missing firstName', () => {
      const incompleteNameQuestion = {
        question: 'Incomplete Name Question',
        questionKey: 'incompleteNameKey',
        answer: {
          type: 'name',
          value: { lastName: 'Surname' }, // firstName missing
          displayText: 'Surname'
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [incompleteNameQuestion]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toEqual(
        '"sections[0].questionAnswers[0].answer.value.firstName" is required'
      )
    })

    it('fails if name answer is missing lastName', () => {
      const incompleteNameQuestion = {
        question: 'Incomplete Name Question',
        questionKey: 'incompleteNameKey',
        answer: {
          type: 'name',
          value: { firstName: 'Name' }, // lastName missing
          displayText: 'Name'
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [incompleteNameQuestion]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toEqual(
        '"sections[0].questionAnswers[0].answer.value.lastName" is required'
      )
    })

    it('fails if both firstName and lastName are missing', () => {
      const nameMissingBoth = {
        question: 'Name Question',
        questionKey: 'nameQuestionKey',
        answer: {
          type: 'name',
          value: {}, // both firstName and lastName missing
          displayText: ''
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [nameMissingBoth]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error?.details.length).toEqual(2)
      expect(error?.details[0].message).toEqual(
        '"sections[0].questionAnswers[0].answer.value.firstName" is required'
      )
      expect(error?.details[1].message).toEqual(
        '"sections[0].questionAnswers[0].answer.value.lastName" is required'
      )
    })

    it('fails if displayText is missing', () => {
      const nameMissingDisplayText = {
        question: 'Name Question',
        questionKey: 'nameQuestionKey',
        answer: {
          type: 'name',
          value: { firstName: 'Name', lastName: 'Surname' }
          // displayText missing
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [nameMissingDisplayText]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toEqual(
        '"sections[0].questionAnswers[0].answer.displayText" is required'
      )
    })
  })

  describe('date answer', () => {
    it('validates a correct date answer', () => {
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [dateQuestion]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeUndefined()
    })
    it('fails if date value is not an object', () => {
      const dateValueNotObject = {
        question: 'Date Question',
        questionKey: 'dateQuestionKey',
        answer: {
          type: 'date',
          value: 'not-an-object', // should be an object
          displayText: '01/01/2020'
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [dateValueNotObject]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toEqual(
        '"sections[0].questionAnswers[0].answer.value" must be of type object'
      )
    })

    it('fails if date value is missing day, month, or year', () => {
      const incompleteDateQuestion = {
        question: 'Incomplete Date Question',
        questionKey: 'incompleteDateKey',
        answer: {
          type: 'date',
          value: { day: '01', month: '01' }, // year missing
          displayText: '01/01'
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [incompleteDateQuestion]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toEqual(
        '"sections[0].questionAnswers[0].answer.value.year" is required'
      )
    })
    it('fails if date value day, month, or year is not a string', () => {
      const invalidDateQuestion = {
        question: 'Invalid Date Question',
        questionKey: 'invalidDateKey',
        answer: {
          type: 'date',
          value: { day: 1, month: 1, year: 2020 }, // should be strings
          displayText: '01/01/2020'
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [invalidDateQuestion]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toEqual(
        '"sections[0].questionAnswers[0].answer.value.day" must be a string'
      )
    })
    it('fails if displayText is missing', () => {
      const dateMissingDisplayText = {
        question: 'Date Question',
        questionKey: 'dateQuestionKey',
        answer: {
          type: 'date',
          value: { day: '01', month: '01', year: '2020' }
          // displayText missing
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [dateMissingDisplayText]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toEqual(
        '"sections[0].questionAnswers[0].answer.displayText" is required'
      )
    })
  })

  describe('number answer', () => {
    it('validates a correct number answer', () => {
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [numberQuestion]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeUndefined()
    })
    it('fails if number value is not a number', () => {
      const numberValueNotNumber = {
        question: 'Number Question',
        questionKey: 'numberQuestionKey',
        answer: {
          type: 'number',
          value: 'not-a-number', // should be a number
          displayText: '1'
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [numberValueNotNumber]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toEqual(
        '"sections[0].questionAnswers[0].answer.value" must be a number'
      )
    })
  })

  describe('invalid answer types', () => {
    it('fails if answer type is invalid', () => {
      const invalidAnswerTypeQuestion = {
        question: 'Invalid Answer Type Question',
        questionKey: 'invalidAnswerTypeKey',
        answer: {
          type: 'invalidType',
          value: 'some value',
          displayText: 'some value'
        }
      }
      const payload = {
        journeyId: 'journeyId',
        journeyVersion: { major: 1, minor: 0 },
        sections: [
          {
            sectionKey: 'sectionKey',
            title: 'Section Title',
            questionAnswers: [invalidAnswerTypeQuestion]
          }
        ]
      }
      const { error } = ApplicationSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toEqual(
        '"sections[0].questionAnswers[0].answer.type" must be one of [file, text, radio, address, checkbox, name, date, number]'
      )
    })
  })
})

describe('ApplicationSchema - section and question structure', () => {
  it('validates a correct payload with all answer types', () => {
    const { error } = ApplicationSchema.validate(validPayload)
    expect(error).toBeUndefined()
  })

  it('fails if sections is missing', () => {
    const { error } = ApplicationSchema.validate(missingSectionsPayload)
    expect(error).toBeDefined()
    expect(error?.details[0].message).toEqual('"sections" is required')
  })

  it('fails if sectionKey is missing in a section', () => {
    const payload = {
      journeyId: 'journeyId',
      journeyVersion: { major: 1, minor: 0 },
      sections: [
        {
          // sectionKey missing
          title: 'Section Title',
          questionAnswers: [textQuestion]
        }
      ]
    }
    const { error } = ApplicationSchema.validate(payload)
    expect(error).toBeDefined()
    expect(error?.details[0].message).toEqual(
      '"sections[0].sectionKey" is required'
    )
  })

  it('fails if title is missing in a section', () => {
    const payload = {
      journeyId: 'journeyId',
      journeyVersion: { major: 1, minor: 0 },
      sections: [
        {
          sectionKey: 'sectionKey',
          // title missing
          questionAnswers: [textQuestion]
        }
      ]
    }
    const { error } = ApplicationSchema.validate(payload)
    expect(error).toBeDefined()
    expect(error?.details[0].message).toEqual('"sections[0].title" is required')
  })

  it('fails if questionAnswers is missing in a section', () => {
    const payload = {
      journeyId: 'journeyId',
      journeyVersion: { major: 1, minor: 0 },
      sections: [
        {
          sectionKey: 'sectionKey',
          title: 'Section Title'
          // questionAnswers missing
        }
      ]
    }
    const { error } = ApplicationSchema.validate(payload)
    expect(error).toBeDefined()
    expect(error?.details[0].message).toEqual(
      '"sections[0].questionAnswers" is required'
    )
  })

  it('fails if question is missing in a questionAnswer', () => {
    const payload = {
      journeyId: 'journeyId',
      journeyVersion: { major: 1, minor: 0 },
      sections: [
        {
          sectionKey: 'sectionKey',
          title: 'Section Title',
          questionAnswers: [
            {
              // question missing
              questionKey: 'textQuestionKey',
              answer: {
                type: 'text',
                value: 'some text',
                displayText: 'some text'
              }
            }
          ]
        }
      ]
    }
    const { error } = ApplicationSchema.validate(payload)
    expect(error).toBeDefined()
    expect(error?.details[0].message).toEqual(
      '"sections[0].questionAnswers[0].question" is required'
    )
  })

  it('fails if questionKey is missing in a questionAnswer', () => {
    const payload = {
      journeyId: 'journeyId',
      journeyVersion: { major: 1, minor: 0 },
      sections: [
        {
          sectionKey: 'sectionKey',
          title: 'Section Title',
          questionAnswers: [
            {
              question: 'Text Question',
              // questionKey missing
              answer: {
                type: 'text',
                value: 'some text',
                displayText: 'some text'
              }
            }
          ]
        }
      ]
    }
    const { error } = ApplicationSchema.validate(payload)
    expect(error).toBeDefined()
    expect(error?.details[0].message).toEqual(
      '"sections[0].questionAnswers[0].questionKey" is required'
    )
  })

  it('fails if answer is missing in a questionAnswer', () => {
    const payload = {
      journeyId: 'journeyId',
      journeyVersion: { major: 1, minor: 0 },
      sections: [
        {
          sectionKey: 'sectionKey',
          title: 'Section Title',
          questionAnswers: [
            {
              question: 'Text Question',
              questionKey: 'textQuestionKey'
              // answer missing
            }
          ]
        }
      ]
    }
    const { error } = ApplicationSchema.validate(payload)
    expect(error).toBeDefined()
    expect(error?.details[0].message).toEqual(
      '"sections[0].questionAnswers[0].answer" is required'
    )
  })
})

describe('ApplicationSchema - keyFacts field', () => {
  it('accepts a valid payload without keyFacts field', () => {
    const payload = {
      journeyId: 'journeyId',
      journeyVersion: { major: 1, minor: 0 },
      sections: [section]
    }
    const { error } = ApplicationSchema.validate(payload)
    expect(error).toBeUndefined()
  })

  it('accepts a valid payload with keyFacts containing mixed value types', () => {
    const payload = {
      journeyId: 'journeyId',
      journeyVersion: { major: 1, minor: 0 },
      sections: [section],
      keyFacts: {
        licenceType: 'TB15',
        numberOfCattle: 150,
        originCph: '12/123/1234',
        originAddress: {
          addressLine1: '2 the street',
          addressTown: 'Cityville',
          addressPostcode: 'ZZ09 9ZZ'
        },
        originKeeperName: {
          firstName: 'Bob',
          lastName: 'Barry'
        },
        movementDate: {
          day: '15',
          month: '06',
          year: '2024'
        },
        biosecurityMaps: ['biosecurity-map/S3/path']
      }
    }
    const { error } = ApplicationSchema.validate(payload)
    expect(error).toBeUndefined()
  })

  it('fails if keyFacts contains invalid structured values', () => {
    const payload = {
      journeyId: 'journeyId',
      journeyVersion: { major: 1, minor: 0 },
      sections: [section],
      keyFacts: {
        originAddress: {
          addressLine1: '2 the street'
          // missing required addressTown and addressPostcode
        }
      }
    }
    const { error } = ApplicationSchema.validate(payload)
    expect(error).toBeDefined()
    expect(error?.details.length).toBeGreaterThan(0)
  })
})
