# État Marryslate — fin session 30 juin 2026

## ✅ Résolu ce soir

- **Bascule prod complète** : Stripe live, Clerk prod, domaine marryslate.com, DNS, SSL, CSP, rebrand Amora→Marryslate, double webhook Stripe (commits `8c24ec9`, `01c9437`)
- **OAuth Google** : catch-all Clerk v6 `[[...sign-up]]`/`[[...sign-in]]` + `typedRoutes: false` + 4 env vars `NEXT_PUBLIC_CLERK_*` (commit `6c435ad`). Testé OK.
- **PGRST301** : provider Supabase Third-Party Auth recâblé du domaine Clerk dev vers prod (`clerk.marryslate.com`).
- **42501 createWedding** : cause = policy SELECT owner manquante. Le `.insert().select()` fait un `INSERT...RETURNING`, PostgREST applique les policies SELECT sur la ligne retournée ; `weddings_select_published` (`is_published=false`) et `weddings_select_coowner` (table vide) échouaient → RETURNING refusé. Fix = policy `weddings_select_owner` `USING (owner_id = current_user_id())` (commit `6b41acb`). + fix token Clerk résolu une fois dans `createClerkSupabaseClient` (`ca9744c`). Debug nettoyé (`54fa25f`). Testé OK : "Votre site est prêt !"

**App fonctionnelle de bout en bout : inscription Google → création de site.**

---

## ⏳ Pending (prochaine session)

| Item | Notes |
|---|---|
| **Test paiement réel end-to-end** | `payment_intent.succeeded` → contribution → email + notif couple. Nécessite couple avec Stripe connecté + KYC validé |
| **`STRIPE_WEBHOOK_SECRET_CONNECT`** | Vérifier que la valeur est bien posée dans Vercel (Production) |
| **Test URL publique `/m/slug`** | ISR, cookie access gate, + chevauchement padding URL `marryslate.com/m/` (cosmétique) |
| **Rebrand `confidentialite/page.tsx`** | passe 2 : replace_all Amora→Marryslate + grammaire + URL |
| **Rebrand `cgv/page.tsx`** | passe 2 : idem + "Frais Amora"→"Frais Marryslate" tableau |
| **5 couples beta** | Exit Club, Réseau Entreprendre, entourage |
