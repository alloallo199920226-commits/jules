---
name: Livraison du code interne
description: Choix de livraison du code et limites pour les futures fonctions de compte.
---

Le code demandé doit être fourni uniquement dans le site, sans envoi SMS.

**Why:** l’utilisateur a explicitement choisi « Uniquement dans le site » lors de la clarification entre les deux modes de réception.

**How to apply:** conserver l’affichage dans le site et le remplissage automatique. Ne jamais utiliser ce code affiché à l’utilisateur comme preuve de propriété du numéro, ni présenter sa validation comme une création de compte si aucun compte n’est enregistré.

Les retours de génération du code doivent rester de petits toasts noirs temporaires. Ne pas afficher d’encart bleu permanent contenant le code. Les protocoles industriels récents interdisent désormais les emojis et utilisent les icônes personnalisées.

**Why:** l’utilisateur a demandé de retirer ces encarts et de laisser les notifications quelques secondes seulement, sans inventer d’autres éléments.

**How to apply:** conserver le remplissage automatique du champ OTP et son toast de génération temporaire ; les formulaires industriels peuvent garder leurs erreurs de validation visibles sans exposer le code dans un encart séparé.

Le toast de génération doit désormais décrire la livraison réelle dans le site, sans annoncer un SMS qui n’est pas envoyé.

**Why:** l’utilisateur avait demandé le libellé « SMS envoyé », mais son protocole de reconstruction de la page de sécurité exige de ne pas simuler de service SMS ni de confirmation. Aucun fournisseur SMS n’est connecté dans le projet examiné.

**How to apply:** conserver la livraison interne et la validation serveur, avec un message explicite de génération du code dans le formulaire. Un envoi SMS réel nécessite une intégration distincte ; ne pas l’inventer.
