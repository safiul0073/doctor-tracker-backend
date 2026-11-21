/**
 * Escapes RegExp metacharacters to safely query user-supplied search strings
 * without risking ReDoS or invalid regular expression errors.
 */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
