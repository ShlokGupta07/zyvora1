# ZYVORA store

## Run locally
1. Node 18+ required. `npm install`
2. `cp .env.example .env`, fill in Razorpay **test** keys (Razorpay Dashboard > Account & Settings > API Keys, Test Mode). Never commit `.env`.
3. `set -a; . ./.env; set +a; npm start`, then open http://localhost:3000 (not the file directly).
4. `npm test` runs the unit tests (pricing, stock, signatures, webhooks).

Edit prices/stock/featured flags in `products.json` (`p` = whole rupees, `s` = stock, `f` = featured). Stock numbers are placeholders. Photos: `public/img/<SKU>.jpg`.

## Payments (all verified on the server)
- **Card/UPI app/netbanking:** server prices the cart from `products.json`, creates a Razorpay order, Checkout opens, then `/api/verify` checks the signature. Orders are marked paid only by a valid signature or a valid webhook whose amount, currency and order id match.
- **Pay via UPI QR:** the server asks Razorpay for a single-use, fixed-amount `upi_qr` for that order (valid 10 min). The page polls `/api/order/:id/status`, which confirms against Razorpay's QR payments list. Clicking or uploading anything never marks an order paid. **QR Codes must be enabled on your Razorpay account**; if not, the page shows an honest "not available" message. A static QR (e.g. a UPI profile screenshot) is NOT used: scanning it cannot confirm payment to this site.
- `MERCHANT_NAME` / `MERCHANT_UPI_ID` in `.env` are optional and only displayed if you set them. Nothing is invented.

## Test mode
Use `rzp_test_` keys. Razorpay's test Checkout lets you pick success or failure; see Razorpay's "test card/UPI details" docs. For QR in test mode, use the QR test/simulation tools described in Razorpay's QR Codes docs, and confirm your account supports it.

## Webhooks
Dashboard > Webhooks > add `https://YOUR-DOMAIN/api/webhook`, secret = `RAZORPAY_WEBHOOK_SECRET`, events: `payment.captured`, `payment.failed`, `order.paid`, `qr_code.credited`. Locally use an HTTPS tunnel (e.g. ngrok). Check the event names against current Razorpay docs; `qr_code.credited` handling is written from documentation and not yet exercised against Razorpay.

## Deploy
Host behind HTTPS, set `NODE_ENV=production` and the env vars in your host's secret manager, keep `data/` on persistent storage (or move to PostgreSQL), run `npm audit`.

## Before enabling live payments
Razorpay account activated; test payments (success, failure, cancel, QR) passed on staging; webhook verified end to end; refund process agreed; privacy, returns, shipping, terms pages and support contact added and legally reviewed; orders moved to a real database with backups; admin/seller panels and customer login built (not included yet); GST/tax treatment confirmed with your accountant.

## Not included yet
Customer accounts and order history, admin dashboard (products, stock, orders, refunds), coupons, seller portal, MFA, a database. Orders are in `data/orders.json`. Order status is visible only with the unguessable token returned at checkout.
