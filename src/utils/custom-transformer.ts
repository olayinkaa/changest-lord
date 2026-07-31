import { Transform } from "class-transformer"
import { parsePhoneNumberFromString } from "libphonenumber-js/max"

export function TransformNigeriaPhone() {
	return Transform(({ value }) => {
		if (typeof value !== "string") return value

		// Parse using strict maximum metadata with Nigeria context
		const phoneNumber = parsePhoneNumberFromString(value, "NG")

		// If valid Nigerian number, format to clean local national standard
		if (phoneNumber?.isValid() && phoneNumber?.country === "NG") {
			return phoneNumber.formatNational().replace(/\s+/g, "")
		}

		return value // Return as-is if invalid so validation pipeline fails properly
	})
}
