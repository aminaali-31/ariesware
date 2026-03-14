const express = require("express");
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const session = require('express-session');
require('dotenv').config();
const PORT = 3000;


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'thisismysecretkey', // change this to a strong secret
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // true if using HTTPS
}));

app.use((req, res, next) => {
  res.locals.messages = req.session.messages || [];
  req.session.messages = [];
  next();
});


// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true, // true if using port 465
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

app.get("/", (req, res) => {
  res.render('index');
});

app.get("/contact", (req,res) =>{
  res.render('contact');
});
app.get('/services', (req,res) => {
  res.render('service');
})

app.get('/why', (req,res) =>{
  res.render('why');
})
app.post('/send-mail', async (req, res) => {
    const { name, email, phone, message } = req.body;

    let services = req.body.service || [];
    if (!Array.isArray(services)) services = [services];

    if (!name || !email || !message || !phone) {
        req.session.messages = ['All fields are required'];
        return res.redirect('/contact');
    }

    const success = await sendEmail(name, email, message, phone, services);

    if (success) {
        req.session.messages = ['Message sent successfully! You will be contacted soon.'];
    } else {
        req.session.messages = ['Something went wrong. Please try again later.'];
    }

    res.redirect('/contact');
});
async function sendEmail(name, senderEmail, message, phone, services) {
    try {
        const mailOptions = {
            from: `"Website Contact Form" <amnaali@ariesware.com>`, // use your domain email
            to: "amina.ali.31032008@.com", // your email where you want to receive submissions
            replyTo: senderEmail, // so you can reply directly to the user
            subject: 'New Contact Form Message',
            text: `
              Name: ${name}
              Email: ${senderEmail}
              Phone: ${phone}
              Services Interested In: ${services.join(', ')}

              Message:
              ${message}
                          `
        };

        let info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return true;
    } catch (err) {
        console.error('Error sending email:', err);
        return false;
    }
}
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
