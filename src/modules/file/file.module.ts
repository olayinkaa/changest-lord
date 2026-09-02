import { ContainerModule } from "inversify"
import { FileController } from "./file.controller"
import { FileRepository } from "./file.repository"
import { FileService } from "./file.service"
import { FILE_TYPES, type IFileRepository, type IFileService } from "./file.types"

export const FileModule = new ContainerModule((bind) => {
	bind<IFileService>(FILE_TYPES.Service).to(FileService)
	bind<IFileRepository>(FILE_TYPES.Repository).to(FileRepository)
	bind(FileController).toSelf()
})
