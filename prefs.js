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
        window.set_default_size(580, 350);
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
        const refresh = () => {
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
