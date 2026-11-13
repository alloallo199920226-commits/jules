---
name: Étape obligatoire après inscription
description: Condition d’accès au tableau de bord imposée par l’utilisateur.
---

Après « S’inscrire », l’utilisateur doit passer par l’écran « Définir le mot de passe de transaction » et remplir ses informations avant d’accéder à son tableau de bord : numéro de mobile, mot de passe de transaction et code de vérification.

**Why:** l’utilisateur a signalé que cette étape des captures avait été oubliée et l’a explicitement rendue obligatoire avant le tableau de bord.

**How to apply:** intégrer cette étape au parcours de création de compte et empêcher l’accès au tableau de bord tant qu’elle n’est pas validée. Conserver le choix de livraison du code décrit dans internal-code-policy.md.

Le compte est enregistré dès la première étape, avec un accès limité jusqu’à la définition du mot de passe de transaction.

**Why:** une fermeture de page ou une reconnexion ne doit pas obliger l’utilisateur à recréer son compte ; elle doit reprendre l’étape manquante.

**How to apply:** conserver l’état incomplet côté serveur, pas seulement dans le navigateur, et vérifier cette condition sur les accès aux données du tableau de bord.

Les mots de passe de connexion et de transaction doivent être distincts.

**Why:** réutiliser le même secret supprimerait la séparation entre accès au compte et autorisation des transactions.

**How to apply:** refuser leur égalité sans modifier le premier mot de passe ni marquer l’étape comme terminée.
