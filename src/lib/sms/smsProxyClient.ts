type SendSmsInput = {
  to: string;
  message: string;
};

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export async function sendSms(input: SendSmsInput) {
  const proxyUrl = process.env.SMS_PROXY_URL;
  const proxySecret = process.env.SMS_PROXY_SECRET;

  if (!proxyUrl || !proxySecret) {
    console.warn("[sendSms] SMS proxy environment variables are not set.");
    return { skipped: true };
  }

  const to = normalizePhone(input.to);

  if (!to) {
    console.warn("[sendSms] Recipient phone number is empty.");
    return { skipped: true };
  }

  const response = await fetch(proxyUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${proxySecret}`,
      "X-SMS-Proxy-Secret": proxySecret,
    },
    body: JSON.stringify({
      to,
      phone: to,
      message: input.message,
      text: input.message,
      secret: proxySecret,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");

    throw new Error(
      `SMS proxy request failed: ${response.status} ${response.statusText} ${responseText}`.trim(),
    );
  }

  return { skipped: false };
}
