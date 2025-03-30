const nodemailer = require("nodemailer");

exports.sendMail = async function (options) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const messageObj = {
    from: "Apartment management system <info@apartment.co.ke>", // sender address
    to: options.email,
    subject: options.subject,
    text: options.message // plain text body
    // html: "<b>Click me</b>", // html body
  };

  await transporter.sendMail(messageObj);
};

exports.trySending = async function (options) {
  try {
    const transporter = nodemailer.createTransport({
      host: "mail.easyconnectfaiba.co.ke",
      port: 465,
      secure: true,
      auth: {
        user: "info@easyconnectfaiba.co.ke",
        pass: "infoLogscpanel@25"
      }
    });

    if (options?.email?.length > 1) {
      console.log("Its true");

      await transporter.sendMail({
        from: "Apartment management system <info@easyconnectfaiba.co.ke>",
        to: "",
        bcc: options.email,
        subject: options.subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Client Inquiry</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #24303F;
              }
              .container {
                max-width: 600px;
                margin: 20px auto;
                background: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
              }
              .header {
                text-align: center;
                background: hsl(232, 35%, 8%);
                color: white;
                padding: 15px;
                border-radius: 8px 8px 0 0;
                font-size: 20px;
                font-weight: bold;
              }
              .content {
                padding: 20px;
                font-size: 16px;
                color: #333;
                line-height: 1.5;
              }
              .footer {
                text-align: center;
                font-size: 14px;
                color: #666;
                padding: 15px;
              }
              .button {
                display: inline-block;
                padding: 10px 20px;
                color: white;
                background: #3C50E0;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 10px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                Tenant communication
              </div>
              <div class="content">
                <p><strong>Message:</strong> ${options.message}</p>
                <p>Click the button below to reply:</p>
                <p><a href="mailto:${options.email}" class="button">Reply</a></p>
              </div>
              <div class="footer">
                &copy; 2025 Apartment management system 
              </div>
            </div>
          </body>
          </html>
        `
      });
    } else {
      console.log("sending here");
      const messageObj = {
        from: "Apartment management system <info@easyconnectfaiba.co.ke>",
        to: options.email,
        subject: options.subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Client Inquiry</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #24303F;
              }
              .container {
                max-width: 600px;
                margin: 20px auto;
                background: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
              }
              .header {
                text-align: center;
                background: hsl(232, 35%, 8%);
                color: white;
                padding: 15px;
                border-radius: 8px 8px 0 0;
                font-size: 20px;
                font-weight: bold;
              }
              .content {
                padding: 20px;
                font-size: 16px;
                color: #333;
                line-height: 1.5;
              }
              .footer {
                text-align: center;
                font-size: 14px;
                color: #666;
                padding: 15px;
              }
              .button {
                display: inline-block;
                padding: 10px 20px;
                color: white;
                background: #3C50E0;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 10px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                Tenant communication
              </div>
              <div class="content">
                <p><strong>Message:</strong> ${options.message}</p>
                <p>If you are no longer a tenant with us please ignore this message.</p>
              </div>
              <div class="footer">
                &copy; 2025 Apartment management system 
              </div>
            </div>
          </body>
          </html>
        `
      };

      const res = await transporter.sendMail(messageObj);
      console.log(res);
    }
  } catch (err) {
    throw err;
  }
};

//FIXME (WE SHALL IMPLEMENT CRON JOBS WHERE TENANTS CAN RECEIVE NOTIFICATIONS AT THE VERY BEGINNING OF THE MONTH FOR RENT REMINDERS)
