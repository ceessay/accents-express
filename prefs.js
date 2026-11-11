// SPDX-License-Identifier: GPL-2.0-or-later
import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const modifiers = Gdk.ModifierType.SHIFT_MASK | Gdk.ModifierType.CONTROL_MASK |
    Gdk.ModifierType.ALT_MASK | Gdk.ModifierType.SUPER_MASK;

export default class AccentsPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window.set_default_size(620, 480);
        const settings = this.getSettings();
        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({title: 'Ouverture de la palette'});
        page.add(group);
        window.add(page);

        const mode = new Adw.ComboRow({
            title: 'Déclenchement',
            model: Gtk.StringList.new(['Appui long sur la lettre', 'Raccourci personnalisé']),
            selected: settings.get_string('activation-mode') === 'hold' ? 0 : 1,
        });
        group.add(mode);
        const shortcut = new Adw.ActionRow({
            title: 'Raccourci',
            subtitle: 'Maintenez la lettre et appuyez sur ce raccourci. Répétez-le pour passer à l’accent suivant. Relâchez la lettre pour valider.',
        });
        group.add(shortcut);
        const button = new Gtk.Button({valign: Gtk.Align.CENTER});
        shortcut.add_suffix(button);
        shortcut.activatable_widget = button;
        const holdDelay = Adw.SpinRow.new_with_range(100, 3000, 50);
        holdDelay.title = 'Durée de l’appui long';
        holdDelay.subtitle = 'Temps de maintien avant l’ouverture, en millisecondes.';
        holdDelay.value = settings.get_int('hold-delay-ms');
        holdDelay.connect('notify::value', () =>
            settings.set_int('hold-delay-ms', Math.round(holdDelay.value)));
        group.add(holdDelay);
        const shortcutDelay = Adw.SpinRow.new_with_range(0, 3000, 50);
        shortcutDelay.title = 'Délai avant le raccourci';
        shortcutDelay.subtitle = 'Maintien minimal de la lettre, en millisecondes. Un appui plus rapide reste une frappe normale.';
        shortcutDelay.value = settings.get_int('shortcut-delay-ms');
        shortcutDelay.connect('notify::value', () =>
            settings.set_int('shortcut-delay-ms', Math.round(shortcutDelay.value)));
        group.add(shortcutDelay);
        const refresh = () => {
            holdDelay.sensitive = mode.selected === 0;
            shortcutDelay.sensitive = mode.selected === 1;
            shortcut.sensitive = mode.selected === 1;
            button.label = Gtk.accelerator_get_label(...settings.get_value('shortcut').deepUnpack());
        };
        refresh();
        mode.connect('notify::selected', () => {
            settings.set_string('activation-mode', mode.selected === 0 ? 'hold' : 'shortcut');
            refresh();
        });
        button.connect('clicked', () => {
            const dialog = new Adw.AlertDialog({
                heading: 'Choisir un raccourci',
                body: 'Appuyez sur une touche, seule ou avec des modificateurs. Échap annule.',
            });
            dialog.add_response('cancel', 'Annuler');
            dialog.close_response = 'cancel';
            const keys = new Gtk.EventControllerKey({propagation_phase: Gtk.PropagationPhase.CAPTURE});
            keys.connect('key-pressed', (controller, keyval, _code, state) => {
                if (keyval === Gdk.KEY_Escape) {
                    dialog.close();
                    return true;
                }
                if (controller.get_current_event().is_modifier())
                    return true;
                const mask = state & modifiers;
                if (!(mask & ~Gdk.ModifierType.SHIFT_MASK) &&
                    /[\p{L}\p{N}]/u.test(String.fromCodePoint(Gdk.keyval_to_unicode(keyval)))) {
                    dialog.body = 'Pour une lettre ou un chiffre, ajoutez Ctrl, Alt ou Super. Vous pouvez aussi choisir Espace ou une flèche seule.';
                    return true;
                }
                settings.set_value('shortcut', new GLib.Variant('(uu)', [Gdk.keyval_to_lower(keyval), mask]));
                refresh();
                dialog.close();
                return true;
            });
            dialog.add_controller(keys);
            dialog.present(window);
        });
    }
}
