export enum ResponseStatus {
  OK = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
}

export const ResponseMessage = {
  SUCCESS: "Successfully Processed",
  BAD_REQUEST: "Bad Request. Please check your input, parameters",
  UNAUTHORIZED: "Unauthorized access. Please login.",
  FORBIDDEN: "Forbidden. You don't have permission to perform this action.",
  NOT_FOUND: "Resource not found.",
} as const;
