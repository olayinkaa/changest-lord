// HttpException
export class HttpException extends Error {
  public status: number;
  public message: string;
  public data?: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.message = message;
    this.data = data;
  }
}

// NotFoundException
export class NotFoundException extends HttpException {
  constructor(message: string = "Resource not found") {
    super(404, message);
  }
}

// ConflictException
export class ConflictException extends HttpException {
  constructor(message: string = "Resource conflict") {
    super(409, message);
  }
}

// ConflictException
export class ForbiddenException extends HttpException {
  constructor(message: string = "Forbidden") {
    super(403, message);
  }
}

// BadRequestException
export class BadRequestException extends HttpException {
  constructor(message: string = "Bad request", data?: any) {
    super(400, message, data);
  }
}

// UnauthorizedException
export class UnauthorizedException extends HttpException {
  constructor(message: string = "Unauthorized") {
    super(401, message);
  }
}
