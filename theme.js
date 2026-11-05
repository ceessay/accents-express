// SPDX-License-Identifier: GPL-2.0-or-later
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

// Sample GTK on settings changes, never on the input path.
export class GtkTheme {
    constructor(directory, onChange) {
        this._script = directory.get_child('gtkPalette.js').get_path();
        this._onChange = onChange;
        this._settings = new Gio.Settings({schema_id: 'org.gnome.desktop.interface'});
        this._a11y = new Gio.Settings({schema_id: 'org.gnome.desktop.a11y.interface'});
        for (const key of ['color-scheme', 'accent-color', 'gtk-theme'])
            this._settings.connectObject(`changed::${key}`, () => this._schedule(), this);
        this._a11y.connectObject('changed::high-contrast', () => this._schedule(), this);
        const gtkDir = Gio.File.new_for_path(GLib.build_filenamev([GLib.get_user_config_dir(), 'gtk-4.0']));
        this._monitor = gtkDir.monitor_directory(Gio.FileMonitorFlags.NONE, null);
        this._monitorId = this._monitor.connect('changed', () => this._schedule());
        this._schedule();
    }

    _schedule() {
        if (this._timer)
            GLib.source_remove(this._timer);
        this._timer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 180, () => {
            this._timer = 0;
            this._refresh();
            return GLib.SOURCE_REMOVE;
        });
    }

    _refresh() {
        this._process?.force_exit();
        try {
            const process = Gio.Subprocess.new(['gjs', '-m', this._script],
                Gio.SubprocessFlags.STDOUT_PIPE);
            this._process = process;
            process.communicate_utf8_async(null, null, (source, result) => {
                try {
                    const [, stdout] = source.communicate_utf8_finish(result);
                    if (this._process !== source || !source.get_successful())
                        return;
                    this._onChange(JSON.parse(stdout));
                } catch (error) {
                    if (this._process === source)
                        console.warn(`Accents express: ${error.message}`);
                } finally {
                    if (this._process === source)
                        this._process = null;
                }
            });
        } catch (error) {
            console.warn(`Accents express: ${error.message}`);
        }
    }

    destroy() {
        if (this._timer)
            GLib.source_remove(this._timer);
        this._monitor.disconnect(this._monitorId);
        this._monitor.cancel();
        this._settings.disconnectObject(this);
        this._a11y.disconnectObject(this);
        this._process?.force_exit();
        this._process = null;
    }
}
