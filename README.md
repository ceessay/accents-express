# Accents express

Accents express ajoute la saisie par appui long aux champs de texte compatibles avec la méthode de saisie Wayland de GNOME Shell 50. Maintenez `e` pendant 450 ms pour afficher **é è ê ë**. Relâchez pour écrire **é**, ou appuyez une fois sur `→` avant de relâcher pour écrire **è**.

Les flèches et `Espace` parcourent les variantes. Les chiffres choisissent directement une variante, y compris sur la rangée supérieure d’un clavier AZERTY. `Échap` annule le choix. La palette accepte les majuscules et reprend les couleurs du thème GTK 4 actif.

## Construire et installer

Depuis la racine du dépôt, sur un système disposant de GNOME Shell 50, GJS, GTK 4, libadwaita et de la commande `gnome-extensions` :

```sh
mkdir -p dist
gnome-extensions pack . --extra-source=gtkPalette.js --extra-source=theme.js --extra-source=LICENSE --out-dir=dist --force
gnome-extensions install --force dist/accents-express@ceessay.github.io.shell-extension.zip
```

Si vous avez installé l’ancienne édition de test, désactivez-la avant d’activer la nouvelle, car les deux éditions interviennent sur la même méthode de saisie :

```sh
gnome-extensions disable accents-express@local
```

Fermez la session GNOME, reconnectez-vous, puis activez l’extension :

```sh
gnome-extensions enable accents-express@ceessay.github.io
```

## Fonctionnement

L’extension intercepte temporairement les événements de la méthode de saisie du Shell pour les lettres prises en charge. Lors d’une frappe courte, elle renvoie l’événement au filtre d’origine. Lors d’un appui long, elle présente les variantes puis insère le caractère choisi dans le champ actif. Un changement de champ annule la sélection. Les champs protégés, notamment les mots de passe, sont exclus. La désactivation restaure les méthodes d’origine.

GNOME Shell dessine la palette avec St. Pour obtenir les couleurs calculées par GTK sans charger GTK dans le processus du Shell, l’extension lance le script GJS autonome `gtkPalette.js` au démarrage et lors des changements d’apparence. Il lit les couleurs du thème de la machine et renvoie les quatre couleurs nécessaires. Le script ne reçoit aucune frappe. Les frappes sont traitées en mémoire, sans journal de saisie ni transmission réseau.

## Vérification rapide

1. Dans un champ GTK sous Wayland, tapez rapidement `e`, puis maintenez `e` et relâchez. Le résultat attendu est `eé`.
2. Maintenez `E`, appuyez sur `→` puis relâchez pour écrire `È`.
3. Changez le style clair ou sombre du bureau et vérifiez les couleurs à l’ouverture de la palette.
4. Désactivez puis réactivez l’extension et répétez le premier essai.

## Licence

Accents express est distribué sous **GPL-2.0-or-later**, la licence publique générale GNU version 2 ou toute version ultérieure. Le texte de la version 2 figure dans `LICENSE`.
