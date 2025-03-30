const africastalking = require("africastalking");

/**Initializing africa's talking */

const at = africastalking({
  apiKey:
    "atsk_04713f3a4c855f1ec12e8c11619929814896d15296733d01c16b3faab37d9223ff2b45b5",
  username: "sandbox"
});
const sms = at.SMS;

async function sendSms(numTo) {
  try {
    const response = await sms.send({
      to: [`${numTo}`],
      message: "Hello there,we have something for you check it out",
      enqueue: true,
      from: "ams"
    });

    console.log(response);
    console.log(response.SMSMessageData.Recipients);
  } catch (err) {
    console.log(err);
  }
}

module.exports = sendSms;
