import { Controller, Get } from "@inversifyjs/http-core";

@Controller("/users")
export class UserController {
  @Get()
  public async getUsers(): Promise<any[]> {
    return [
      { email: "john@example.com", id: 1, name: "John Doe" },
      { email: "jane@example.com", id: 2, name: "Jane Smith" },
    ];
  }
}
