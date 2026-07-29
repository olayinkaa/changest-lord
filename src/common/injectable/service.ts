import { inject } from "inversify"
import { TYPES as LOGGER_TYPES } from "@/types/di-types"

export const logService: PropertyDecorator | ParameterDecorator = inject(
	LOGGER_TYPES.Logger,
)
