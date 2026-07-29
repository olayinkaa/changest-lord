declare global {
	interface AnchorBank {
		id: string
		type: "Bank"
		attributes: {
			nipCode: string
			name: string
			cbnCode: string
		}
	}

	interface AnchorVirtualAccount {
		data: {
			id: string
			type: string
			attributes: {
				createdAt: string
				bank: { id: string; name: string; nipCode: string }
				isDefault: false
				accountName: string
				permanent: true
				currency: string
				accountNumber: string
				status: "ACTIVE" | "INACTIVE"
			}
			relationships: {
				settlementAccount: { data: { id: string; type: string } }
				customer: { data: { id: string; type: string } }
			}
		}
	}

	interface AnchorAccountName {
		data: {
			id: string
			type: string
			attributes: {
				accountName: string
			}
		}
	}

	interface AnchorCounterParty {
		data: {
			id: string
			type: "CounterParty"
			attributes: {
				createdAt: string
				bank: { id: string; name: string; nipCode: string }
				accountName: string
				accountNumber: string
				updatedAt: string
				status: "ACTIVE"
			}
		}
	}

	interface AnchorBankTransfer {
		data: {
			id: string
			type: "NIP_TRANSFER"
			attributes: {
				amount: number
				currency: string
				reason: string
				status: "PENDING"
				createdAt: string
				updatedAt: string
			}
			relationships: {
				destinationAccount: { data: { id: string; type: string } }
				account: { data: { id: string; type: string } }
				counterParty: { data: { id: string; type: string } }
			}
		}
	}

	interface AnchorBuyAirtime {
		data: {
			id: string
			type: string
			attributes: {
				reference: string
				createdAt: string
				amount: number
				phoneNumber: string
				detail: {
					provider: string
					product: string
				}
				category: string
				commissionAmount: number
				status: "COMPLETED" | "FAILED"
				failureReason:
					| "INSUFFICIENT_BALANCE"
					| "INVALID_PHONE_NUMBER"
					| "INVALID_PROVIDER"
					| "INVALID_PRODUCT"
				updatedAt: string
			}
			relationships: {
				program: { data: { id: string; type: string } }
				account: { data: { id: string; type: string } }
				customer: { data: { id: string; type: string } }
			}
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-interface
	interface AnchorBuyInternetData extends AnchorBuyAirtime {}

	interface AnchorAccountBalance {
		data: {
			id: string
			type: string
			availableBalance: number
		}
	}
}

export {}
