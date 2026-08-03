
## Inversify Module binding
```ts
export class UserContainerModule extends ContainerModule {
  constructor() {
    super((options: ContainerModuleLoadOptions) => {
      options.bind(UserController).toSelf().inSingletonScope();
      options.bind(UserService).toSelf().inSingletonScope();
    });
  }
}
```

```ts
import type express from "express";
const app: express.Application = await adapter.build();

```

```ts
import {
  Controller,
  Get,
  HttpStatusCode,
  StatusCode,
} from "@inversifyjs/http-core";

@Controller("/users")
export class UserController {
  @Get()
  @StatusCode(HttpStatusCode.CREATED)
  public async getUsers(): Promise<any[]> {
    return [
      { email: "john@example.com", id: 1, name: "John Doe" },
      { email: "jane@example.com", id: 2, name: "Jane Smith" },
    ];
  }
}

```

##
```ts
process.on("unhandledRejection", (err)=> {
  console.error("Unhanded Rejection:", err);
  server.close(async ()=> {
    await disconnectDB();
    process.exit(1)
  })
})

process.on("uncaughtException", (err)=> {
  console.error("Uncaught Exception:", err);
  await disconnectDB();
  process.exit(1)
})
```

## Prisma
```ts

@injectable()
export class UserRepository implements IUserRepository {
  // ... existing methods ...

  async createUserOnboarding(data: any) {
    const {
      email,
      phone,
      firstName,
      lastName,
      address,
      userType,
      businessName,
      businessCategory,
      businessTypeId,
      deviceDeviceId, // matching your Prisma schema field name
    } = data;

    // Use a transaction to create the user and their default KYC record atomically
    return prisma.$transaction(async (tx) => {
      // 1. Create the user
      const user = await tx.user.create({
        data: {
          email,
          phone,
          firstName,
          lastName,
          address,
          userType,
          businessName,
          businessCategory,
          businessTypeId,
          userDeviceId: deviceDeviceId, // Required field based on your schema
          
          // 2. Automatically create the associated empty KYC record
          kyc: {
            create: {
              completedProfile: false,
              emailVerified: false,
              phoneVerified: false,
            },
          },
        },
        include: {
          kyc: true,
          businessType: true,
        },
      });

      return user;
    });
  }
}
```
```ts
async createUserOnboarding(data: any) {
  const {
    email,
    phone,
    firstName,
    lastName,
    address,
    userType,
    businessName,
    businessCategory,
    businessTypeId,
    deviceDeviceId,
  } = data;

  // Prisma handles the safety transaction internally via nested writes
  return prisma.user.create({
    data: {
      email,
      phone,
      firstName,
      lastName,
      address,
      userType,
      businessName,
      businessCategory,
      businessTypeId,
      userDeviceId: deviceDeviceId,
      
      // Direct nested creation
      kyc: {
        create: {
          completedProfile: false,
          emailVerified: false,
          phoneVerified: false,
        },
      },
    },
    include: {
      kyc: true,
      businessType: true,
    },
  });
}
```

## Class Validator
```ts
 @Matches(/^\+?[0-9]{7,15}$/, {
  	message: "Phone number must be 7–15 digits, optionally prefixed with '+'",
  })
```

```ts
import { parsePhoneNumberFromString } from 'libphonenumber-js/max';

async findByPhoneWithKyc(inputPhone: string) {
  // Normalize the query parameter to match your stored "080..." format
  const phoneNumber = parsePhoneNumberFromString(inputPhone, 'NG');
  const standardizedPhone = phoneNumber?.isValid() && phoneNumber.country === 'NG'
    ? phoneNumber.formatNational().replace(/\s+/g, '')
    : inputPhone;

  return prisma.user.findFirst({
    where: {
      phone: standardizedPhone,
    },
    include: {
      kyc: true,
      businessType: true,
    },
  });
}

```