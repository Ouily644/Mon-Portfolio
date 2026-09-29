# Mesure de Liquid Glass — 29 septembre 2026

Le Liquid Glass ajoute un coût mesurable, surtout à l’initialisation et dans les animations JavaScript au repos. L’ouverture du menu reste fluide dans ce test sur Mac. Aucune optimisation du site n’a été appliquée pendant cet audit.

## Protocole

- Page : `projets.html`, thème sombre identique, avec `?glass=on` ou `?glass=off`. Le mode off conserve le verre CSS du site : il ne supprime pas tout travail graphique.
- 12 passages : 3 par variante et par format, ordre off/on puis on/off puis off/on. Un premier chargement d’étalonnage a été exclu.
- Navigateur intégré Chromium 154, macOS, moteur Liquid Glass WebGPU, onglet visible. Dimensions 1280 × 900 et 390 × 844 ; DPR mesuré : 1. La cadence au repos du navigateur est d’environ 120 Hz.
- Serveur HTTP local temporaire, réponses `Cache-Control: no-store`, sans bridage CPU/réseau. Pas une mesure des temps de téléchargement sur Internet.
- Mesure initiale : 0–3 s depuis la navigation. Repos : 3,5–6,5 s. Après ce délai : trois gestes de défilement (bas/bas/haut) sur ordinateur, ou ouverture du menu sur mobile ; fenêtre d’observation de 4 s à partir de l’action.
- Instrumentation identique dans les deux variantes : intervalles entre callbacks `requestAnimationFrame`, durée synchrone des callbacks d’animation du site, `PerformanceObserver` pour les tâches longues et l’affichage initial. Les mesures sont publiées après chaque fenêtre ; les appels d’automatisation peuvent eux-mêmes introduire du bruit.
- Toutes les pages mesurées sont restées visibles. Aucun échec de rendu observé. Les médianes ci-dessous portent sur 3 passages seulement.

## Résultats

| Indicateur (médiane) | Verre CSS seul | Liquid Glass |
|---|---:|---:|
| Ordinateur : durée cumulée des tâches JS ≥ 50 ms pendant les 3 premières secondes | 0 ms | 128 ms (2 tâches) |
| Format mobile : même mesure au démarrage | 0 ms | 158 ms (2 tâches) |
| Ordinateur : exécution des callbacks d’animation au repos, par seconde | 0 ms | 39 ms |
| Format mobile : même mesure au repos | 0 ms | 42 ms |
| Ordinateur : cadence des callbacks pendant la fenêtre de défilement | 117,3 Hz | 113,3 Hz |
| Ordinateur : intervalles entre callbacks > 50 ms, sur la fenêtre de défilement | 1 | 3 |
| Format mobile : cadence des callbacks pendant l’ouverture et les 4 s suivantes | 119,8 Hz | 119,5 Hz |
| Format mobile : intervalles entre callbacks > 50 ms dans cette fenêtre | 0 | 0 |
| Format mobile : exécution des callbacks d’animation sur cette fenêtre de 4 s | 0 ms | 180 ms |

Les 39–42 ms/s concernent uniquement les callbacks d’animation mesurés, pas toute la consommation CPU et encore moins celle du GPU. Le témoin utilise des animations CSS : la valeur JS nulle ne signifie pas un rendu gratuit. Avec Liquid Glass, environ 240 callbacks d’animation par seconde restent actifs au repos dans ces conditions.

La cadence mesurée est celle des callbacks JavaScript, pas un compteur d’images effectivement présentées par le GPU. Le défilement montre un petit écart, mais le faible nombre de passages et le bruit des gestes automatisés ne permettent pas de conclure à une baisse stable de FPS de ce pourcentage.

Le verre de la barre est prêt vers 409 ms sur ordinateur et 451 ms au format mobile après le début de navigation (médianes). Le panneau mobile devient prêt 31 ms après le clic, plage 27–70 ms. Le délai configuré à zéro ne supprime donc pas le temps d’initialisation du moteur.

### Chargement et taille

- Bibliothèque ajoutée par Liquid Glass : **297 029 octets**, soit environ **297 ko non compressés**. Une compression gzip locale donne **61 031 octets** ; ce chiffre ne prouve pas que l’hébergement utilise gzip.
- Le contrôleur `nav-glass.js` de 12 289 octets est présent dans les deux variantes ; `glass=off` empêche le chargement de la bibliothèque.
- Premier affichage de contenu, ordinateur : 124 ms sans / 108 ms avec. LCP : 220 / 160 ms. Format mobile : premier affichage 124 / 116 ms, LCP 256 / 184 ms.
- Ces chiffres de chargement local très courts et variables **ne montrent pas une accélération due à Liquid Glass**. La bibliothèque démarre après le chargement ; son principal coût peut arriver après les premiers indicateurs d’affichage. Aucun impact réseau de production n’est quantifié ici.

### Résolution et mémoire

La résolution demandée est `4`, limitée par le code de la bibliothèque à `3`. La texture de capture observée pour la barre vaut 2746 × 8192 pixels sur ordinateur et 583 × 8192 au format mobile. À 4 octets/pixel, cela représente respectivement environ **85,8 Mio** et **18,2 Mio** pour une seule image RGBA. Ce sont des estimations de volume d’image, **pas une mesure de mémoire GPU réellement allouée** : le moteur possède d’autres buffers et textures. Le panneau mobile ajoute un second renderer, partagé avec ses sous-menus.

## Avis et priorités

L’effet est utilisable sur le Mac testé, mais il a un coût permanent même sans interaction. Avant de l’étendre à davantage d’éléments, je testerais une résolution de capture de **1 ou 1,5** et je comparerais la netteté au réglage actuel. Ce gain reste à mesurer : aucune variante optimisée n’a été testée ici.

Ensuite, réduire ou suspendre le travail d’animation quand rien ne change pourrait réduire le coût au repos. Cela demande de préserver les mises à jour nécessaires lors du défilement, des changements de thème et de l’ouverture des menus.

L’autonomie, la température, la consommation électrique et les performances Safari sur iPhone **n’ont pas été mesurées**. Le format mobile utilisé ici reste exécuté par le Mac. Le test ne couvre pas toutes les pages, tous les navigateurs, les réseaux mobiles ni une utilisation prolongée.

## Refaire la mesure

`python3 audits/2026-09-29-liquid-glass/server.py` sert la copie instrumentée sur `http://127.0.0.1:8006`. Le serveur lit les fichiers du site et ajoute la sonde uniquement dans la réponse HTML ; les sources du site restent inchangées. Ouvrir `/projets.html?glass=off`, puis la variante `glass=on`, dans le même navigateur visible et aux mêmes dimensions. Attendre au moins 7 secondes ; effectuer les gestes de défilement ou ouvrir le menu ; attendre 4 secondes. Les résultats sont dans le texte JSON de l’élément `#perf-results`. Répéter trois fois par variante. Le serveur temporaire utilisé pour cet audit a été arrêté.

Fichiers joints : `results.json` (12 mesures brutes), `probe.js` et `server.py` (protocole instrumenté).

Références : [tâches longues ≥ 50 ms](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceLongTaskTiming), [requestAnimationFrame et cadence/visibilité](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame). Les paramètres et dimensions de textures proviennent du code local et de l’instance du renderer mesurée.

## Empreintes des fichiers mesurés (SHA-256)

- `nav-glass.js` : `a752d77b92e2467ff3307f98b95a943dc97c141f3c6e8e8352350df639dbaaf9`
- `styles.css` : `60f0ecb11d81a81f168ce48c96269dc5737d6eab00e65c8353c239495acc68de`
- `assets/vendor/liquidgl/liquidGL.js` : `1025e58436096a8d66ba787fac840ebd2e211c29835cd4c356f4d268f58b8926`
