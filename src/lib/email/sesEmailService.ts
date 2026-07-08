import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "ap-northeast-2",
});

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailParams) {
  const fromEmail = process.env.SES_FROM_EMAIL;

  if (!fromEmail) {
    console.warn("SES_FROM_EMAIL is not configured.");
    return;
  }

  if (!to) {
    console.warn("Email recipient is empty.");
    return;
  }

  const command = new SendEmailCommand({
    Source: fromEmail,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: html,
        },
        Text: {
          Charset: "UTF-8",
          Data: text || subject,
        },
      },
    },
  });

  return sesClient.send(command);
}