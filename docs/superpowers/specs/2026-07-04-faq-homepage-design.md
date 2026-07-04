# Bloc 3 — Chantier 3 : Section FAQ sur la homepage

> Spec 3/4 du Bloc 3 (UX/conversion). Ordre d'exécution : 1 (onboarding, fait) > 2 (empty states, fait) > 3 (ce document) > 4 (compteur social proof).

## Contexte

Demande initiale : ajouter une section FAQ en bas de la homepage marketing avec 8-10 questions type "Combien ça coûte ?", "Puis-je essayer gratuitement ?", "Comment fonctionne la cagnotte ?".

État des lieux (vérifié dans le code avant design) :
- Une page FAQ dédiée existe déjà : `src/app/(marketing)/faq/page.tsx`, 14 questions réparties en 3 sections ("Créer son site mariage" ×5, "Liste de cadeaux & cagnotte" ×5, "Invités" ×4), avec `Accordion`/`AccordionItem`/`AccordionTrigger`/`AccordionContent` de shadcn/ui (`type="multiple"`).
- La homepage (`src/app/(marketing)/page.tsx`) a 4 sections dans cet ordre : Hero → Features (bento grid) → Social proof/chiffres (constante `STATS`) → CTA final.
- Aucune question au wording exact "Combien ça coûte ?" ou "Puis-je essayer gratuitement ?" n'existe dans les 14 questions actuelles — la plus proche est "Quelle est la commission prélevée sur les contributions ?" (section cagnotte), reformulée pour ce chantier.

Décision validée : réutiliser le contenu existant de `/faq` plutôt que d'inventer de nouvelles questions, en sélectionnant les 9 plus pertinentes comme objections principales à l'achat, avec un wording raccourci et plus direct que la page dédiée (qui reste, elle, exhaustive).

## Sélection finale (9 questions, wording homepage)

1. **Comment créer mon site mariage avec Marryslate ?** — Inscrivez-vous gratuitement, renseignez les prénoms et la date, et votre site est en ligne en quelques minutes. Vous personnalisez ensuite tout depuis votre tableau de bord.
2. **Combien de temps faut-il pour créer le site ?** — Le site de base est prêt en moins de 5 minutes. Comptez 30 minutes à 1 heure pour l'enrichir avec votre histoire, vos photos et le programme de la journée.
3. **Comment fonctionne la liste de cadeaux ?** — Vous créez des cadeaux avec un montant cible, vos invités contribuent librement par carte bancaire. Dès qu'un cadeau est financé, il est marqué comme tel sur votre site.
4. **Combien ça coûte ?** — C'est gratuit. Aucun abonnement, aucun frais caché. Seule une commission de 2,9 % + 0,30 € est prélevée par contribution reçue — elle couvre les frais de paiement et le service.
5. **Dans quel délai recevons-nous les fonds ?** — Les fonds sont disponibles sous 2 à 7 jours ouvrés après chaque paiement. Vous demandez le virement vers votre IBAN quand vous voulez.
6. **Le paiement est-il sécurisé ?** — Oui. Tous les paiements passent par Stripe, certifié PCI-DSS niveau 1. Marryslate ne stocke jamais les données bancaires de vos invités.
7. **Comment les invités participent-ils à la liste de cadeaux ?** — Ils accèdent à votre site via le lien que vous partagez, choisissent un cadeau ou une contribution libre, et paient par carte. Aucun compte Marryslate n'est nécessaire.
8. **Peut-on modifier le site après sa publication ?** — Oui, à tout moment. Textes, photos, cadeaux, infos pratiques — tout reste modifiable, avec une mise à jour visible en moins de 60 secondes.
9. **Comment fonctionne le RSVP ?** — Activez-le en un clic depuis votre tableau de bord. Vos invités indiquent leur présence, le nombre d'accompagnants et leurs restrictions alimentaires directement sur votre site.

**Écartées** (restent disponibles sur `/faq` pour qui veut plus de détail) : thèmes graphiques disponibles, nom de domaine personnalisé, que se passe-t-il en cas d'annulation, KYC, livre d'or.

## Placement et structure

- Nouvelle section insérée dans `src/app/(marketing)/page.tsx`, **entre** la section "Social proof / chiffres" et la section "CTA" finale.
- Titre de section court (ex. "Questions fréquentes"), cohérent avec le style des titres de section déjà présents (`<h2 className="mb-12 text-center text-3xl">` utilisé par Features).
- Un seul `Accordion` plat de 9 items (pas de regroupement en 3 catégories comme sur `/faq` — plus punchy, cohérent avec la demande "plus court, plus punch").
- Lien discret en bas de section, style texte/lien plutôt que bouton, du type "Voir toutes les questions →" pointant vers `/faq`.
- Données des 9 questions définies en constante locale dans `page.tsx` (même pattern que la constante `STATS` déjà présente dans ce fichier) — pas de nouveau composant partagé, pas de nouveau fichier, section non réutilisée ailleurs.
- Fond de section : plein (pas de `bg-muted/50`), pour ne pas dupliquer un fond muted juste avant la section CTA qui en a déjà un.

## Fichiers concernés

- `src/app/(marketing)/page.tsx` : ajout de la constante des 9 questions + la nouvelle section JSX, insérée entre Social proof et CTA. Import de `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` depuis `@/components/ui/accordion` (déjà utilisés ailleurs, composant non modifié) et `Link` (déjà importé dans ce fichier).
- Aucun changement à `src/app/(marketing)/faq/page.tsx` ni à `src/components/ui/accordion.tsx`.

## Hors scope (explicitement exclu)

- Pas de modification du contenu ou de la structure de la page `/faq` dédiée.
- Pas de nouvelles questions au-delà des 9 sélectionnées parmi les 14 existantes.
- Pas de schema.org `FAQPage` structuré ajouté pour le SEO dans ce chantier (pourrait être une amélioration future, mais non demandé).

## Tests

Aucun test automatisé pour cette page (page statique, pas de logique métier — cohérent avec CLAUDE.md §15 "Pas de test pour : pages statiques sans logique"). Vérification manuelle : ouvrir la homepage, confirmer que les 9 questions s'affichent et se déplient correctement, que le lien vers `/faq` fonctionne, et que la section s'intègre visuellement sans rupture avec les sections voisines (mobile et desktop).
