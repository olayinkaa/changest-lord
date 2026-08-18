export interface IVerificationService {
	verifyNIN(nin: string): Promise<any>
	verifyBVN(bvn: string): Promise<any>
	verifyBasicPhone(_phoneNumber: string): Promise<any>
}
