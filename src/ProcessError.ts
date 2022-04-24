class ProcessError extends Error {
  code: number | null

  constructor(code: number | null, message: string) {
    super(message)
    const callee = arguments.callee
    Error.captureStackTrace(this, callee)
    this.code = code
    this.message = message
    this.name = callee.name
  }
}

export default ProcessError
