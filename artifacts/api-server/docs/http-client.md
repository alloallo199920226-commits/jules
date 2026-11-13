# Client HTTPS JSON — serveur uniquement

## Périmètre et état

Module autonome `src/lib/http-client.ts`, sans dépendance ajoutée, utilisant le
`fetch` natif de Node.js 24. Aucun import depuis le démarrage, les routes ou le
navigateur. L’import ne lit pas l’environnement, ne crée pas de timer et ne fait
aucun appel réseau. Il n’est pas branché aux fonctionnalités existantes.

Aucun paiement, prestataire, connecteur, portefeuille, compte ou accès à la base
de données. Aucun secret réel requis, aucune variable existante modifiée et
aucun déploiement effectué pour ce module.

## Configuration explicite

Les exemples suivants sont **non exécutés**, avec des destinations et valeurs
fictives. Ne pas les coller dans une route existante sans travail d’intégration
distinct et validation du contrat distant.

```typescript
import { createHttpClient } from "./lib/http-client";

const client = createHttpClient({
  baseUrl: "https://service.example.invalid/v1/",
  timeoutMs: 10_000,                 // défaut : 10 secondes ; entier 1 à 120 000 ms
  maxResponseBytes: 1_048_576,        // défaut : 1 Mio ; entier 1 à 16 777 216 octets
  allowedRequestHeaders: ["x-request-id"],
  // token volontairement omis : requêtes anonymes possibles.
});

const result = await client.get<{ label: string }>("items", {
  query: { page: 1, tag: ["alpha", "beta"], enabled: true },
  headers: { "x-request-id": "exemple-fictif" },
  signal: new AbortController().signal,
  validate(value) {
    if (!value || typeof value !== "object" ||
        !("label" in value) || typeof value.label !== "string") {
      throw new Error("Contrat invalide");
    }
    return { label: value.label };
  },
});
// result : { status: number, data: { label: string } | undefined }

const created = await client.post<unknown>("items", { label: "Exemple fictif" });
```

La base de confiance est choisie par **l’opérateur**, jamais depuis une URL fournie
par un utilisateur. Une base sans barre finale est traitée comme un répertoire :
`https://service.example.invalid/v1` devient `https://service.example.invalid/v1/`.
La base doit être HTTPS, sans identifiants, query string ni fragment.

Les chemins sont relatifs à ce répertoire : `items` ou `nested/items`. Les URL
absolues, les chemins commençant par `/` ou `\`, les changements d’origine,
les traversées `..`, les segments `.`, certains encodages ambigus, les espaces,
les query strings et fragments intégrés sont refusés. Utiliser `query` pour les
paramètres ; les tableaux produisent plusieurs occurrences de la même clé, et
`undefined` est omis. Les nombres doivent être finis.

Les seuls headers personnalisés acceptés sont ceux explicitement autorisés par
`allowedRequestHeaders` à l’instanciation. `Accept: application/json` et, pour
POST, `Content-Type: application/json` sont gérés par le client. L’autorisation
est exclusivement `Bearer <token>` lorsque `token` est fourni. Les headers
d’autorisation, cookies, destination, connexion, contenu et autres headers
réservés ne peuvent pas être autorisés ni remplacés par requête. Les retours
ligne dans les valeurs sont refusés. Aucun cookie ambiant n’est envoyé.

## Fabrique facultative depuis l’environnement serveur

```typescript
import { createHttpClientFromEnv } from "./lib/http-client";

// Exemple seulement : NE PAS exécuter au démarrage du serveur actuel.
const client = createHttpClientFromEnv();
// La configuration est lue et validée seulement lors de cet appel.
```

Cette fabrique lit uniquement :

| Nom | Usage |
| --- | --- |
| `EXTERNAL_API_BASE_URL` | Base HTTPS obligatoire si la fabrique est appelée |
| `EXTERNAL_API_TIMEOUT_MS` | Délai facultatif, chiffres décimaux entiers, 1 à 120 000 ms |
| `EXTERNAL_API_TOKEN` | Secret Bearer facultatif, ASCII imprimable sans espace |

L’absence de configuration n’affecte pas le serveur actuel : il n’appelle pas
la fabrique. Une chaîne vide pour le délai ou le token est invalide ; omettre la
variable facultative plutôt que lui donner une valeur vide.

La fabrique conserve les limites et headers par défaut. Pour personnaliser la
limite ou autoriser un header supplémentaire, utiliser la configuration explicite.
Les clés ne sont jamais préfixées `VITE_`, importées dans le frontend, renvoyées
par une route ou inscrites dans des fichiers versionnés.

### Procédure Replit Secrets pour une utilisation future

**Rien à configurer pour exécuter les tests ou utiliser l’application actuelle.**
Si une intégration distincte est ultérieurement approuvée :

1. Ouvrir l’outil **Secrets** du projet dans l’éditeur Replit.
2. Ajouter la base de confiance sous `EXTERNAL_API_BASE_URL` et, si nécessaire,
   le délai sous `EXTERNAL_API_TIMEOUT_MS`.
3. Seulement si le service choisi exige un token, le saisir dans Secrets sous
   `EXTERNAL_API_TOKEN`, jamais dans le chat, les logs, le code ou une variable
   destinée au navigateur.
4. Les secrets de développement et de production se gèrent séparément. Une
   éventuelle configuration de production se fait dans **Publishing →
   Production app secrets**, dans un travail explicitement autorisé ; ce module
   ne configure ni ne publie rien.

Référence : https://docs.replit.com/core-concepts/project-editor/app-setup/secrets

## Délais, ressources et réponses

- Un seul délai couvre l’attente des headers **et toute la consommation du corps**.
  L’annulation de l’appelant est distincte d’un timeout et ne reprend pas sa
  `signal.reason` potentiellement sensible.
- Le timer et l’écouteur d’annulation sont retirés dans tous les cas. Le transport
  est interrompu ; les corps non consommés sont annulés et les verrous de lecteur
  libérés. Une réponse tardive d’un transport simulé ignorant l’annulation est
  également jetée. Une annulation de flux n’est pas attendue indéfiniment.
- `Content-Length` permet un rejet anticipé, mais les octets du flux sont aussi
  comptés, même si le header est absent ou mensonger. La limite porte sur les
  octets fournis par `fetch` (corps décompressé dans le transport natif), pas
  sur le nombre de caractères ni la seule taille annoncée.
- Un corps réellement vide, y compris 204, donne `data: undefined` sans parse JSON
  ni validateur. Un corps contenant uniquement des espaces n’est pas du JSON.
  La valeur JSON `null` reste `null`. JSON/UTF-8 invalide produit une erreur dédiée.
- Le type générique n’est **pas** une validation runtime. Utiliser `validate`
  pour vérifier les données non fiables ; ce parseur synchrone peut transformer
  le résultat et ses erreurs sont assainies. Les réponses vides restent possibles,
  même avec un validateur, et doivent être traitées par l’appelant.
- Les données POST doivent être sérialisables en JSON. Les limites de taille
  concernent la réponse, pas la requête ; l’appelant reste responsable de valider
  le contenu et la taille de son payload.
- Aucun retry, ni GET ni POST. Un timeout ou un échec réseau **ne prouve pas**
  que le serveur distant n’a pas traité un POST ; ne pas le renvoyer
  automatiquement. Aucune idempotence métier n’est inventée par ce client.

## Erreurs sûres

`HttpClientError` expose `code`, un message fixe et éventuellement `status`.
Sa sérialisation JSON ne contient que ces champs et le nom de l’erreur.

| Code | Sens |
| --- | --- |
| `CONFIGURATION` | Configuration ou paramètres de requête invalides |
| `NETWORK` | Échec du transport, y compris pendant le corps |
| `TIMEOUT` | Délai dépassé |
| `CANCELLED` | Annulation par l’appelant |
| `HTTP_STATUS` | Statut non-2xx, notamment redirection, ou transport ayant suivi une redirection |
| `INVALID_JSON` | JSON ou UTF-8 invalide |
| `INVALID_RESPONSE` | Échec du validateur runtime |
| `RESPONSE_TOO_LARGE` | Réponse dépassant la limite |

Le statut distant utile est conservé pour les erreurs HTTP et celles liées au
contenu. Ni corps distant, ni headers, URL, query, token, payload, texte de statut
ou cause brute ne sont conservés dans l’erreur. Aucun logging n’est effectué et
le logger existant n’est pas modifié. Ne pas ajouter de journalisation des options,
de la configuration ou des réponses dans de futurs appelants.

## Sécurité et limites

Le client utilise `redirect: "manual"` : aucun saut de redirection ni transfert
d’autorisation vers une autre destination. Une redirection est une erreur HTTP,
pas une nouvelle tentative. La validation TLS native est conservée ; aucune
option de désactivation des certificats, agent personnalisé ou modification TLS
globale n’est installée.

La vérification de base **n’est pas un filtre réseau anti-SSRF complet** : elle
ne bloque pas les adresses privées, locales ou réservées, ne contrôle pas les
résolutions DNS et ne protège pas contre le DNS rebinding. L’opérateur doit
choisir une base approuvée ; prévoir des contrôles DNS/IP et des règles de sortie
réseau distincts si le modèle de menace l’exige. Ne jamais exposer la configuration
de base, de headers autorisés ou du transport injecté aux utilisateurs.

`fetch` injecté est une facilité de test, réservée au code serveur de confiance.
Le transport natif est utilisé par défaut. Les tests simulés ne prouvent pas la
connectivité HTTPS réelle, les propriétés TLS d’un déploiement, les autorisations
d’un service ni la disponibilité d’une destination.

Comme tout timer JavaScript, le délai ne peut pas interrompre du code synchrone
bloquant (sérialisation/parse JSON ou validateur). La limite de réponse borne les
octets retenus, pas exactement le pic mémoire : chunks, buffer final, texte et
objet JSON ont un surcoût. Un chunk déjà alloué par le transport peut lui-même
dépasser la limite avant son rejet.

## Vérification autonome, sans réseau

Depuis la racine du dépôt, avec Node.js 24 et les dépendances déjà installées :

```sh
node --test artifacts/api-server/tests/http-client.test.mjs
pnpm --filter @workspace/api-server run typecheck
```

Les tests importent directement le TypeScript via Node.js 24, injectent le
transport et n’importent ni routes ni base de données. Ils ne demandent aucun
secret, n’utilisent aucun compte et ne contactent aucun service externe.
