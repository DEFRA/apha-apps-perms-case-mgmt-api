import Joi from 'joi'

export const convictValidateTrafficSplitting = {
  name: 'traffic-splitting',
  coerce(value) {
    return typeof value === 'string' ? JSON.parse(value) : value
  },
  validate: function validateTrafficSplitting(value) {
    const trafficSplittingSchema = Joi.array().items(
      Joi.object({
        value: Joi.string().required(),
        sharepoint: Joi.number().min(0).max(100).required(),
        salesforce: Joi.number().min(0).max(100).required()
      }).custom((item, helpers) => {
        return item.sharepoint + item.salesforce === 100
          ? item
          : helpers.message({
              custom: 'sharepoint and salesforce must total 100'
            })
      })
    )

    Joi.assert(value, trafficSplittingSchema)
  }
}
