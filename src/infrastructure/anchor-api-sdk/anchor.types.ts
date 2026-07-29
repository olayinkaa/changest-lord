export type MobileProvider = "mtn" | "airtel" | "glo" | "9mobile"

export interface GenerateVirtualAccountParams {
	name: string
	email: string
}

export interface GenerateVirtualAccountResult {
	account_name: string
	account_number: string
	bank_name: string
	bank_code: string
	account_id: string
}

export interface GetBankAccountNameParams {
	accountNumber: string
	nipCode: string
}

export interface CreateCounterPartyParams {
	accountNumber: string
	bankCode: string
}

export interface CreateBankTransferParams {
	amount: number
	accountNumber: string
	bankCode: string
	narration?: string
}

export interface CreateBankTransferResult {
	result: AnchorBankTransfer
	counterParty: AnchorCounterParty
}

export interface BuyAirtimeParams {
	amount: number
	phoneNumber: string
	provider: string
	reference: string
}

export interface BuyInternetDataParams {
	amount: number
	phoneNumber: string
	productSlug: string
	reference: string
}

export interface IAnchorApiSdk {
	listBanks(): Promise<{ data: AnchorBank[] }>
	generateVirtualAccount(
		params: GenerateVirtualAccountParams,
	): Promise<GenerateVirtualAccountResult>
	getBankAccountName(params: GetBankAccountNameParams): Promise<AnchorAccountName>
	createCounterParty(params: CreateCounterPartyParams): Promise<AnchorCounterParty>
	createBankTransfer(params: CreateBankTransferParams): Promise<CreateBankTransferResult>
	verifyTransfer(reference: string): Promise<unknown>
	getInternetDataProducts(provider: MobileProvider): Promise<unknown>
	buyAirtime(params: BuyAirtimeParams): Promise<AnchorBuyAirtime>
	buyInternetData(params: BuyInternetDataParams): Promise<AnchorBuyInternetData>
	getAccountBalance(): Promise<number>
}
