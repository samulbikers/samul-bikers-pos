# Samul Bikers POS

Point-of-sale, inventory, staff and reporting app for Samul Bikers, built with TanStack Start and Supabase.

## Development

You need Node.js and bun (or npm).

```sh
bun install
cp .env.example .env.local
bun run dev
```

Fill `.env.local` from the Supabase project settings:

```sh
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<key>
```

## Database

All business data lives in Supabase. Schema changes belong in `supabase/migrations/`.

To apply migrations:

```sh
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

You can also paste the migration SQL into the Supabase SQL editor.

The app uses:

- `products`, `categories` for the website catalogue and POS.
- `pos_customers`, `pos_sales`, `pos_sale_items` for receipts.
- `pos_expenses`, `pos_suppliers`, `pos_purchase_orders` for operations.
- `pos_inventory_movements` for stock audit history.
- `pos_branches` and `pos_staff_accounts` for branch logins. Staff PINs are hashed and only exposed through the `pos_staff_*` RPCs.

## Install as an app (PWA)

Samul Bikers ships as an installable PWA. The **Install** control appears on the login screen, in the top bar and in the sidebar. Installing adds the POS to the home screen, app list or desktop and opens it in a standalone window.

The manifest is at `public/manifest.webmanifest`; the service worker is `public/sw.js` and is registered only in production builds. Icons, `favicon.ico`, `favicon.png` and `apple-touch-icon.png` are generated from `src/assets/samul-bikers-logo.png`.

## Sign-in

Staff sign in with a username and 4-digit PIN. Demo accounts:

| Role | Username | PIN |
| --- | --- | --- |
| Owner | `samson` | `1234` |
| Store manager | `miriam` | `2468` |
| Cashier | `lucy` | `1234` |
| Cashier | `esther` | `4321` |
