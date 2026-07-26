# Project Name
MY CHANGE

# About the project


# Technologies Used
- [Node.js](https://nodejs.org/en)
- [Express.js](https://expressjs.com/en/5x/starter/installing/)
- [Inversify](https://inversify.io/docs/introduction/getting-started/)
- [Inversify Framework](https://inversify.io/framework/docs/introduction/getting-started/)

## ⚙️ Prerequisites
- [Node.js](https://nodejs.org/) (v22.22.3)
- [pnpm](https://pnpm.io/)

# ⚙️ Installation & Setup
- Clone the Repository
```sh
git clone 
cd 
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
Create a `.env.local` file in the root directory:
```sh
  NEXT_PUBLIC_APP_NAME=""
  PORT=""
  JWT_TOKEN_SECRET=""
```

- Generate Secret
```sh
openssl rand -base64 32
```
copy it and set it as the value for `JWT_TOKEN_SECRET` in `.env.local`
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
- Development: <http://172.17.10.79:4444>
- Staging: <https://nrsmerchantportaldemo.etranzactng.com/>
- Production: <Insert Production URL>

# 👥 Credits
Contributors:
- Ibrahim Olayinka – Fullstack Developer
📧 ibrahimolayinkaa@gmail.com
📞 070-6564-3303

# 🏢 License
<!-- This project is proprietary software owned by: <br/>
<b>eTranzact International Plc</b>  <br/>
<b>Website: https://www.etranzact.com </b> <br/>
All rights reserved © eTranzact International Plc. -->
