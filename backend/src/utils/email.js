/**
 * The form an email is stored and looked up in. Anything else that keys on an email, such
 * as a rate-limit bucket, has to use this too. Otherwise two spellings of one address are
 * one account to the database but separate keys to whatever used the text as typed.
 */
export function normalizeEmail(email) {
  return email.toLowerCase();
}
