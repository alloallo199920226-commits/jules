---
name: Port du serveur de prévisualisation
description: Distinguer un aperçu fonctionnel du bon fonctionnement du serveur géré après un redémarrage.
---

Un aperçu qui fonctionne ne prouve pas que le workflow actif sert le port attendu.

**Why:** lors d’un redémarrage du sandbox, un ancien processus continuait de servir le port routé tandis que le nouveau serveur avait choisi silencieusement un autre port. Les captures fonctionnaient malgré ce décalage.

**How to apply:** comparer le port annoncé dans les journaux au port injecté avant de conclure qu’un redémarrage a réussi. Identifier les processus du service concerné, arrêter uniquement ses anciennes instances confirmées, puis redémarrer une fois. Ne pas déplacer le routage de l’artifact vers le port de remplacement.
