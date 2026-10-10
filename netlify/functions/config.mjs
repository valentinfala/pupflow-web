// Public checkout settings for checkout.html (the client id is public by design).
import { json, PRICE, LIST_PRICE } from "../lib/shared.mjs";
export default async () => json(200, {
  clientId: process.env.PAYPAL_CLIENT_ID || "",
  env: process.env.PAYPAL_ENV === "live" ? "live" : "sandbox",
  price: PRICE(),
  listPrice: LIST_PRICE(),
});
