# PROJET — Plateforme française de liste de mariage & cagnotte en ligne

> **Statut** : spécification fondatrice. À lire intégralement avant d'écrire la moindre ligne de code.
> **Référence concurrentielle** : MilleMercisMariage.com (leader FR depuis 2003), Zankyou, Mille et Une Listes, Leetchi (pour la couche cagnotte).
> **Positionnement** : produit concurrent fonctionnellement équivalent, construit sur stack moderne, mobile-first, UX premium. **Aucune copie de code, de texte, de visuel ou d'asset de ces concurrents**.

---

## 0. CONTEXTE & OBJECTIF

Construire une plateforme française permettant à un couple de :
1. Créer une **liste de mariage** (idées cadeaux financées par leurs proches)
2. Recevoir une **cagnotte libre** en complément
3. Disposer d'un **site de mariage personnalisé** (URL publique partagée aux invités)
4. Gérer **l'organisation** (RSVP, plan de table, budget, checklist)

**Cible** : couples français 28-38 ans, CSP+, urbains. Mobile = 60%+ du trafic.

**Avantage différenciant** :
- Stack technique moderne (vs MMM en ASP.NET 2003)
- Mobile-first natif
- Onboarding < 2 minutes
- Personnalisation visuelle supérieure du site mariage public
- Aucune guerre des prix au lancement → positionnement design/expérience

**Non-objectifs explicites** :
- ❌ Pas de réplication visuelle/code/textes des concurrents
- ❌ Pas d'annuaire de prestataires en phase 1 (lourdeur ops sans ROI court terme)
- ❌ Pas d'app mobile native avant traction (PWA suffit)
- ❌ Pas de scraping de catalogues concurrents
- ❌ Pas de positionnement low-cost (1% + 0,30 € est intenable sans volume historique)

---

## 1. STACK TECHNIQUE — NON NÉGOCIABLE

```
Frontend       : Next.js 15 (App Router) + TypeScript strict + Tailwind CSS
Composants UI  : shadcn/ui + Radix primitives
Animations     : Framer Motion (sobre, pas de showroom)
Auth           : Clerk (OAuth Google + email magic link)
Database       : Supabase (Postgres + Row Level Security)
Storage        : Supabase Storage (images, assets)
Paiement       : Mangopay (voir §5 — point critique)
Emails         : Resend (templates React Email)
Hosting        : Vercel
Analytics      : Vercel Analytics + GA4 + Plausible
i18n           : next-intl (FR par défaut, EN dès le MVP)
Forms          : react-hook-form + zod
Tables/lists   : TanStack Table
Dates          : date-fns + date-fns-tz
Maps           : Mapbox (pour localisation des lieux d'événement)
Tests          : Vitest (unit) + Playwright (E2E sur les flows critiques)
```

**Interdits absolus** : jQuery, Bootstrap, classes globales CSS, templating legacy, librairies abandonnées.

---

## 2. PERSONAE & ARCHITECTURE FONCTIONNELLE

### 2.1 Trois personae

| Persona     | Auth ? | Capacités |
|-------------|--------|-----------|
| **COUPLE**  | Oui    | Crée et gère son wedding, sa liste, sa cagnotte, son site, ses invités, ses retraits |
| **INVITÉ**  | Non    | Accède au site via lien partagé, RSVP, contribue à la liste/cagnotte |
| **ADMIN**   | Oui    | Back-office : modération, analytics, support, gestion KYC |

### 2.2 Modules — Phase 1 (MVP, 8 semaines)

1. **Auth + Onboarding couple** — inscription, prénoms, date du mariage, slug du site
2. **Liste de mariage** — CRUD idées cadeaux (titre, description, image, prix cible), jauge de financement multi-contributeurs sur un même cadeau
3. **Cagnotte libre** — alternative ou complément à la liste
4. **Site mariage public** — URL `domaine.com/[slug]`, sections customisables : hero, notre histoire, programme/événements, lieu(x) avec carte, dress code, RSVP, livre d'or, galerie photo
5. **Espace invité** — consultation, contribution, RSVP, message au couple
6. **Dashboard couple** — montant collecté, liste des contributions, export CSV, demande de retrait
7. **Paiement bout-en-bout** — wallet Mangopay, KYC, payouts

### 2.3 Modules — Phase 2 (post-MVP)

- Wedding planner (checklist temporelle 12 mois → jour J)
- Gestionnaire d'invités (import CSV, groupes, multi-événements)
- Plan de table (drag & drop)
- Budget mariage (catégories, alertes)
- Blog SEO mariage (critique pour acquisition organique)

### 2.4 Modules — Phase 3+

- Annuaire de prestataires (revenu B2B)
- Marketplace cadeaux directs (commission partenaires)
- App mobile native si traction

---

## 3. SCHÉMA DE DONNÉES SUPABASE

```sql
-- Profil métier (Clerk gère l'auth, on stocke le profil produit)
users (
  id uuid PRIMARY KEY,              -- clerk_user_id
  email text NOT NULL,
  display_name text,
  role enum('couple', 'admin') DEFAULT 'couple',
  mangopay_user_id text,            -- ref Mangopay
  kyc_status enum('not_started', 'pending', 'validated', 'rejected'),
  created_at timestamptz DEFAULT now()
)

-- Un compte couple = un wedding
weddings (
  id uuid PRIMARY KEY,
  owner_id uuid REFERENCES users(id),
  partner1_first_name text,
  partner2_first_name text,
  wedding_date date,
  slug text UNIQUE NOT NULL,        -- URL publique
  cover_image_url text,
  theme_id text DEFAULT 'classic',  -- preset de thème
  primary_color text,
  story_md text,                    -- "notre histoire" en markdown
  is_published boolean DEFAULT false,
  mangopay_wallet_id text,
  created_at, updated_at
)

-- Co-administration : les deux mariés peuvent gérer
wedding_coowners (
  wedding_id uuid REFERENCES weddings(id),
  user_id uuid REFERENCES users(id),
  PRIMARY KEY (wedding_id, user_id)
)

-- Idées cadeaux dans la liste
gifts (
  id uuid PRIMARY KEY,
  wedding_id uuid REFERENCES weddings(id),
  title text NOT NULL,
  description text,
  image_url text,
  target_amount numeric(10,2),      -- prix cible en euros
  current_amount numeric(10,2) DEFAULT 0,
  category text,
  external_url text,                -- lien vers marchand externe optionnel
  is_active boolean DEFAULT true,
  position int,                     -- ordre d'affichage
  created_at, updated_at
)

-- Contributions reçues
contributions (
  id uuid PRIMARY KEY,
  wedding_id uuid REFERENCES weddings(id),
  gift_id uuid REFERENCES gifts(id),     -- NULL si cagnotte libre
  guest_name text NOT NULL,
  guest_email text,
  guest_message text,
  gross_amount numeric(10,2),            -- ce que paie l'invité
  fee_amount numeric(10,2),              -- notre commission
  net_amount numeric(10,2),              -- ce qu'encaisse le couple
  mangopay_payment_id text,
  payment_status enum('pending','succeeded','failed','refunded'),
  is_anonymous boolean DEFAULT false,
  created_at timestamptz
)

-- Événements du mariage (mairie, cérémonie, vin d'honneur, soirée)
wedding_events (
  id uuid PRIMARY KEY,
  wedding_id uuid REFERENCES weddings(id),
  title text NOT NULL,
  start_at timestamptz,
  end_at timestamptz,
  location_name text,
  location_address text,
  location_lat numeric(9,6),
  location_lng numeric(9,6),
  dress_code text,
  description text,
  position int
)

-- Invités (utilisé en phase 2)
guests (
  id uuid PRIMARY KEY,
  wedding_id uuid REFERENCES weddings(id),
  first_name text,
  last_name text,
  email text,
  group_name text,
  side enum('partner1','partner2','both'),
  rsvp_token text UNIQUE             -- pour lien RSVP individuel
)

guest_rsvps (
  guest_id uuid REFERENCES guests(id),
  event_id uuid REFERENCES wedding_events(id),
  status enum('pending','accepted','declined','maybe') DEFAULT 'pending',
  guests_count int DEFAULT 1,
  dietary_restrictions text,
  responded_at timestamptz,
  PRIMARY KEY (guest_id, event_id)
)

-- Retraits demandés par le couple
withdrawals (
  id uuid PRIMARY KEY,
  wedding_id uuid REFERENCES weddings(id),
  amount numeric(10,2),
  iban_last4 text,
  mangopay_payout_id text,
  status enum('pending','processing','succeeded','failed'),
  requested_at, processed_at
)

-- Messages livre d'or
guestbook_messages (
  id uuid PRIMARY KEY,
  wedding_id uuid REFERENCES weddings(id),
  author_name text,
  message text,
  is_visible boolean DEFAULT true,
  created_at timestamptz
)
```

**Row Level Security — règles strictes** :
- `weddings` : lecture publique si `is_published = true`, écriture réservée aux `wedding_coowners`
- `gifts` : lecture publique si le wedding parent est publié, écriture coowners only
- `contributions` : lecture publique des champs `guest_name`, `gross_amount`, `guest_message` (sauf si `is_anonymous`), tout le reste coowners only
- `withdrawals` : coowners only (jamais public)
- `guests`, `guest_rsvps` : coowners only + token-based pour le RSVP individuel

---

## 4. STRUCTURE D'URLS

```
PUBLIQUES
/                                  → landing page
/comment-ca-marche                 → explication du produit
/tarifs                            → page tarifs
/blog                              → index blog SEO
/blog/[slug]                       → article
/idees-cadeaux                     → catalogue inspirations indexable
/idees-cadeaux/[slug]              → fiche idée cadeau (génération SEO)
/m/[slug]                          → site public du couple (préfixe /m/ pour distinguer)
/m/[slug]/cadeau/[giftId]          → page d'un cadeau spécifique
/m/[slug]/contribuer               → flow de contribution
/m/[slug]/rsvp/[token]             → RSVP individualisé par invité
/m/[slug]/livre-d-or               → livre d'or
/connexion, /inscription, /mentions-legales, /cgu, /cgv, /confidentialite

AUTHENTIFIÉES (couple)
/dashboard                         → vue d'ensemble
/dashboard/site                    → éditeur du site mariage
/dashboard/liste                   → gestion liste de cadeaux
/dashboard/cagnotte                → vue cagnotte libre
/dashboard/contributions           → liste des contributions reçues
/dashboard/invites                 → gestion invités (phase 2)
/dashboard/retrait                 → demande de retrait + KYC
/dashboard/parametres              → settings du compte

ADMIN
/admin/*                           → back-office (protégé par role=admin)
```

**Note importante** : on évite le slug en racine (`/[slug]`) pour ne pas entrer en collision avec les routes produit. Le préfixe `/m/` (pour "mariage") est propre et permet aussi un éventuel sous-domaine `mariage.domaine.com/[slug]` plus tard.

---

## 5. PAIEMENT — POINT CRITIQUE

### 5.1 Pourquoi pas Stripe seul

Héberger une cagnotte = détenir des fonds pour le compte de tiers = activité d'établissement de paiement = nécessite un agrément ACPR **ou** un partenariat avec un établissement agréé. Stripe Connect ne couvre pas proprement ce cas en France (pas de cantonnement adapté + KYC marketplace moins outillé que les acteurs français).

### 5.2 Choix : Mangopay

- Agréé ACPR (établissement de monnaie électronique)
- API moderne, doc claire
- Modèle wallet → wallet → payout adapté aux cagnottes
- Gère le KYC end-to-end (CNI, justificatif de domicile, RIB)
- Standard du marché français (Leetchi, qui est leur produit B2C, fait le même métier que nous)
- Tarifs sandbox : 1,8% + 0,18 € par transaction, négociable au volume

### 5.3 Architecture paiement à implémenter

**À l'inscription du couple** :
1. Création d'un `MangoPayUser` (Natural User)
2. Création d'un `Wallet` en EUR lié à cet utilisateur
3. Stockage des IDs dans `users.mangopay_user_id` et `weddings.mangopay_wallet_id`

**Quand un invité contribue** :
1. Form de paiement carte (Mangopay Hosted ou Direct Card Payment)
2. Création d'un `CardDirectPayIn` vers le wallet du couple
3. Au succès : insertion dans `contributions` avec statut `succeeded`
4. Notre commission est calculée et stockée (gross - fee = net)
5. Email de confirmation à l'invité + notification au couple

**Avant le premier retrait** :
1. KYC obligatoire : upload CNI recto/verso, justificatif de domicile <3 mois, RIB
2. Validation Mangopay (24-72h)
3. Création d'un `BankAccount` lié à l'utilisateur

**Quand le couple demande un retrait** :
1. Création d'un `PayOut` du wallet vers le BankAccount
2. Statut suivi via webhook
3. Email de confirmation au couple

### 5.4 Webhooks Mangopay à implémenter

- `PAYIN_NORMAL_SUCCEEDED` / `FAILED`
- `KYC_SUCCEEDED` / `FAILED`
- `PAYOUT_NORMAL_SUCCEEDED` / `FAILED`
- `TRANSFER_NORMAL_SUCCEEDED` (si on fait des virements internes)

**Idempotence** : tous les handlers webhook doivent être idempotents (vérifier `mangopay_payment_id` avant insertion).

### 5.5 Modèle économique

Commission par contribution : **2,9% + 0,30 €** au lancement (positionnement design premium, pas guerre des prix).

À calculer côté serveur, jamais côté client. Stocker `fee_amount` et `net_amount` dans `contributions` pour audit.

---

## 6. UX / DESIGN

- **Mobile-first absolu** — chaque écran pensé 375px d'abord, desktop ensuite
- **Esthétique** : moderne, élégante, chaleureuse. Pas le purple foncé daté de MMM. Direction recommandée : palette pastel claire (crème, terracotta léger, vert sauge) ou très contrastée noir/blanc avec accents colorés. Typographies : une serif élégante (Fraunces, Cormorant) + une sans-serif neutre (Inter, Geist).
- **Onboarding 4 étapes max** : prénoms → date → slug → c'est prêt. Tout le reste se remplit dans le dashboard.
- **Site invité ultra rapide** : Next.js ISR (revalidate 60s), images optimisées en WebP/AVIF, lazy loading, fonts en `display: swap`.
- **Cookie banner** : minimal, Axeptio ou solution simple maison. Pas de dark pattern.
- **Loading states** : Suspense + skeletons partout où c'est pertinent.

---

## 7. SEO — VITAL POUR L'ACQUISITION

L'acquisition organique fait 80% du trafic des concurrents. À prévoir dès le MVP :

- **Sitemap dynamique** (next-sitemap)
- **robots.txt** propre
- **Schema.org** : `WebSite`, `Organization`, `Article` pour le blog, `Product` pour les idées cadeaux, `Event` pour les pages d'événements publics si on en expose
- **Open Graph + Twitter Cards** générés dynamiquement pour chaque wedding publié
- **Blog SSG** avec MDX, 10 articles fondateurs au lancement (mots-clés : "liste de mariage en ligne", "comment organiser son mariage", "cagnotte mariage", "site de mariage personnalisé", etc.)
- **URLs propres** : tirets, pas d'IDs, slugs lisibles
- **Meta titles & descriptions** générées per-page avec helpers Next.js metadata API
- **Internal linking** : maillage entre articles de blog, idées cadeaux et pages produit
- **Performance Core Web Vitals** : LCP < 2.5s, INP < 200ms, CLS < 0.1 — objectif top quartile

---

## 8. CONFORMITÉ & SÉCURITÉ

- **RGPD** : registre des traitements, DPA signés (Mangopay, Supabase, Vercel, Resend), page politique de confidentialité rédigée correctement (pas de modèle générique), implémentation du droit à l'effacement et du droit à la portabilité
- **CGU, CGV et mentions légales** distinctes — rédigées par un avocat ou template sérieux, jamais ChatGPT direct
- **CSRF** : géré nativement par Next.js Server Actions, à vérifier sur les autres routes
- **Rate limiting** : Vercel Edge ou Upstash Redis sur les routes publiques (notamment les routes de contribution et de RSVP pour éviter le spam)
- **Logging** : actions sensibles loguées (création de retrait, modification de RIB, modification de slug, suppression de wedding) — log structuré JSON envoyé vers Axiom ou Logflare
- **Anti-spam** : Cloudflare Turnstile sur les formulaires publics (contribution, livre d'or, RSVP)
- **Sécurité Supabase** : RLS activée sur **toutes** les tables sans exception, jamais de service role key côté client

---

## 9. ROADMAP DE BUILD (8 SEMAINES MVP)

### Sprint 1 — Foundations (semaines 1-2)
- Setup repo, lint/format/typecheck en CI
- Schéma DB + migrations + RLS
- Auth Clerk + onboarding couple (4 étapes)
- Dashboard squelette
- Création et édition d'un wedding (champs de base + slug check unique)

### Sprint 2 — Liste & Site public (semaines 3-4)
- CRUD idées cadeaux (drag & drop ordering)
- Upload images via Supabase Storage avec compression
- Page publique `/m/[slug]` avec sections hero, story, événements, liste
- Au moins 2 thèmes visuels presets (classique, contemporain)

### Sprint 3 — Paiement bout-en-bout (semaines 5-6)
- Intégration Mangopay sandbox
- Flow de contribution (carte) côté invité
- Webhooks + idempotence
- KYC + premier retrait test en sandbox
- Emails transactionnels (Resend) : reçu contribution, notif couple, KYC validé, payout effectué

### Sprint 4 — Polish & lancement beta (semaines 7-8)
- SEO : sitemap, schema.org, meta tags, 5 articles de blog fondateurs
- Pages légales rédigées correctement
- Cookie banner
- 10 couples beta réels (panel) → recueil feedback
- Bugfix + UX polish + perf audit Lighthouse

---

## 10. QUESTIONS OUVERTES À RÉSOUDRE AVANT CODE

À me confirmer avant de scaffold le projet :

1. **Nom du produit** ? (à fixer pour le repo, le domaine, le branding initial)
2. **Domaine déjà acheté** ? Si oui lequel.
3. **Direction esthétique** : palette pastel claire OU contrastée noir/blanc OU autre piste ? Inspirations visuelles (sites références) ?
4. **Préfixe URL pour site mariage** : `/m/[slug]` confirmé OU autre préfixe OU sous-domaine ?
5. **Phase 1 strict ou phase 1+wedding planner basique** ? (impact +2 semaines)
6. **Mangopay confirmé ou hésitation Lemon Way** ?
7. **Budget marketing initial** disponible pour acquisition payante en complément du SEO ?

---

## 11. AVERTISSEMENT JURIDIQUE INTERNE

Ce projet est un **concurrent direct** sur un marché ouvert (liste de mariage / cagnotte). C'est légitime et légal. Trois lignes rouges à ne jamais franchir :

1. **Aucune reproduction** de code, textes éditoriaux, articles de blog, FAQ, structures de pages, charte graphique ou assets visuels des concurrents existants.
2. **Aucun scraping** de leurs catalogues, idées cadeaux, ou bases utilisateurs.
3. **Aucune référence comparative dénigrante** dans la communication publique. Communication de marque autonome.

La différenciation se fait par l'**exécution produit supérieure**, pas par la copie.

---

## PROCHAINE ACTION POUR CLAUDE CODE

1. Lis ce document **en entier**.
2. Confirme la compréhension globale et pose les 7 questions du §10.
3. Une fois les réponses reçues, scaffold Sprint 1 dans cet ordre : init Next.js → setup Supabase + migration initiale → intégration Clerk → premier flow d'onboarding.
4. À chaque fin de sprint, produire un récap des trade-offs faits et des dettes techniques accumulées.
