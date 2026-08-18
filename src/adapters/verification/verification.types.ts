export interface IVerificationService {
	verifyNIN(nin: string): Promise<any>
	verifyBVN(bvn: string): Promise<any>
	verifyBasicPhone(phoneNumber: string): Promise<any>
}
