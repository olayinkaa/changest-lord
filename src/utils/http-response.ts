export class ApiResponse<T> {
	constructor(
		public success: boolean,
		public statusCode: number,
		public message: string,
		public data: T,
	) {}

	static success<T>(data: T, message = "successfully processed", statusCode = 200) {
		return new ApiResponse(true, statusCode, message, data)
	}

	static error<T>(data: T, message = "An error occurred", statusCode = 400) {
		return new ApiResponse(false, statusCode, message, data)
	}
}
