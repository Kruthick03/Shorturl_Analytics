import validator from "validator";

export function isValidUrl(url) {
  return validator.isURL(url, {
    protocols: ["http", "https"],
    require_protocol: true,
    require_valid_protocol: true
  });
}
