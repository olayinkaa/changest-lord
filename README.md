# Project Name
MY CHANGE

# About the project
Is a digital financial platform designed to help users collect, save, and 
spend their transaction change digitally.
It eliminates the stress of searching for physical cash notes or 
leaving small balance amounts behind during daily transactions.

Key Features of MyChange
- Digital Change Collection: Customers can easily collect their balance digitally using just their phone number at point-of-sale (POS) terminals.
- USSD & App Integration: The service operates via mobile applications and simple USSD codes (*7006*86#), making it accessible on any phone without requiring internet connectivity.
- High-Yield Savings: Users can choose to lock away their collected change into a targeted "Keep Plan" to earn up to 15% interest over a set period.
- Merchant Ecosystem: Merchants can quickly return change via a POS terminal or facial recognition, helping them serve customers faster and maximize transaction flow.
- Direct Vendor Payments: Accumulated digital change can be spent directly to pay vendors for everyday goods and services.


# Technologies Used
- [Node.js](https://nodejs.org/en)
- [Express.js](https://expressjs.com/en/5x/starter/installing/)
- [Inversify](https://inversify.io/docs/introduction/getting-started/)
- [Inversify Express Utils](https://github.com/inversify/inversify-express-utils#readme)

## ⚙️ Prerequisites
- [Node.js](https://nodejs.org/) (v22.22.3)
- [pnpm](https://pnpm.io/)

# ⚙️ Installation & Setup
- Clone the Repository
```sh
git clone https://github.com/Face-mychange/myChangeBE.git
cd myChangeBE
git switch development
```

- Install Dependencies
```sh
pnpm install
```

- Create a new branch
```sh
git switch -c <branch-name>
```

- Environment Variables <br/>
Create a `.env` file in the root directory:
```sh
NODE_ENV=development
LOG_LEVEL="debug"
JWT_TOKEN_SECRET=
JWT_REFRESH_TOKEN_SECRET=
DATABASE_URL=
GOOGLE_MAPS_API_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
# AWS_REKOGNITION_REGION=
```

- Generate Secret
```sh
openssl rand -base64 32
```
copy it and set it as the value for `JWT_TOKEN_SECRET`,  in `.env`.
You can generate a different value for `JWT_REFRESH_TOKEN_SECRET` and 
other secret using the same command
</br>

- Run Development Server
```sh
pnpm run dev
```

- Application will run on:
<http://localhost:6001>


## API Reference
- Swagger Documentation URL

<!-- http://172.17.10.79:9000/swagger-ui/index.html#/ -->

## GITLAB Repo
<!-- https://git.etranzactng.net/user-interfaces/nrs-merchant-ui -->


# 🌐 Live Environments
- Development: <>
- Staging: <>
- Production: <Insert Production URL>

# 👥 Credits
Contributors:
- Ibrahim Olayinka – Fullstack Developer
📧 ibrahimolayinkaa@gmail.com
📞 070-6564-3303

# 🏢 License
This project is proprietary software owned by: <br/>
<b><Company name></b>  <br/>
<b>Website: <website urk> </b> <br/>
All rights reserved © <Company name>.
