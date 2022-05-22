import node_mailjet from 'node-mailjet';

const mailjet = node_mailjet.connect(
  "99ca6d484080265d8dfe461a606c4770",
  "8e8faf61b673a0b59a72f6c73d0df3ee"
);

export const request = mailjet.post("send", { version: "v3.1" }).request({
  Messages: [
    {
      From: {
        Email: "muofunanya3@gmail.com",
        Name: "Chukwuebuka",
      },
      To: [
        {
          Email: "muofunanya3@gmail.com",
          Name: "Chukwuebuka",
        },
      ],
      Subject: "Greetings from Mailjet.",
      TextPart: "My first Mailjet email",
      HTMLPart:
        "<h3>Dear passenger 1, welcome to <a href='https://www.mailjet.com/'>Mailjet</a>!</h3><br />May the delivery force be with you!",
      CustomID: "AppGettingStartedTest",
    },
  ],
});

