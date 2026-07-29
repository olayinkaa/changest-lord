```ts
{
    success: true,
    message: "Successfully Processed",
    data : [
        {
            "email": "john@example.com",
            "id": 1,
            "name": "John Doe"
        },
        {
            "email": "jane@example.com",
            "id": 2,
            "name": "Jane Smith"
        }
    ]
}
```

```ts
this.logger.info({ message: "greater", userName: "James" }, "Accessing user endpoints");

```

## Prisma Schema

```prisma
model Kyc {
  id String @id @default(cuid())

  userId String @unique @map("user_id")
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  livenessDone          Boolean @default(false) @map("liveness_done")
  completedProfile      Boolean @default(false) @map("completed_profile")
  faceId                String? @map("face_id")
  needsPinReset         Boolean @default(false) @map("needs_pin_reset")
  completedRegistration Boolean @default(false) @map("completed_registration")
  emailVerified         Boolean @default(false) @map("email_verified")
  phoneVerified         Boolean @default(false) @map("phone_verified")
  bvnVerified           Boolean @default(false) @map("bvn_verified")
  ninVerified           Boolean @default(false) @map("nin_verified")
  locationVerified      Boolean @default(false) @map("location_verified")
  whatsappVerified      Boolean @default(false) @map("whatsapp_verified")
  createdPin            Boolean @default(false) @map("created_pin")
  businessInfoSubmitted Boolean @default(false) @map("business_info_submitted")
  genres    String[] @default([])

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")


  @@map("kyc_records")
}
```

```md
migrate-v2:
	@if [ -z "$(name)" ]; then \
		echo "Error: 'name' is required. Usage: make migrate name=<migration_name>"; \
		exit 1; \
	fi
	pnpm prisma migrate dev --name $(name)
```