import {
  getQuestionFromSections,
  getSectionsFromPayload,
  getTbLicenceType
} from './data-extract.js'

import {
  originSection,
  destinationSection,
  destinationType,
  originType
} from '../../test-helpers/application.js'

/**
 * @import {QuestionAnswerData} from './data-extract.js'
 * @import {SectionData} from './data-extract.js'
 */

const questionOneKey = 'q1'
const questionTwoKey = 'q2'
const sectionOneKey = 'section1'

/** @type {QuestionAnswerData} */
const questionOne = {
  question: 'Question 1',
  questionKey: questionOneKey,
  answer: { type: 'text', value: 'Answer 1', displayText: 'Answer 1' }
}
/** @type {QuestionAnswerData} */
const questionTwo = {
  question: 'Question 2',
  questionKey: questionTwoKey,
  answer: { type: 'text', value: 'Answer 2', displayText: 'Answer 2' }
}
/** @type {SectionData} */
const sectionOne = {
  title: 'Section 1',
  sectionKey: sectionOneKey,
  questionAnswers: [questionOne, questionTwo]
}

const sections = [sectionOne]

describe('getQuestionFromSections', () => {
  it('should return the correct question when section and question keys match', () => {
    const result = getQuestionFromSections(
      questionOneKey,
      sectionOneKey,
      sections
    )
    expect(result).toEqual(questionOne)
  })

  it('should return undefined if sectionKey does not match', () => {
    const result = getQuestionFromSections(
      questionOneKey,
      'anotherSectionKey',
      sections
    )
    expect(result).toBeUndefined()
  })

  it('should return undefined if questionKey does not match', () => {
    const result = getQuestionFromSections(
      'anotherQuestionKey',
      sectionOneKey,
      sections
    )
    expect(result).toBeUndefined()
  })

  describe('getSectionsFromPayload', () => {
    it('should return the sections array from the payload', () => {
      const payload = { sections }
      const result = getSectionsFromPayload(payload)
      expect(result).toBe(sections)
    })

    it('should return an empty array if payload.sections is an empty array', () => {
      const payload = { sections: [] }
      const result = getSectionsFromPayload(payload)
      expect(result).toEqual([])
    })
  })
})

describe('getTbLicenceType', () => {
  const restrictedTypes = ['tb-restricted-farm', 'zoo', 'other', 'lab'].map(
    (destination) => [destination]
  )
  it.each(restrictedTypes)(
    'should return TB15 if origin type is market & destination type is restricted',
    (destinationTypeSelected) => {
      const application = {
        sections: [
          originSection([originType('market')]),
          destinationSection([destinationType(destinationTypeSelected)])
        ]
      }

      expect(getTbLicenceType(application)).toBe('TB15')
    }
  )

  it.each(restrictedTypes)(
    'should return TB15 if origin type is unrestricted farm & destination type is tb restricted farm',
    (destinationTypeSelected) => {
      const application = {
        sections: [
          originSection([originType('unrestricted-farm')]),
          destinationSection([destinationType(destinationTypeSelected)])
        ]
      }

      expect(getTbLicenceType(application)).toBe('TB15')
    }
  )

  it.each(restrictedTypes)(
    'should return empty string if origin type is afu & destination type is restricted (as it is not a supported journey)',
    (destinationTypeSelected) => {
      const application = {
        sections: [
          originSection([originType('afu')]),
          destinationSection([destinationType(destinationTypeSelected)])
        ]
      }

      expect(getTbLicenceType(application)).toBe('')
    }
  )

  it.each(restrictedTypes)(
    'should return TB15 if origin type is after import location & destination type is restricted',
    (destinationTypeSelected) => {
      const application = {
        sections: [
          originSection([originType('after-import-location')]),
          destinationSection([destinationType(destinationTypeSelected)])
        ]
      }

      expect(getTbLicenceType(application)).toBe('TB15')
    }
  )

  it.each(restrictedTypes)(
    'should return TB16 if origin type is restricted & destination type is tb restricted farm',
    (originTypeSelected) => {
      const application = {
        sections: [
          originSection([originType(originTypeSelected)]),
          destinationSection([destinationType('tb-restricted-farm')])
        ]
      }

      expect(getTbLicenceType(application)).toBe('TB16')
    }
  )

  it.each(restrictedTypes)(
    'should return TB16 if origin type is restricted & destination type is zoo',
    (originTypeSelected) => {
      const application = {
        sections: [
          originSection([originType(originTypeSelected)]),
          destinationSection([destinationType('zoo')])
        ]
      }

      expect(getTbLicenceType(application)).toBe('TB16')
    }
  )

  it.each(restrictedTypes)(
    'should return TB16 if origin type is restricted & destination type is lab',
    (originTypeSelected) => {
      const application = {
        sections: [
          originSection([originType(originTypeSelected)]),
          destinationSection([destinationType('lab')])
        ]
      }

      expect(getTbLicenceType(application)).toBe('TB16')
    }
  )

  it.each(restrictedTypes)(
    'should return TB16 if origin type is restricted & destination type is other',
    (originTypeSelected) => {
      const application = {
        sections: [
          originSection([originType(originTypeSelected)]),
          destinationSection([destinationType('other')])
        ]
      }

      expect(getTbLicenceType(application)).toBe('TB16')
    }
  )

  it.each(restrictedTypes)(
    'should return TB16e if origin type is restricted & destination type is dedicated sale',
    (originTypeSelected) => {
      const application = {
        sections: [
          originSection([originType(originTypeSelected)]),
          destinationSection([destinationType('dedicated-sale')])
        ]
      }

      expect(getTbLicenceType(application)).toBe('TB16e')
    }
  )

  it.each(restrictedTypes)(
    'should return TB16e if origin type is restricted & destination type is afu',
    (originTypeSelected) => {
      const application = {
        sections: [
          originSection([originType(originTypeSelected)]),
          destinationSection([destinationType('afu')])
        ]
      }

      expect(getTbLicenceType(application)).toBe('TB16e')
    }
  )

  it('should return TB16e if the origin is afu and the destination is slaughter', () => {
    const application = {
      sections: [
        originSection([originType('afu')]),
        destinationSection([destinationType('slaughter')])
      ]
    }

    expect(getTbLicenceType(application)).toBe('TB16e')
  })

  it('should return TB16e if the origin is afu and the destination is afu', () => {
    const application = {
      sections: [
        originSection([originType('afu')]),
        destinationSection([destinationType('afu')])
      ]
    }

    expect(getTbLicenceType(application)).toBe('TB16e')
  })

  it('should return TB16e if the origin is afu and the destination is dedicated-sale', () => {
    const application = {
      sections: [
        originSection([originType('afu')]),
        destinationSection([destinationType('dedicated-sale')])
      ]
    }

    expect(getTbLicenceType(application)).toBe('TB16e')
  })

  it.each(restrictedTypes)(
    'should return TB24c if the origin is restricted & the destination is slaughter',
    (originTypeSelected) => {
      const application = {
        sections: [
          originSection([originType(originTypeSelected)]),
          destinationSection([destinationType('slaughter')])
        ]
      }

      expect(getTbLicenceType(application)).toBe('TB24c')
    }
  )

  it('should return an empty string if no conditions are met', () => {
    const application = {
      sections: [
        originSection([originType('unrestricted-farm')]),
        destinationSection([destinationType('unrestricted-farm')])
      ]
    }

    expect(getTbLicenceType(application)).toBe('')
  })
})
