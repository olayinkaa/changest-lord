.PHONY: migrate

secret: 
	@echo "generating secret key..."
	openssl rand -base64 32
dev:
	@echo "start local server [.env]..."
	pnpm run dev:all
migrate:
	@read -p "Enter migration name: " name; \
	pnpm prisma migrate dev --name "$$name"
rm-migration:
	rm -rf prisma/migrations
deploy:
	./deploy.sh
db-drop:
	pnpm prisma migrate reset --force
db-generate:
	pnpm prisma generate
db-seed:
	pnpm prisma db seed
db-push:
	pnpm prisma db push


	