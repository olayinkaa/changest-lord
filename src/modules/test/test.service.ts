import axios from "axios"
import { injectable } from "inversify"
import { BadRequestException } from "@/core/errors/exceptions"
import type { ITestService } from "./test.type"

@injectable()
export class TestService implements ITestService {
	async getLocationAddress(search: string): Promise<any> {
		if (!search) {
			throw new BadRequestException("Search query is missing")
		}
		const response = await axios.get("https://nominatim.openstreetmap.org/search", {
			params: {
				q: search,
				format: "json",
				addressdetails: 1,
				limit: 5, // Limit suggestions to 5
				countrycodes: "ng,us",
			},
			headers: {
				// REQUIRED: Nominatim requires a User-Agent with your app name & contact email
				"User-Agent": "MyChangeApp/1.0 (ibrahimolayinkaa@gmail.com)",
			},
		})

		const result = response?.data
		return result
	}
}
