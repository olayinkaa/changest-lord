import { injectable } from "inversify"
import { prisma } from "@/core/database/db"
import type { IKycRepository } from "./kyc.types"

@injectable()
export class KycRepository implements IKycRepository {
	async getAllKycs() {
		return prisma.userKyc.findMany()
	}
}
