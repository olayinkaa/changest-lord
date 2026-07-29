import { Container, type interfaces } from "inversify"

export abstract class Application {
	protected readonly container: Container
	constructor(options: interfaces.ContainerOptions) {
		this.container = new Container(options)
		this.configureService(this.container)
		this.setup()
	}
	abstract configureService(container: Container): Promise<void> | void
	abstract setup(): Promise<void> | void
}
