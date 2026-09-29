# liquidGL

Copie locale de liquidGL v3.0.0, sous licence MIT (voir LICENSE), avec deux
correctifs de performance documentés ci-dessous.

- Source : https://github.com/naughtyduk/liquidGL
- Commit : `23edcaa2fe99f9b3e6efec3d68b2217dac15f679`
- Fichier : `scripts/liquidGL.js`

Correctifs locaux du 29 septembre 2026 (à conserver ou réévaluer lors d'une mise à jour) :

- Ignorer les notifications `ResizeObserver` sans changement de dimensions du
  contenu capturé : la capture du constructeur couvre déjà la notification initiale.
  Les redimensionnements réels et l'événement `window.resize` restent traités.
- Lors de la suppression d'une lentille `content: false`, ne pas recapturer un
  renderer dont la capture ignore déjà l'élément (`data-liquid-ignore`).
  L'invalidation et le rendu de composition sont conservés ; les autres suppressions
  continuent à déclencher une capture.

Mesures avant/après et copie de référence : `audits/2026-09-29-liquid-glass/followup/`.

L'intégration est dans `nav-glass.js`. Les réglages sont regroupés dans
`GLASS_SETTINGS`. Les voiles de contraste sont définis dans `styles.css`.
Ajouter `?glass=off` à l'URL pour comparer avec le verre CSS original.

L'essai sur les sous-menus se règle dans `DROPDOWN_GLASS_SETTINGS` :
`enabled: false` ou `?dropdown-glass=off` restaure leurs fonds CSS seuls.
Les lentilles existent uniquement quand un sous-menu est ouvert ; sur ordinateur,
elles partagent le renderer de la barre. Le voile de contraste des sous-menus
est défini dans `styles.css`, sous `.nav-dropdown[data-glass="ready"]`.

Le grand panneau mobile utilise `MOBILE_GLASS_SETTINGS` et partage le renderer
de ses sous-menus. `enabled: false` ou `?mobile-glass=off` restaure uniquement
son fond CSS. Son voile clair/sombre se règle dans `styles.css`, sous
`.nav-links[data-glass="ready"] > .mobile-menu-glass::before`.
Le canvas mobile est contenu dans `.mobile-glass-viewport` pour ne pas agrandir
la zone de défilement du menu.

Le contrôleur utilise `lens.renderer.captureSnapshot()` pour actualiser le fond
après changement de thème, d'image ou de filtre. Cette méthode a été vérifiée
dans le commit ci-dessus ; revérifier ce point lors d'une mise à jour du vendor.
