import type { interfaces } from "inversify-express-utils"

export class UserPrincipal implements interfaces.Principal {
	public details: IAuthUser
	public constructor(details: any) {
		this.details = details
	}

	public isAuthenticated(): Promise<boolean> {
		// Must return a Promise per the interface
		return Promise.resolve(this.details !== null && this.details !== undefined)
	}

	public async isResourceOwner(resourceId: any): Promise<boolean> {
		return Promise.resolve(resourceId === 1111)
	}

	public async isInRole(role: string): Promise<boolean> {
		return Promise.resolve(role === "admin")
	}
}
