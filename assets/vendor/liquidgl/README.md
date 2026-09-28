# liquidGL

Copie locale non modifiée de liquidGL v3.0.0, sous licence MIT (voir LICENSE).

- Source : https://github.com/naughtyduk/liquidGL
- Commit : `23edcaa2fe99f9b3e6efec3d68b2217dac15f679`
- Fichier : `scripts/liquidGL.js`

L'intégration est dans `nav-glass.js`. Les réglages sont regroupés dans
`GLASS_SETTINGS`. Les voiles de contraste sont définis dans `styles.css`.
Ajouter `?glass=off` à l'URL pour comparer avec le verre CSS original.

Le contrôleur utilise `lens.renderer.captureSnapshot()` pour actualiser le fond
après changement de thème, d'image ou de filtre. Cette méthode a été vérifiée
dans le commit ci-dessus ; revérifier ce point lors d'une mise à jour du vendor.
