## https://www.youtube.com/watch?v=RIGfqjwnq2s&t=1177s
```ts
export const mailsender = async (email, otp, otp_type)=> {
    let htmlContent = fs.readFileSync('otp_template.html', 'utf-8');
    htmlContent = htmlContent.replace('Trading_otp', otp);
    htmlContent = htmlContent.replace('Trading_otp2', otp_type);

    const options = {
        url: ""
    }

    htmlContent = await inlineCss(htmlContent, options)

    try {
        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            secure: false,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        })
        const result = await transporter.sendMail({
            from: process.env.MAIL_FROM,
            to: email,
            subject: "Trading APP - OTP Verification",
            html: htmlContent
        })
        return result;
    } catch (error){
        console.log(error)
        throw error
    }

}

```
```ts
export const generateOTP = () => {
    const otp = otpGenerator.generate(6,{
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false
    })
    return otp
}
```