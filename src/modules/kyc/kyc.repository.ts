import { injectable } from "inversify"
import type { IKycRepository } from "./kyc.types"

@injectable()
export class KycRepository implements IKycRepository {}
