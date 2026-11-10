# E-commerce API

TypeScript REST API using Express, Prisma, and PostgreSQL on Neon.

## Setup

1. Use Node.js 22.18 or newer and install packages with `npm install`.
2. Configure your Neon pooled URL as `DATABASE_URL`, the direct URL as `DIRECT_URL`, and a private `JWT_SECRET` of at least 32 characters. To enable email OTP, set `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` (a verified Brevo sender), and `BREVO_SENDER_NAME`. Cloudinary values are `cloudinaryApiKey`, `cloudinaryApiSecret`, and `cloudinaryCloudName`.
3. Generate Prisma Client: `npm run db:generate`.
4. Create and apply the first migration: `npm run db:migrate -- --name init`.
5. Start the API with `npm run dev`.

## API documentation

Open Swagger UI at `http://localhost:3000/api-docs` while the API is running. The OpenAPI 3.0 specification is also available as JSON at `http://localhost:3000/api-docs.json`.

Use the **Authorize** button in Swagger UI to provide the bearer token returned by sign-up or sign-in for protected endpoints. All accounts have the `USER` role. Product and category routes are read-only; product creation is an internal backend operation and is not exposed over HTTP.

Auth endpoints:

- `POST /api/auth/signup` accepts `email`, `password`, and `fullName`, then emails a verification code.
- `POST /api/auth/verify-email` accepts `email` and `otp`; successful verification returns a bearer token.
- `POST /api/auth/resend-verification` accepts `email` and resends a verification code if the account needs one.
- `POST /api/auth/signin` accepts `email` and `password`.
- `POST /api/auth/forgot-password` accepts `email` and emails a reset code when the account exists.
- `POST /api/auth/reset-password` accepts `email`, `otp`, and the new `password`.
- `POST /api/auth/change-password` requires a bearer token and accepts `currentPassword` and `newPassword`.

Passwords must be at least 12 characters and no more than 72 UTF-8 bytes. OTP codes expire after 10 minutes, can be used once, and allow five verification attempts. OTP endpoints are rate-limited. Signup and password reset require Brevo to be configured.

All accounts have the `USER` role. Products are read through the public catalog endpoints; product creation is available to backend code through `src/services/product.service.ts` and is not exposed as an HTTP endpoint. Run `npm run db:deploy` to apply the role and email-verification migrations.

## Project layout

```text
src/
  config/       database.ts, environment.ts
  controllers/ auth, user, product, category, cart, order, payment, review
  services/    auth, emailOtp, user, product, category, cart, order, payment
  routes/      auth, user, product, category, cart, order, payment, review
  middlewares/ auth, error, upload
  validators/  auth, product, order, user
  utils/       generateToken, sendEmail, emailTemplates, password, apiResponse
  types/       express.d.ts
  app.ts
  server.ts
prisma/
  schema.prisma
.env
.env.example
package.json
tsconfig.json
README.md
```

Authentication includes Brevo-powered email verification and password recovery. Run `npm run db:deploy` to apply committed migrations in a deployment environment.
