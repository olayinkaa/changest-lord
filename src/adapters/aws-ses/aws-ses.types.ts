export type ConfidenceVerdictType = "HIGH" | "MEDIUM" | "LOW" | "NONE" | string

export interface IAwsSesEmailValidationResponse {
	MailboxValidation?: {
		IsValid?: {
			ConfidenceVerdict?: ConfidenceVerdictType
		}
		Evaluations?: {
			HasValidSyntax?: {
				ConfidenceVerdict?: ConfidenceVerdictType
			}
			HasValidDnsRecords?: {
				ConfidenceVerdict?: ConfidenceVerdictType
			}
			MailboxExists?: {
				ConfidenceVerdict?: ConfidenceVerdictType
			}
			IsRoleAddress?: {
				ConfidenceVerdict?: ConfidenceVerdictType
			}
			IsDisposable?: {
				ConfidenceVerdict?: ConfidenceVerdictType
			}
			IsRandomInput?: {
				ConfidenceVerdict?: ConfidenceVerdictType
			}
		}
	}
	$metadata: {
		httpStatusCode?: number
		requestId?: string
		attempts?: number
		totalRetryDelay?: number
	}
}

export interface IAwsSesService {
	checkEmailInsights(emailAddress: string): Promise<IAwsSesEmailValidationResponse>
}
