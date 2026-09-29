# liquidGL

Copie locale non modifiée de liquidGL v3.0.0, sous licence MIT (voir LICENSE).

- Source : https://github.com/naughtyduk/liquidGL
- Commit : `23edcaa2fe99f9b3e6efec3d68b2217dac15f679`
- Fichier : `scripts/liquidGL.js`

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
