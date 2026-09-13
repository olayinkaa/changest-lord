export const PAYMENT_TYPES = {
	Service: Symbol.for("PaymentService"),
	Repository: Symbol.for("PaymentRepository"),
}

export interface IPaymentService {
	createUserVirtualAccount(userId: string, bvn: string): Promise<any>
	getVirtualAccountByUserId(userId: string): Promise<any>
}

export interface IPaymentRepository {
	updateUserAccountDetail(userId: string, data: any): Promise<any>
	findByUserId(userId: string): Promise<any>
}
