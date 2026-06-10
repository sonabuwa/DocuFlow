/**
 * MongoDB Sanitizer — Express 5 Compatible
 * Only strips MongoDB operator KEYS from objects, not dots from string values
 */

const sanitizeValue = (value) => {
  // Only remove leading $ from strings (for cases like "$ne" as a string value)
  if (typeof value === "string") return value.replace(/^\$/, "");
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value !== null && typeof value === "object") return sanitizeObject(value);
  return value;
};

const sanitizeObject = (obj) => {
  const clean = {};
  for (const key of Object.keys(obj)) {
    // Drop keys starting with $ (MongoDB operators)
    if (key.startsWith("$")) continue;
    // Drop keys containing dots (like "a.b" which could be path injection)
    if (key.includes(".")) continue;
    clean[key] = sanitizeValue(obj[key]);
  }
  return clean;
};

export const mongoSanitize = (req, res, next) => {
  if (req.body && typeof req.body === "object")
    req.body = sanitizeObject(req.body);
  if (req.params && typeof req.params === "object")
    req.params = sanitizeObject(req.params);
  next();
};
