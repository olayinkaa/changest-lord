import {
	registerDecorator,
	type ValidationArguments,
	type ValidationOptions,
	ValidatorConstraint,
	type ValidatorConstraintInterface,
} from "class-validator"
import { parsePhoneNumberFromString } from "libphonenumber-js/max"

/**
 * validate Nigeria phone number
 * @param validationOptions
 * @returns
 */
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

/**
 * Strong Password
 */
@ValidatorConstraint({ name: "isStrongPassword", async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
	validate(password: string) {
		const hasMinLength = password.length >= 8
		const hasLetter = /[a-zA-Z]/.test(password)
		const hasNumber = /[0-9]/.test(password)
		const hasSpecialChar = /[^a-zA-Z0-9]/.test(password)

		return hasMinLength && hasLetter && hasNumber && hasSpecialChar
	}

	defaultMessage(): string {
		return `Password must be at least 8 characters long and contain at least one letter, one number, and one special character.`
	}
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
	return (target: object, propertyName: string) => {
		registerDecorator({
			name: "isStrongPassword",
			target: target.constructor,
			propertyName: propertyName,
			options: validationOptions,
			validator: IsStrongPasswordConstraint,
		})
	}
}

/**
 *
 */
