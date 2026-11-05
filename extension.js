// SPDX-License-Identifier: GPL-2.0-or-later
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import St from 'gi://St';
import {Extension, InjectionManager} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {GtkTheme} from './theme.js';

const letters = {
    a: 'àâäáãåæ', c: 'çćč', e: 'éèêë', i: 'îïíì',
    n: 'ñń', o: 'ôöœóòõø', u: 'ùûüú', y: 'ÿý',
};
const holdMs = 450;
const {KEY_PRESS, KEY_RELEASE} = Clutter.EventType;
const {NORMAL, ALPHA, NAME, URL, EMAIL} = Clutter.InputContentPurpose;
const {HIDDEN_TEXT, SENSITIVE_DATA} = Clutter.InputContentHintFlags;
const {SHIFT_MASK, LOCK_MASK, MOD2_MASK} = Clutter.ModifierType;

export default class AccentsExpress extends Extension {
    enable() {
        this._theme = new GtkTheme(this.dir, colors => {
            this._colors = colors;
            if (this._bar)
                this._highlight();
        });
        this._hooks = new InjectionManager();
        this._swallow = new Set();
        this._im = Main.inputMethod;
        const proto = Object.getPrototypeOf(this._im);
        const extension = this;
        this._hooks.overrideMethod(proto, 'vfunc_filter_key_event', original => {
            this._originalFilter = original;
            return function (event) {
                if (this === extension._im && extension._filter(event))
                    return true;
                return original.call(this, event);
            };
        });
        // GNOME may reuse the same Wayland focus object for another text field.
        for (const method of ['vfunc_focus_out', 'vfunc_reset']) {
            this._hooks.overrideMethod(proto, method, original => function (...args) {
                extension._cancel();
                return original.apply(this, args);
            });
        }
        global.display.connectObject('notify::focus-window', () => this._cancel(), this);
    }

    disable() {
        if (this._pending && !this._bar && this._eligible())
            this._replay();
        this._cancel();
        global.display.disconnectObject(this);
        this._hooks.clear();
        this._theme.destroy();
        this._theme = null;
        this._hooks = null;
        this._colors = null;
        this._originalFilter = null;
        this._im = null;
    }

    _eligible() {
        const im = this._im;
        return im.currentFocus && global.display.focus_window &&
            !global.stage.key_focus && !Main.overview.visible &&
            im._currentSource?.type === 'xkb' && im._context &&
            [NORMAL, ALPHA, NAME, URL, EMAIL].includes(im.content_purpose) &&
            !(im.content_hints & (HIDDEN_TEXT | SENSITIVE_DATA)) && !im.hasPreedit();
    }

    _filter(event) {
        const type = event.type();
        if (type !== KEY_RELEASE && type !== KEY_PRESS)
            return false;
        const code = event.get_key_code();
        const sym = event.get_key_symbol();
        const release = type === KEY_RELEASE;
        if (this._swallow.has(code)) {
            if (release)
                this._swallow.delete(code);
            return this._eat(event);
        }

        if (!this._eligible()) {
            this._cancel();
            return false;
        }
        if (this._pending) {
            if (code === this._pending.code) {
                if (release) {
                    if (this._bar) {
                        this._commit(this._pending.options[this._index]);
                        return this._eat(event);
                    }
                    this._replay();
                    return false; // The app also receives the ordinary key release.
                }
                return this._eat(event);
            }
            if (release)
                return false;
            if (this._bar && !(event.get_state() & ~(SHIFT_MASK | LOCK_MASK | MOD2_MASK)) &&
                this._select(sym, code))
                return this._eat(event);
            this._replay();
        }
        if (release || event.get_state() & ~(SHIFT_MASK | LOCK_MASK | MOD2_MASK))
            return false;
        const char = String.fromCodePoint(Clutter.keysym_to_unicode(sym));
        const variants = letters[char.toLowerCase()];
        if (!variants)
            return false;
        this._pending = {
            code, event: event.copy(), focus: this._im.currentFocus,
            options: Array.from(char === char.toUpperCase() ? variants.toUpperCase() : variants),
        };
        this._timer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, holdMs, () => {
            this._timer = 0;
            if (this._eligible() && this._im.currentFocus === this._pending.focus)
                this._open();
            else
                this._cancel();
            return GLib.SOURCE_REMOVE;
        });
        return this._eat(event);
    }

    _eat(event) {
        this._im.notify_key_event(event, true);
        return true;
    }

    _replay() {
        const pending = this._pending;
        this._clear();
        // Send ordinary taps through the original IBus path, including Compose keys.
        if (this._im.currentFocus === pending.focus &&
            !this._originalFilter.call(this._im, pending.event))
            this._im.notify_key_event(pending.event, false);
    }

    _select(sym, code) {
        const count = this._pending.options.length;
        if ([Clutter.KEY_Left, Clutter.KEY_Right, Clutter.KEY_space].includes(sym)) {
            const step = sym === Clutter.KEY_Left ? -1 : 1;
            this._index = (this._index + count + step) % count;
            this._highlight();
        } else if (sym === Clutter.KEY_Escape) {
            this._swallow.add(this._pending.code);
            this._clear();
        } else {
            // The physical number row also works on AZERTY (where 1 is Shift+&).
            const index = code >= 10 && code <= 18 ? code - 10 : sym - Clutter.KEY_1;
            if (index < 0 || index >= count)
                return false;
            this._swallow.add(this._pending.code);
            this._commit(this._pending.options[index]);
        }
        this._swallow.add(code);
        return true;
    }

    _commit(text) {
        const focus = this._pending.focus;
        this._clear();
        if (this._im.currentFocus === focus && this._eligible())
            this._im.commit(text);
    }

    _open() {
        this._index = 0;
        this._bar = new St.BoxLayout({style_class: 'switcher-list accent-express-bar'});
        for (const [index, text] of this._pending.options.entries()) {
            const cell = new St.BoxLayout({
                orientation: Clutter.Orientation.VERTICAL,
                style_class: 'item-box accent-express-cell',
            });
            cell.add_child(new St.Label({text, x_align: Clutter.ActorAlign.CENTER}));
            cell.add_child(new St.Label({
                text: String(index + 1), style_class: 'accent-express-number',
                x_align: Clutter.ActorAlign.CENTER,
            }));
            this._bar.add_child(cell);
        }
        Main.layoutManager.addTopChrome(this._bar);
        this._highlight();
        const monitor = Main.layoutManager.monitors[global.display.focus_window.get_monitor()]
            ?? Main.layoutManager.primaryMonitor;
        const [, width] = this._bar.get_preferred_width(-1);
        this._bar.set_position(Math.round(monitor.x + (monitor.width - width) / 2),
            monitor.y + Main.panel.height + 16);
    }

    _highlight() {
        const colors = this._colors;
        if (colors)
            this._bar.style = `background-color: ${colors.background}; color: ${colors.foreground};`;
        this._bar.get_children().forEach((cell, index) => {
            if (colors) {
                const selected = index === this._index;
                cell.style = selected
                    ? `background-color: ${colors.selection}; color: ${colors.selectedText};`
                    : `background-color: transparent; color: ${colors.foreground};`;
            }
            if (index === this._index)
                cell.add_style_pseudo_class('selected');
            else
                cell.remove_style_pseudo_class('selected');
        });
    }

    _clear() {
        if (this._timer)
            GLib.source_remove(this._timer);
        this._timer = 0;
        this._bar?.destroy();
        this._bar = null;
        this._pending = null;
    }

    _cancel() {
        this._clear();
        this._swallow.clear();
    }
}
