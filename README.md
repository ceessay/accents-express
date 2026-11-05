# Accents express

Extension pour GNOME Shell 50 sous Wayland. Dans un champ de texte compatible, maintenez une lettre pendant 450 ms pour afficher ses variantes. Avec `e`, relâchez pour saisir **é**, ou appuyez sur `→` avant de relâcher pour saisir **è**. Les chiffres sélectionnent directement une variante et `Échap` annule la saisie.

La palette reprend les couleurs du thème GTK 4 de la session. Les champs de mot de passe sont exclus.

## Construire et installer

Depuis la racine du dépôt, avec GJS, GTK 4, libadwaita et la commande `gnome-extensions` installés :

```sh
mkdir -p dist
gnome-extensions pack . --extra-source=gtkPalette.js --extra-source=theme.js --out-dir=dist --force
gnome-extensions install --force dist/accents-express@local.shell-extension.zip
```

Fermez la session GNOME, reconnectez-vous, puis activez l’extension :

```sh
gnome-extensions enable accents-express@local
```
