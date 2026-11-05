# Première soumission sur GNOME Extensions

L’identifiant public est `accents-express@ceessay.github.io`. Conservez-le pour les mises à jour.

## Publier le dépôt source

Le champ `url` de `metadata.json` vise `https://github.com/ceessay/accents-express`. Depuis la racine du dépôt local, si le dépôt distant reste à créer, connectez-vous avec le compte GitHub `ceessay` puis exécutez :

```sh
gh auth login
gh repo create ceessay/accents-express --public --source=. --remote=origin --push
```

Vérifiez que l’URL du dépôt est accessible dans une fenêtre de navigation privée avant la soumission.

## Envoyer l’archive

Construisez le ZIP avec la commande du README. Sur [GNOME Extensions](https://extensions.gnome.org/upload/), connectez-vous puis envoyez `dist/accents-express@ceessay.github.io.shell-extension.zip`. La capture de la palette peut servir d’illustration pour la fiche.

### Note technique pour la revue

> Accents express adds press-and-hold accented letters to compatible Wayland text fields on GNOME Shell 50. While enabled, it temporarily wraps the Shell input method’s key filter and focus/reset handlers. A short tap goes through the original filter. A long press opens the picker and commits the selected character to the active field. Password and sensitive fields are excluded. Disabling the extension restores the original methods. Keystrokes are processed in memory and are neither logged nor sent over the network.
>
> The bundled GJS helper reads the active GTK 4 palette in a separate process, so GTK is never imported into GNOME Shell. It takes no keyboard input and exits after printing four colors. It runs at startup and when appearance settings or GTK configuration files change.

Le code a été développé avec l’aide de l’IA. Avant l’envoi, relisez le filtre de saisie et le lecteur de thème afin de pouvoir expliquer leurs choix et répondre aux questions de l’équipe de revue. Consultez les [critères de revue GNOME](https://gjs.guide/extensions/review-guidelines/review-guidelines.html).
