import {
	registerDecorator,
	type ValidationArguments,
	type ValidationOptions,
} from "class-validator"
import { parsePhoneNumberFromString } from "libphonenumber-js/max"

export function IsNigeriaPhone(validationOptions?: ValidationOptions) {
	return (object: object, propertyName: string) => {
		registerDecorator({
			name: "isNigeriaPhone",
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			validator: {
				validate(value: any, _: ValidationArguments) {
					if (typeof value !== "string") return false

					try {
						// Passing 'NG' sets Nigeria as the default country for validation
						const phoneNumber = parsePhoneNumberFromString(value, "NG")
						// Ensures the parsed number is valid AND strictly belongs to Nigeria
						return phoneNumber
							? phoneNumber.isValid() && phoneNumber.country === "NG"
							: false
						// biome-ignore lint/correctness/noUnusedVariables: caught error is intentionally unused
					} catch (e) {
						return false
					}
				},
				defaultMessage(args: ValidationArguments) {
					return `${args.property} must be a valid Nigerian phone number`
				},
			},
		})
	}
}
