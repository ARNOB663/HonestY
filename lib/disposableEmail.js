// Block a short list of well-known disposable / throwaway inbox providers on
// registration. Not a perfect filter — new domains pop up constantly — but it
// eats the most common throwaway-account vector with zero UX cost for real
// users. Anything not on this list is allowed.
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "sharklasers.com",
  "10minutemail.com",
  "10minutemail.net",
  "tempmail.com",
  "tempmail.net",
  "temp-mail.org",
  "temp-mail.io",
  "trashmail.com",
  "trashmail.net",
  "yopmail.com",
  "yopmail.fr",
  "throwawaymail.com",
  "fakeinbox.com",
  "getnada.com",
  "maildrop.cc",
  "mintemail.com",
  "moakt.com",
  "tutanota.com",
  "discard.email",
  "spambox.us",
  "mailnesia.com",
  "dispostable.com",
  "mvrht.net",
  "tempinbox.com",
  "wegwerfmail.de",
  "mail-temp.com",
  "emlhub.com",
  "inboxbear.com",
]);

export function isDisposableEmail(email) {
  if (typeof email !== "string") return false;
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const domain = email.slice(at + 1).toLowerCase().trim();
  return DISPOSABLE_DOMAINS.has(domain);
}
