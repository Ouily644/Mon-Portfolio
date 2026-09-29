# Essai des raccords avec Safari iOS 26.0

## Variantes

- Sans paramètre ou `?edges=background` : essai actif sur les écrans de 768 px ou moins et les appareils à pointeur principal tactile. `html` et `body` utilisent la même couleur par thème. Les halos décoratifs sont peints sur le fond défilant de `body` ; la couche `body::before` fixe et son dégradé plein écran sont désactivés. Le bas de la page rejoint ainsi la couleur unie du fond.
- `?edges=cover` : même fond, avec `viewport-fit=cover` ajouté avant la mise en page et des marges `safe-area-inset-*` sur le contenu, la barre du site et le panneau mobile.
- `?edges=off` : désactivation de l'essai ; fond fixe et viewport d'origine.

Si l'URL comporte déjà des paramètres, ajouter `&edges=...`. Les liens HTML internes conservent un mode explicitement demandé, y compris après filtrage et changement de langue. Le mode par défaut peut être désactivé globalement via `DEFAULT_MODE = 'off'` dans `safari-edges.js`.

L'essai est isolé dans `safari-edges.js` et `safari-edges.css`, inclus sur les 29 pages HTML utilisant la feuille de style du site. Aucun paramètre liquidGL n'a été modifié. Sur ordinateur à pointeur fin, le fond original est conservé.

## À comparer sur l'iPhone iOS 26.0

Utiliser une version accessible depuis l'iPhone et contenant ces modifications. Le serveur `localhost` du Mac n'est pas directement accessible à l'iPhone.

1. Ouvrir la même page dans les modes off, background, puis cover.
2. Comparer en clair et sombre, en haut et en bas de page.
3. Faire apparaître puis réduire la barre Safari en défilant dans les deux sens.
4. Comparer avec le menu du site fermé, puis ouvert, et en portrait/paysage.
5. Noter quelle variante réduit la bande ou la différence de couleur derrière les contrôles Safari, et si les liens restent accessibles.

## Vérifications réalisées

Dans Chromium sur Mac : couleurs de fond `html`/`body` identiques en clair et sombre ; absence du pseudo-élément fixe sur mobile ; bas du document accessible ; largeur de page de 390 px sans débordement horizontal ; ajout du viewport cover ; fonctionnement du menu Liquid Glass ; conservation des paramètres avec le filtre Audio et le passage FR/EN ; retour au fond original en mode off ; maintien du fond fixe sur ordinateur. Syntaxe JavaScript et diff vérifiés.

**Le raccord avec la barre native Safari iOS 26.0 n'a pas été vérifié sur un iPhone.** Le mode cover est une piste de comparaison, pas une garantie de contourner le découpage des éléments fixes par Safari. Cet essai ne constitue pas une publication du site.

## Sources

- [WebKit : viewport-fit et zones de sécurité](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
- [Explication WebKit sur les éléments fixes et le remplissage sous les contrôles Safari](https://bugs.webkit.org/show_bug.cgi?id=297779#c23)
- [Safari 26.1 : correction d'un espace inférieur avec des conteneurs fixes](https://webkit.org/blog/17541/webkit-features-for-safari-26-1/)
