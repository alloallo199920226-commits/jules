# Administration IAMGOLD

## Accès

- La console est servie par le chemin privé choisi par l’utilisateur dans le secret `ADMIN_PATH` (avec ou sans `/` initial, un seul segment de 16 à 100 caractères parmi lettres, chiffres, `@`, `_` et `-`). Sa valeur ne figure ni dans le code ni dans la base de données.
- Aucun chemin de secours : sans secret valide, la page de console est inaccessible. Le mot de passe opérateur reste obligatoire.
- Le site vérifie uniquement le chemin demandé auprès du serveur. La valeur du secret n’est jamais renvoyée dans une réponse JSON ni injectée dans le bundle membre. Modifier ce secret ne demande pas de modifier les chemins de routage du projet.
- Les valeurs précédemment communiquées dans la conversation ou présentes dans d’anciens checkpoints ne peuvent pas être considérées confidentielles. Choisir une nouvelle valeur dans le formulaire sécurisé plutôt que réutiliser un ancien chemin.
- `/admin`, `/omarshark-junior-panam` et `/administration/index.html` n’ouvrent plus la console. Aucun lien vers celle-ci n’est ajouté aux pages membres.
- L’interface importée est isolée dans son propre document ; ses styles ne remplacent pas ceux du site membre.
- Le lien difficile à deviner ne remplace pas le mot de passe. Les API administrateur conservent leurs contrôles d’authentification.
- Le chemin privé n’est pas recopié dans le bundle membre, ni dans les journaux applicatifs des requêtes. Les pages de console ne sont ni indexables ni mises en cache et n’envoient pas leur URL comme référence.
- Définir `ADMIN_CONSOLE_PASSWORD` dans les secrets du projet : 16 caractères minimum, long et unique recommandé. Ne pas écrire ce mot de passe dans le code.
- Les comptes membres ne donnent pas accès à l’administration. Les sessions opérateur durent huit heures ; une rotation du secret les invalide.

## Fonctionnement ajouté

- Produits : catégories `stable`, `wellbeing`, `activity`, affichées Stable, Bien-être, Activités. Le catalogue actif est partagé avec la page Investir. Les produits désactivés ne redeviennent pas des offres de référence.
- Forum : les nouvelles publications sont en attente ; l’auteur voit leur statut et, en cas de refus, le motif. Les autres membres ne voient que les publications approuvées.
- Une approbation peut accorder zéro FCFA ou un bonus entier positif. Un bonus supplémentaire peut être ajouté ensuite. Les montants n’ont pas le plafond de 100 000 FCFA de l’ancienne interface ; ils restent limités à la précision entière sûre du système.
- L’approbation et le crédit initial sont atomiques. Le portefeuille conserve des écritures idempotentes, plutôt qu’un solde modifiable sans historique.
- Le bonus cumulé est affiché sur la publication. Les vues sont uniques par membre ; une réaction par membre ; les commentaires sont persistants.
- La suppression définitive retire la publication, ses réactions/commentaires et l’image du stockage. Un crédit déjà enregistré reste conservé dans l’historique financier.
- Service client : conversation privée, texte, PNG/JPEG/WebP jusqu’à 5 Mo, réactions et réponses opérateur. L’administration voit les coordonnées du compte et son historique de conversation. Actualisation automatique toutes les deux secondes lorsque la conversation est ouverte.
- Les annonces publiées à destination de tous les membres apparaissent dans Notice. Les attributions administratives de produits apparaissent dans Mes commandes et restent distinguées d’un achat.

## Limites conservées explicitement

- Aucun prestataire de paiement n’était connecté à IAMGOLD. Cette intégration ne fabrique pas de versements, de dépôts, de retraits ni de revenus journaliers automatiques.
- Les crédits administratifs et primes sont des écritures réelles du portefeuille de l’application, pas des reçus de paiement Mobile Money.
- Les commandes sensibles de suppression massive de comptes restent désactivées, comme dans l’API source, pour préserver les comptes et les historiques.
- Les paramètres d’un prestataire absent ne peuvent pas être activés par un simple interrupteur.
- Les annonces ciblées par niveau sont stockées mais ne sont pas diffusées sans source fiable de niveau d’éligibilité.

## Vérification

Tests unitaires/intégration du catalogue et du portefeuille :

```sh
cd artifacts/api-server
../../scripts/node_modules/.bin/tsx --test tests/administration.test.ts
```

Ces tests utilisent une transaction annulée et ne conservent aucun compte ni mouvement de test.

Vérification navigateur authentifiée effectuée après la configuration du secret :

- authentification opérateur et refus d’un mot de passe incorrect ;
- approbation d’une publication avec 1 234 567 FCFA, puis ajout de 500 FCFA : cumul exact de 1 235 067 FCFA dans la publication et le portefeuille ;
- refus avec motif, puis suppression définitive vérifiée dans la base et le stockage ;
- réception d’un message et d’une image membre, puis réponse opérateur avec texte et image reçue côté membre ;
- création, désactivation, passage Stable → Bien-être → Activités et suppression d’un produit sans perte des autres champs.

Ces vérifications n’impliquent aucun paiement réel. Les comptes, primes, produits, images et marqueurs de catalogue synthétiques sont retirés après les tests ; la session opérateur de test est déconnectée.
