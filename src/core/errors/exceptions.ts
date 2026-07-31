// HttpException
export class HttpException extends Error {
	public status: number
	public message: string
	public data?: any

	constructor(status: number, message: string, data?: any) {
		super(message)
		this.status = status
		this.message = message
		this.data = data
	}
}

// NotFoundException
export class NotFoundException extends HttpException {
	constructor(message: string = "Resource not found") {
		super(404, message)
	}
}

// ConflictException
export class ConflictException extends HttpException {
	constructor(message: string = "Resource conflict") {
		super(409, message)
	}
}

// ConflictException
export class ForbiddenException extends HttpException {
	constructor(message: string = "Forbidden") {
		super(403, message)
	}
}

// BadRequestException
export class BadRequestException extends HttpException {
	constructor(message: string = "Bad request", data?: any) {
		super(400, message, data)
	}
}

// UnauthorizedException
export class UnauthorizedException extends HttpException {
	constructor(message: string = "Unauthorized") {
		super(401, message)
	}
}

// InternalServerErrorException (500)
export class InternalServerErrorException extends HttpException {
	constructor(message: string = "Internal server error", data?: any) {
		super(500, message, data)
	}
}

// UnprocessableEntityException (422) - Commonly used for validation errors
export class UnprocessableEntityException extends HttpException {
	constructor(message: string = "Unprocessable entity", data?: any) {
		super(422, message, data)
	}
}

// UnauthorizedException was already included, but here is TooManyRequestsException (429)
export class TooManyRequestsException extends HttpException {
	constructor(message: string = "Too many requests") {
		super(429, message)
	}
}

// GatewayTimeoutException (504) - Useful for microservices/external APIs
export class GatewayTimeoutException extends HttpException {
	constructor(message: string = "Gateway timeout") {
		super(504, message)
	}
}

// ServiceUnavailableException (503)
export class ServiceUnavailableException extends HttpException {
	constructor(message: string = "Service unavailable") {
		super(503, message)
	}
}

// MethodNotAllowedException (405)
export class MethodNotAllowedException extends HttpException {
	constructor(message: string = "Method not allowed") {
		super(405, message)
	}
}
