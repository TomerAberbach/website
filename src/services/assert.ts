export default function assert(
  condition: unknown,
  message?: string | (() => string),
): asserts condition {
  if (condition) {
    return
  }

  if (typeof message === `function`) {
    message = message()
  }

  throw new Error(message)
}
