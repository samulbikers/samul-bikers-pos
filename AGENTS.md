# Project rules

## Stack

- TanStack Start + React + Vite on the front end.
- Supabase is the database and backend. There is no Lovable dependency; do not reintroduce Lovable-specific tooling or generated-file restrictions.

## Database

- SQL migrations live in `supabase/migrations/`. Add schema changes there, then apply them to the linked Supabase project.
- Apply migrations with `supabase db push` after `supabase link --project-ref <ref>`, or run the SQL in the Supabase SQL editor.
- Never commit a Supabase service-role key, database password, or personal access token. Browser code only uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from `.env.local`.
- Staff PINs are hashed in `pos_staff_accounts`. Never expose `pin_hash` to the browser or select it directly; use the `pos_staff_login`, `pos_staff_list`, `pos_staff_create`, `pos_staff_update`, `pos_staff_reset_pin` and `pos_staff_delete` RPCs.

## Application guidance

- Dashboard, POS and report figures must come from Supabase queries. Do not hard-code sample business data or label live screens as previews.
- Money is Kenyan shillings (KES). Receipts and Z reports must show subtotal, discounts, VAT and total separately.
- Products, categories, customers, suppliers, purchases, expenses, inventory, branches and staff accounts are Supabase-backed. Do not add new local-storage stores for business data.
