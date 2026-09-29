# Comparaison des reflets et optimisation des captures

## Résultat de `specular: false`, à résolution 1,5

Trois passages par variante, ordre on/off, off/on, on/off, sur `projets.html` en thème sombre, Chromium 154 sur Mac, WebGPU, 1280 × 900, DPR 1, onglet visible. Même protocole que le premier audit : cache HTTP désactivé sur le serveur local et fenêtre de repos de 3,5 à 6,5 secondes. La variante avec reflets est servie uniquement par le serveur de test ; le réglage réel du site reste `false`.

| Médiane au repos | Reflets activés | Reflets désactivés |
|---|---:|---:|
| Exécution des callbacks d’animation du site | 26,8 ms/s | 21,3 ms/s |
| Appels du moteur au rendu `_renderFrame` | 120/s | 0/s |
| Callbacks d’animation exécutés | 240/s | environ 240/s |
| Intervalles de callbacks dépassant 50 ms | 0 | 0 |

La baisse du temps des callbacks est d’environ **20 %**. Les valeurs individuelles sont 26,7 / 30,5 / 26,8 ms/s avec reflets et 21,3 / 13,0 / 24,3 sans : le temps varie, mais les trois essais confirment la suppression des rendus au repos.

Le moteur continue de vérifier le défilement et les changements de la scène. Zéro appel au rendu ne signifie pas zéro activité JavaScript, ni zéro consommation du navigateur. Le compteur `_renderFrame` ne mesure pas directement le temps GPU ou la consommation électrique. Une mise à jour reste attendue dès que le contenu, le thème ou la position changent.

La capture de la barre sur cette page mesure maintenant 1920 × 5729 pixels sur ordinateur, contre 2746 × 8192 dans l’audit à résolution effective 3. Ce changement de dimensions est lié à la résolution, distinct du changement des reflets.

## Captures : origine des doublons et correction appliquée

La sonde distingue les appels à `captureSnapshot()` des captures effectivement acceptées et terminées. L’appel de `registerDynamic()` pendant une capture en cours est déjà ignoré : nous ne le comptons pas comme une capture exécutée.

Deux corrections ciblées ont été appliquées au fichier local de liquidGL :

1. La première notification de `ResizeObserver`, sans changement de dimensions, ne déclenche plus une seconde capture après celle du constructeur. Les notifications avec changement réel et les événements de redimensionnement de la fenêtre restent traités.
2. La suppression d’une lentille décorative `content: false`, déjà exclue de la capture par `data-liquid-ignore`, ne déclenche plus de recapture pour ce renderer. L’invalidation de la composition est conservée. Les autres suppressions gardent leur comportement.

Comparaison d’un scénario mobile avant/après, 390 × 844 sur le même Mac :

| Captures exécutées | Avant | Après |
|---|---:|---:|
| Chargement initial | 3 | 2 |
| Première ouverture du panneau | 2 | 1 |
| Fermeture du panneau | 1 | 0 |

Ces comptages proviennent d’un passage de chaque scénario, et non d’une étude statistique des temps. Les durées varient ; aucune baisse garantie du temps d’ouverture ou de la consommation n’est déduite de ce seul passage.

Il reste au chargement la capture initiale et une actualisation demandée par le contrôleur après chargement des images. Les filtrages qui changent la hauteur de la page peuvent encore provoquer à la fois une capture du moteur et une demande du contrôleur. Leur regroupement demanderait de coordonner explicitement les demandes, sans perdre les mises à jour d’images ni de thème ; cette modification plus large n’a pas été faite.

## Vérifications et portée

- Contrôle de syntaxe JavaScript du contrôleur et du vendor ; contrôle du diff.
- Après correction : captures effectives confirmées lors du changement de thème, du filtre Audio et du passage de 1280 × 900 à 390 × 844.
- Barre, panneau mobile et sous-menu Projets atteignent tous l’état prêt ; rendu sombre vérifié visuellement, aucune erreur ou alerte console sur ce scénario.
- Le contrôleur `nav-glass.js` n’a pas été modifié pendant cet audit : les réglages utilisateur résolution 1,5 et reflets désactivés sont conservés.
- Les deux modifications locales de la bibliothèque sont documentées dans `assets/vendor/liquidgl/README.md` et doivent être réévaluées lors d’une mise à jour de liquidGL.
- Pas de mesure sur iPhone réel, d’autonomie, de température ou de temps GPU. Les sondes ajoutent un léger coût d’instrumentation dans les deux variantes.

## Fichiers et reproduction

- `results.json` : six comparaisons des reflets, plus un scénario de captures avant et un après.
- `verification.json` : trace des actualisations nécessaires après correction.
- `nav-before.js`, `vendor-before.js` : sources de référence avant correction, conservées pour les comparaisons.
- `probe.js`, `server.py` : instrumentation locale, qui ne modifie pas les réponses du site en production.

Lancer `python3 audits/2026-09-29-liquid-glass/followup/server.py`. Les URL `/projets.html?specular=on&captures=before` et `?specular=off&captures=before` comparent les reflets à résolution 1,5. `?specular=off&captures=after` utilise le vendor corrigé. Attendre 7 secondes pour la mesure du repos ; ouvrir ou fermer le menu et attendre 4 secondes pour chaque scénario. Le JSON est dans `#perf-results`. La touche F8 actualise le relevé après des actions de vérification. Garder le même thème, les mêmes dimensions et l’onglet visible. Le serveur lit les sources courantes pour la variante après correction.
