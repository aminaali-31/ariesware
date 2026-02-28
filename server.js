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
  
  // Checkboxes: req.body.service can be a string (one selected) or array (multiple)
  let services = req.body.service || [];
  if (!Array.isArray(services)) {
    services = [services];
  }

  // Basic validation
  if (!name || !email || !message || !phone) {
    req.session.messages = ['All fields are required'];
    return res.redirect('/contact');
  }

  try {
    // Now you can pass phone and services to your email function
    await sendEmail(name, email, message, phone, services);
    req.session.messages = ['Message sent successfully! You will be contacted soon.'];
    res.redirect('/contact');
  } catch (error) {
    console.error('Email error:', error);
    req.session.messages = ['Something went wrong. Please try again later.'];
    res.redirect('/contact');
  }
});

async function sendEmail(name, senderEmail, message, phone, services) {
  const EMAIL_ADDRESS = process.env.EMAIL;
  const EMAIL_PASSWORD = process.env.PASSWORD;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_ADDRESS,
      pass: EMAIL_PASSWORD
    }
  });

  const mailOptions = {
    from: EMAIL_ADDRESS,
    to: EMAIL_ADDRESS,
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

  return transporter.sendMail(mailOptions);
}


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
