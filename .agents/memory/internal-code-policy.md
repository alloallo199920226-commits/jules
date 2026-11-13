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

Le libellé du toast de génération du code doit être exactement « SMS envoyé », sur fond noir flottant, puis disparaître.

**Why:** après explication qu’aucun SMS réel n’est envoyé, l’utilisateur a expressément demandé uniquement ce texte pour le toast.

**How to apply:** il s’agit d’un choix de libellé, pas d’une demande d’intégration SMS. Ne pas modifier le mode de livraison du code ni prétendre qu’un fournisseur SMS a été connecté.
