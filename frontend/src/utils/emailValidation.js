// Email format used to validate the profile email input.
export const EMAIL_REGEX =
  /^([a-zA-Z0-9+_.-]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9-]+\.)+))([a-zA-Z]{2,}|[0-9]{1,3})(\]?)$/;

// String form for the HTML `pattern` attribute of an <input>.
export const EMAIL_INPUT_PATTERN = EMAIL_REGEX.source;
