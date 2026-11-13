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

Ne pas modifier le système de code SMS en place. L’utilisateur précise : « c’est envoyé automatiquement depuis le serveur du site même ».

**Why:** l’utilisateur a expressément demandé de ne rien toucher à ce système après la reconstruction visuelle.

**How to apply:** préserver le fonctionnement et les libellés existants lors des prochaines modifications visuelles. Ne pas remplacer ce système ni lancer une intégration SMS supplémentaire sans demande explicite.

Le message de génération de la page du mot de passe de transaction doit être exactement « sms envoyés », avec remplissage automatique du code renvoyé par le serveur du site, comme auparavant.

**Why:** l’utilisateur a demandé expressément de rétablir ce libellé et ce fonctionnement après le changement de message effectué pendant la refonte.

**How to apply:** conserver la réponse et le remplissage automatiques existants ; ne pas remplacer le message par une explication technique.
