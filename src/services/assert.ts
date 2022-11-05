const assert: (
  condition: unknown,
  message?: string | (() => string),
) => asserts condition = (condition, message) => {
  if (condition) {
    return
  }

  if (typeof message === `function`) {
    message = message()
  }

  throw new Error(message)
}

export default assert
