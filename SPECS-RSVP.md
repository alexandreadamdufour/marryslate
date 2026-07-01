# Specs — Unification RSVP Marryslate

## Modèle : liste fermée (confirmation sur invitation)

Le couple saisit sa liste dans `guests`. Chaque invité reçoit un lien et confirme sa présence. Pas de réponse hors liste acceptée automatiquement.

## Architecture : deux tables reliées (PAS de fusion en une seule)

Raison : `guests` = qui le couple invite (intention, contrôlée par le couple). `rsvp_responses` = ce qu'un invité déclare (événement horodaté, externe). Garder les deux préserve la traçabilité, les changements d'avis, les doublons.

- **`guests`** : liste maître + colonne `rsvp_status` (`pending` / `accepted` / `declined` / `maybe`, défaut `pending`)
- **`rsvp_responses`** : journal des réponses + colonne `guest_id uuid NULL REFERENCES guests(id)` + colonne `status` (`matched` / `pending_validation` / `conflict`)

## Matching : par email

À la soumission du formulaire public, chercher dans `guests` un invité du même mariage avec le même email.

- **Match trouvé** → lier la réponse (`guest_id` renseigné, `status = matched`), mettre à jour `guests.rsvp_status` (`accepted` / `declined`). Sauf si conflit.
- **Pas de match** → `guest_id = NULL`, `status = pending_validation`, tombe dans la file à valider.

## Cas "pas de match" : file de validation

Le couple voit une file des réponses non rattachées. Pour chacune : associer à un invité existant, créer un nouvel invité depuis la réponse, ou rejeter (spam). Rien n'entre dans la liste maître sans approbation.

## Cas conflit : le couple garde la main

Si un invité matché répond différemment de ce que le couple avait noté, OU si le même email répond deux fois différemment → `status = conflict`, `guests.rsvp_status` PAS écrasé automatiquement. Le couple voit un flag "réponse divergente" et tranche.

## Vue dashboard unique

Une page listant tous les `guests` avec leur `rsvp_status`, + section "à valider" (réponses sans match) + section "divergences" (conflits). C'est la vue qui manque entièrement aujourd'hui.

## Points de vigilance build

- Le formulaire public actuel demande nom/prénom/email libres. En liste fermée, l'invité devra s'identifier par email (pour matcher). À rearticuler au build.
- `guest_rsvps` (table morte) : à supprimer proprement dans la foulée. Ne pas laisser 3 tables RSVP.
- Les policies RLS des nouvelles colonnes/statuts devront suivre le modèle `is_wedding_coowner` (déjà corrigé pour inclure le owner).
