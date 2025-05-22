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
const section = {
  sectionKey: 'sectionKey',
  title: 'Section Title',
  questionAnswers: [
    nameQuestion,
    fileQuestion,
    addressQuestion,
    radioQuestion,
    checkboxQuestion,
    textQuestion
  ]
}
const validPayload = {
  sections: [section]
}

const missingSectionsPayload = {}

describe('ApplicationSchema - answer types', () => {
  describe('text answer', () => {
    it('validates a correct text answer', () => {
      const payload = {
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

    it('allows empty text value and displayText', () => {
      const emptyTextQuestion = {
        question: 'Empty Text Question',
        questionKey: 'emptyTextQuestionKey',
        answer: {
          type: 'text',
          value: '',
          displayText: ''
        }
      }
      const payload = {
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
        '"sections[0].questionAnswers[0].answer" does not match any of the allowed types'
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
        '"sections[0].questionAnswers[0].answer" does not match any of the allowed types'
      )
    })
  })

  describe('checkbox answer', () => {
    it('validates a correct checkbox answer', () => {
      const payload = {
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
        '"sections[0].questionAnswers[0].answer" does not match any of the allowed types'
      )
    })
  })

  describe('radio answer', () => {
    it('validates a correct radio answer', () => {
      const payload = {
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
        '"sections[0].questionAnswers[0].answer" does not match any of the allowed types'
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
        '"sections[0].questionAnswers[0].answer" does not match any of the allowed types'
      )
    })
  })

  describe('file answer', () => {
    it('validates a correct file answer', () => {
      const payload = {
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
        '"sections[0].questionAnswers[0].answer" does not match any of the allowed types'
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
        '"sections[0].questionAnswers[0].answer" does not match any of the allowed types'
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
        '"sections[0].questionAnswers[0].answer" does not match any of the allowed types'
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
        '"sections[0].questionAnswers[0].answer" does not match any of the allowed types'
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
        '"sections[0].questionAnswers[0].answer" does not match any of the allowed types'
      )
    })
  })

  describe('address answer', () => {
    it('validates a correct address answer', () => {
      const payload = {
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
            addressTown: 'London',
            addressPostcode: 'SW1A 1AA'
          },
          displayText: 'London, SW1A 1AA'
        }
      }
      const payload = {
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
      expect(error?.details[0].message).toEqual(
        '"sections[0].questionAnswers[0].answer" does not match any of the allowed types'
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
        '"sections[0].questionAnswers[0].answer" does not match any of the allowed types'
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
        '"sections[0].questionAnswers[0].answer" does not match any of the allowed types'
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
        '"sections[0].questionAnswers[0].answer" does not match any of the allowed types'
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
