.PHONY: migrate

secret: 
	@echo "generating secret key..."
	openssl rand -base64 32
dev:
	@echo "start local server [.env.local]..."
	pnpm run dev
migrate:
	@read -p "Enter migration name: " name; \
	pnpm prisma migrate dev --name "$$name"
rm-migration:
	rm -rf prisma/migrations
db-drop:
	pnpm prisma migrate reset --force
db-gen:
	pnpm prisma generate
db-seed:
	pnpm prisma db seed