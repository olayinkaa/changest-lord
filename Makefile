secret: 
	@echo "generating secret key..."
	openssl rand -base64 32
dev:
	@echo "start local server [.env.local]..."
	pnpm run dev:local