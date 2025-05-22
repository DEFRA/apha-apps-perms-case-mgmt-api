import Joi from 'joi'

const FileAnswerSchema = Joi.object({
  type: Joi.string().valid('file').required(),
  value: Joi.object({
    skipped: Joi.boolean().required(),
    path: Joi.string().when('skipped', {
      is: true,
      then: Joi.optional(),
      otherwise: Joi.required()
    })
  }).required(),
  displayText: Joi.string().required()
})

const TextAnswerSchema = Joi.object({
  type: Joi.string().valid('text').required(),
  value: Joi.string().allow('').required(),
  displayText: Joi.string().allow('').required()
})

const RadioAnswerSchema = Joi.object({
  type: Joi.string().valid('radio').required(),
  value: Joi.string().required(),
  displayText: Joi.string().required()
})

const AddressAnswerSchema = Joi.object({
  type: Joi.string().valid('address').required(),
  value: Joi.object({
    addressLine1: Joi.string().required(),
    addressLine2: Joi.string().optional(),
    addressTown: Joi.string().required(),
    addressCounty: Joi.string().optional(),
    addressPostcode: Joi.string().required()
  }).required(),
  displayText: Joi.string().required()
})

const CheckboxAnswerSchema = Joi.object({
  type: Joi.string().valid('checkbox').required(),
  value: Joi.array().items(Joi.string()).required().min(0),
  displayText: Joi.string().allow('').required()
})

const NameAnswerSchema = Joi.object({
  type: Joi.string().valid('name').required(),
  value: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required()
  }).required(),
  displayText: Joi.string().required()
})

const QuestionAnswerSchema = Joi.object({
  question: Joi.string().required(),
  questionKey: Joi.string().required(),
  answer: Joi.alternatives()
    .try(
      FileAnswerSchema,
      TextAnswerSchema,
      RadioAnswerSchema,
      AddressAnswerSchema,
      CheckboxAnswerSchema,
      NameAnswerSchema
    )
    .required()
})

const SectionSchema = Joi.object({
  sectionKey: Joi.string().required(),
  title: Joi.string().required(),
  questionAnswers: Joi.array().items(QuestionAnswerSchema).required()
})

export const ApplicationSchema = Joi.object({
  sections: Joi.array().items(SectionSchema).required()
})
