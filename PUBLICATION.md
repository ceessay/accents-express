# Première soumission sur GNOME Extensions

L’identifiant public est `accents-express@ceessay.github.io`. Conservez-le pour les mises à jour.

Le code et les signalements de problèmes sont disponibles sur le [dépôt public](https://github.com/ceessay/accents-express).

## Envoyer l’archive

Construisez le ZIP avec la commande du README. Sur [GNOME Extensions](https://extensions.gnome.org/upload/), connectez-vous puis envoyez `dist/accents-express@ceessay.github.io.shell-extension.zip`. La capture de la palette peut servir d’illustration pour la fiche.

### Note technique pour la revue

> Accents express adds press-and-hold accented letters to compatible Wayland text fields on GNOME Shell 50. While enabled, it temporarily wraps the Shell input method’s key filter and focus/reset handlers. A short tap goes through the original filter. In the default mode a long press opens the picker. In shortcut mode the user holds the base letter and presses a configurable key or combination to open the picker. Each additional press advances one candidate. Releasing the letter commits the current choice. The GTK preferences window stores the mode and shortcut in per-user GSettings. Password and sensitive fields are excluded. Disabling the extension restores the original methods. Keystrokes are processed in memory and are neither logged nor sent over the network.
>
> The bundled GJS helper reads the active GTK 4 palette in a separate process, so GTK is never imported into GNOME Shell. It takes no keyboard input and exits after printing four colors. It runs at startup and when appearance settings or GTK configuration files change.

Le code a été développé avec l’aide de l’IA. Avant l’envoi, relisez le filtre de saisie et le lecteur de thème afin de pouvoir expliquer leurs choix et répondre aux questions de l’équipe de revue. Consultez les [critères de revue GNOME](https://gjs.guide/extensions/review-guidelines/review-guidelines.html).
