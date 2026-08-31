import { z } from "zod";

/**
 * Convert a ZodError into a flat { field: message } map, suitable for
 * rendering back to the client. Never leaks schema internals.
 */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!result[key]) {
      result[key] = issue.message;
    }
  }
  return result;
}

/**
 * Safely parse an unknown value against a schema, returning either the
 * parsed output or a field-error map.
 */
export function parseOrErrors<T>(
  schema: z.ZodType<T>,
  input: unknown,
): { data: T; error?: undefined } | { data?: undefined; error: Record<string, string> } {
  const parsed = schema.safeParse(input);
  if (parsed.success) {
    return { data: parsed.data };
  }
  return { error: toFieldErrors(parsed.error) };
}
