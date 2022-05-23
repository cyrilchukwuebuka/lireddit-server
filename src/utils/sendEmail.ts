import node_mailjet from 'node-mailjet';
import * as dotenv from "dotenv";

dotenv.config();

const mailjet = node_mailjet.connect(
  process.env.MAIL_API_KEY || "",
  process.env.MAIL_API_SECRET || ""
);

export const sendEmail = async (email: string, message: string= '') => {
  const request = await mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: "muofunanya3@gmail.com",
          Name: "Chukwuebuka",
        },
        To: [
          {
            Email: email,
            Name: "Chukwuebuka",
          },
        ],
        Subject: "Greetings from Mailjet.",
        TextPart: "message",
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
}

