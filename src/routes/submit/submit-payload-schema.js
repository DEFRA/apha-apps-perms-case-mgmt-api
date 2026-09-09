import Joi from 'joi'

const AnswerValueSchemas = {
  file: Joi.object({
    skipped: Joi.boolean().required(),
    path: Joi.string().when('skipped', {
      is: true,
      then: Joi.optional(),
      otherwise: Joi.required()
    })
  }),
  text: Joi.string().allow(''),
  radio: Joi.string(),
  address: Joi.object({
    addressLine1: Joi.string().required(),
    addressLine2: Joi.string().optional(),
    addressTown: Joi.string().required(),
    addressCounty: Joi.string().optional(),
    addressPostcode: Joi.string().required()
  }),
  checkbox: Joi.array().items(Joi.string()).min(0),
  name: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required()
  }),
  date: Joi.object({
    day: Joi.string().required(),
    month: Joi.string().required(),
    year: Joi.string().required()
  }),
  number: Joi.number()
}

const TypedValueSchema = {
  type: Joi.string()
    .valid(...Object.keys(AnswerValueSchemas))
    .required(),
  value: Joi.any().when('type', {
    switch: Object.entries(AnswerValueSchemas).map(([type, schema]) => ({
      is: type,
      then: schema.required()
    })),
    otherwise: Joi.any().required()
  })
}

const AnswerSchema = Joi.object({
  ...TypedValueSchema,
  displayText: Joi.string().allow('').required()
})

const QuestionAnswerSchema = Joi.object({
  question: Joi.string().required(),
  questionKey: Joi.string().required(),
  answer: AnswerSchema.required()
})

const SectionSchema = Joi.object({
  sectionKey: Joi.string().required(),
  title: Joi.string().required(),
  questionAnswers: Joi.array().items(QuestionAnswerSchema).required()
})

const KeyFactSchema = Joi.object(TypedValueSchema)

const BiosecurityMapsKeyFactSchema = Joi.object({
  type: Joi.string().valid('file').required(),
  value: Joi.array().items(Joi.string()).required()
})

const KeyFactsSchema = Joi.object({
  biosecurityMaps: BiosecurityMapsKeyFactSchema.optional()
}).pattern(Joi.string(), KeyFactSchema)

export const ApplicationSchema = Joi.object({
  journeyId: Joi.string().required(),
  journeyVersion: Joi.object({
    major: Joi.number().required(),
    minor: Joi.number().required()
  }).required(),
  sections: Joi.array().items(SectionSchema).required(),
  keyFacts: KeyFactsSchema.optional()
}).options({ abortEarly: false })
