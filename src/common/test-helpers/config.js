import { config } from '../../config.js'

/* global jest */

const configGet = config.get.bind(config)
/**
 * @param {string} key
 * @param {any} value
 */
export const spyOnConfig = (key, value) => {
  jest.spyOn(config, 'get').mockImplementation((name) => {
    if (name === key) {
      return value
    } else {
      return configGet(name)
    }
  })
  return config
}
