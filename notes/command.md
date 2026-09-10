## command
```sh
npx gitignore node
pnpm exec prisma generate
pnpm dlx prisma@latest init
npx prisma migrate dev --name add_user_table
# run seed
pnpm exec dotenv -e .env -- tsx prisma/seeds/run-system.ts  
```