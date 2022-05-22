import node_mailjet from 'node-mailjet';
import * as dotenv from "dotenv";

dotenv.config();

const mailjet = node_mailjet.connect(
  process.env.MAIL_API_KEY || "",
  process.env.MAIL_API_SECRET || ""
);

export const sendEmail = async (to: string, message: string= '') => {
  const request = await mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: "muofunanya3@gmail.com",
          Name: "Chukwuebuka",
        },
        To: [
          {
            Email: to,
            Name: "Chukwuebuka",
          },
        ],
        Subject: "Greetings from Mailjet.",
        TextPart: "message",
        // HTMLPart: "<h3>Dear passenger 1, welcome to <a href='https://www.mailjet.com/'>Mailjet</a>!</h3><br />May the delivery force be with you!",
        HTMLPart: message,
        CustomID: "AppGettingStartedTest",
      },
    ],
  });

  try {
    const result = await request.body;
    console.log(result)
  } catch (err) {
    console.log(err)
  }

  
  // request.then((result) => {
  //     console.log(result.body);
  //   })
  //   .catch((err) => {
  //     console.log(err.statusCode);
  //   });
}

