export const RECAPTCHA_SITE_KEY = (import.meta.env.VITE_RECAPTCHA_SITE_KEY || "").trim();

export function recaptchaActivo() {
  return RECAPTCHA_SITE_KEY.length > 0;
}
