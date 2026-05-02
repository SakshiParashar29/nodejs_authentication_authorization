// node scripts/totp-qr.js "otpauth://totp/NodeAuthApp:sangam%40gmail.com?secret=K5YH2B3LIRNT2URS&period=30&digits=6&algorithm=SHA1&issuer=NodeAuthApp"

const QRCode = require('qrcode');

const otpAuthUrl = process.argv[2];

if(!otpAuthUrl){
    throw new Error("Pass otpAuthurl as argument");
}

async function main() {
    await QRCode.toFile('totp.png', otpAuthUrl);
    console.log('Saved qr code');
}

main().catch((err) => {
    console.log(err);
    process.exit(1);
})
