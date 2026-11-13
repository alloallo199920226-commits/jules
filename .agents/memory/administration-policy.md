---
name: Administration, forum et service client
description: Exigences métier de l’administration importée et des échanges entre membres et opérateurs.
---

L’administration NARKE fournie reste la base fonctionnelle : conserver ses liens, ses fonctions et les catégories Stable, Bien-être et Activités, la modération du forum et le service client conversationnel. L’utilisateur autorise désormais le nouveau design industriel IAMGOLD sur toute l’administration.

**Why:** après avoir demandé de préserver l’administration fournie, l’utilisateur précise « surtout adopte aussi le nouveau design à toute l’administration » et fournit les références bleu nuit/or. Cette autorisation visuelle ne permet pas d’inventer un nouveau tableau de bord ni de remplacer ses fonctions.

**How to apply:** le forum reçoit les publications en attente ; seuls les contenus approuvés sont publics. Les opérateurs peuvent refuser ou supprimer une publication, et attribuer un bonus positif en FCFA dont le cumul est visible sur la publication et dans le portefeuille du membre. Aucun bonus automatique. Une suppression de contenu n’annule pas un crédit financier déjà enregistré. Le chat est privé entre le membre et l’administration et accepte messages, images et réactions.

L’accès à la console doit utiliser le chemin privé choisi par l’utilisateur, sans rouvrir les anciens chemins administrateur. Ne pas remplacer son choix par un identifiant généré.

**Why:** l’utilisateur demande « un lien secret pour le chemin admin », puis précise qu’il souhaite le fournir lui-même. Ce lien est une adresse privée supplémentaire, pas un remplacement de l’authentification opérateur.

**How to apply:** conserver le chemin exclusivement dans le secret serveur `ADMIN_PATH`, jamais dans le code, les métadonnées de routage, la base de données, le bundle membre ni cette mémoire. Aucun chemin de secours lorsque ce secret manque. Ne pas ajouter de lien public vers la console et garder le mot de passe obligatoire.

**Why:** l’utilisateur a précisé « ça doit être un secret, aucune information sensible visible dans le code ». Demander une nouvelle valeur par le formulaire sécurisé : une valeur déjà partagée dans le chat ou enregistrée dans un ancien checkpoint ne devient pas confidentielle en déplaçant seulement son stockage.

La présentation effective de l’archive dépend de son adaptateur de marque côté serveur, pas uniquement de l’HTML brut exporté.

**Why:** le frontend brut porte encore un thème « silver » et peut afficher un logo vide ; le serveur original applique une présentation NARKE distincte. Copier uniquement le frontend brut ne restitue donc pas l’administration originale.

**How to apply:** tenir compte de l’adaptateur importé et de ses priorités pour appliquer le thème industriel demandé ; conserver les styles administrateur isolés des pages membres.

Les mutations POST, PATCH et DELETE sans données métier doivent tout de même déclarer un objet JSON vide dans le contrat partagé.

**Why:** la protection commune contre les requêtes intersites exige du JSON pour les mutations. Les actions sans corps ont été refusées malgré une session valide, notamment le compteur de vues et la suppression définitive.

**How to apply:** garder le contrat généré et la protection serveur cohérents pour toutes les nouvelles mutations ; ne pas désactiver la protection pour rendre une action sans corps fonctionnelle.

Les messages du support non confirmés doivent rester récupérables avec leur image après une actualisation, et une reprise doit garder la même identité de message.

**Why:** l’utilisateur a signalé un texte bloqué sur « Envoi… », sans image ni réception administrateur, puis la disparition de la conversation après actualisation. Un affichage optimiste ne prouve pas l’enregistrement côté serveur.

**How to apply:** protéger l’envoi avant le transfert, isoler les brouillons par compte, borner l’attente et ne jamais masquer une erreur d’envoi par un rafraîchissement réussi. Réconcilier les confirmations par identité, pas par texte identique.

Le service client administrateur doit s’ouvrir sur une liste de conversations, sans sélectionner ni lire automatiquement le premier message.

**Why:** l’utilisateur veut une véritable boîte de réception comme WhatsApp ou Facebook : voir le nom et l’aperçu, puis décider d’ouvrir ou non.

**How to apply:** garder les indicateurs non lus jusqu’à l’ouverture explicite ; sur téléphone, séparer la liste et la discussion et permettre de revenir à la liste.

La présence du service client et des membres doit venir du serveur, avec une première et une dernière activité horodatées. Un opérateur actif dans une discussion rend le service disponible pour tous les membres ; un statut vert ne doit jamais être décoratif.

**Why:** l’utilisateur exige que le statut en ligne soit « lié directement au serveur » et que les heures réelles soient visibles des deux côtés.

**How to apply:** utiliser une présence à durée limitée par onglet, interrompue lorsque la discussion n’est plus active, sans inventer d’historique antérieur au suivi. Le chargement ou le préchargement des messages ne confirme jamais leur lecture : seuls les messages entrants réellement visibles dans la discussion ouverte sont acquittés, une seule première date persistante.

Pour vérifier la console sans divulguer son adresse privée, capturer le contenu de son iframe plutôt que modifier l’adresse du navigateur.

**Why:** masquer l’adresse par `history.replaceState('/')` a déclenché le routage membre et affiché l’inscription, créant un faux diagnostic de panne de l’accès administrateur.

**How to apply:** transmettre l’adresse et la session au navigateur uniquement par le contexte de test protégé, sans les imprimer. Attendre le chargement de la console et travailler dans son iframe ; ne jamais changer le chemin pour préparer une capture.

Les tests de la console ne doivent jamais transmettre le mot de passe administrateur à une action navigateur ni le copier dans un fichier temporaire.

**Why:** un échec de saisie automatique a reproduit le mot de passe permanent dans une trace d’erreur. Une session de test révoquée ne révoque pas ce mot de passe.

**How to apply:** utiliser exclusivement une session éphémère injectée, obtenue par l’authentification serveur existante sans exporter son mot de passe. Si cette session ne suffit pas, diagnostiquer l’origine et les cookies, ou arrêter le test ; ne jamais contourner le blocage par une saisie du secret. Demander un renouvellement sécurisé si une valeur permanente est exposée.

Le service client administrateur doit s’ouvrir directement en plein écran, avec un bouton de retour à l’administration.

**Why:** l’utilisateur a signalé une zone de messages trop fermée et trop basse, puis demandé « faire plein écran si on clique sur service client avec un bouton de retour ».

**How to apply:** consacrer l’espace à la liste et aux discussions, sans le grand bandeau ni la navigation administrative au-dessus. Garder distincts le retour à la liste des conversations et le retour à l’administration ; laisser les détails du membre consultables sans réduire en permanence la zone de messages.

La messagerie du service client doit également être en plein écran côté membre, avec son bouton de retour.

**Why:** l’utilisateur demande « Plein écran ici aussi » sur une capture de la discussion membre montrant le grand bandeau et la navigation du bas.

**How to apply:** retirer ces deux éléments uniquement de la discussion membre pour donner la place aux messages ; garder la saisie accessible et conserver le suivi de présence, les pièces jointes et les lectures réelles.

Le plein écran de l’inbox doit retirer les autres zones de navigation du rendu, pas seulement augmenter son ordre de superposition.

**Why:** les contextes de superposition du thème administratif ont laissé les onglets au-dessus du plein écran, interceptant les clics malgré sa position fixe.

**How to apply:** masquer le bandeau, les actions et les onglets uniquement pendant la présence de l’inbox, puis les restaurer au retour. Ne pas supprimer leurs éléments : le bouton de retour réutilise la navigation administrative existante.

Les discussions plein écran doivent suivre à la fois la hauteur et le décalage de la zone visible lorsque le clavier iOS s’ouvre.

**Why:** après le passage plein écran, les captures iPhone montraient la saisie remontée et un grand espace vide au-dessus du clavier ; une adaptation limitée à la hauteur ne tient pas compte du déplacement de Safari pendant la mise au point.

**How to apply:** suivre aussi les déplacements de la zone visible et la fin de l’animation de mise au point, sans forcer le défilement de la page ni déplacer le curseur. Pour l’administration embarquée, adapter le conteneur extérieur aux coordonnées du navigateur et garder des coordonnées locales à l’intérieur ; ne pas appliquer deux fois le décalage parent. Distinguer les tests simulés d’un véritable essai sur iPhone.
