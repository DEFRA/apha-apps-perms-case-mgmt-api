/**
 * @import {Application} from './data-extract/application.js'
 */

/**
 * Extracts the applicant's email and name from an application. firstName/lastName
 * are only populated when the application exposes structured name parts.
 * @param {Application} application
 * @returns {{ emailAddress: string, fullName: string, firstName: string, lastName: string }}
 */
export const getApplicantDetails = (application) => {
  const nameParts = application.applicantNameParts ?? {}

  return {
    emailAddress: application.emailAddress ?? '',
    fullName: application.applicantName ?? '',
    firstName: nameParts.firstName ?? '',
    lastName: nameParts.lastName ?? ''
  }
}
