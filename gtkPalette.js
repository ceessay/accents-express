// Read computed GTK colors in a separate process. GNOME Shell renders with St.
import Adw from 'gi://Adw?version=1';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk?version=4.0';

Gtk.init();
const settings = new Gio.Settings({schema_id: 'org.gnome.desktop.interface'});
const theme = Gtk.Settings.get_default().gtk_theme_name;
const adwaita = /^(Adwaita|HighContrast)(-|$)/i.test(theme);
if (adwaita) {
    Adw.init();
    // Read the preference directly, including when the portal is starting.
    const dark = settings.get_string('color-scheme') === 'prefer-dark' ||
        /-dark$/i.test(theme);
    Adw.StyleManager.get_default().color_scheme = dark
        ? Adw.ColorScheme.FORCE_DARK : Adw.ColorScheme.FORCE_LIGHT;
} else if (settings.get_string('color-scheme') === 'prefer-dark') {
    Gtk.Settings.get_default().gtk_application_prefer_dark_theme = true;
}

const window = new Gtk.Window();
const box = new Gtk.Box();
window.set_child(box);
const tokens = {
    background: ['popover-bg-color', 'theme_bg_color'],
    foreground: ['popover-fg-color', 'theme_fg_color'],
    selection: ['accent-bg-color', 'theme_selected_bg_color'],
    selectedText: ['accent-fg-color', 'theme_selected_fg_color'],
};
const palette = {};
for (const [name, [variable, legacy]] of Object.entries(tokens)) {
    const label = new Gtk.Label();
    box.append(label);
    const provider = new Gtk.CssProvider();
    provider.load_from_string(`label { color: var(--${variable}, @${legacy}); }`);
    label.get_style_context().add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_USER + 1);
    const color = label.get_color();
    const rgb = [color.red, color.green, color.blue].map(channel =>
        Math.round(Math.max(0, Math.min(1, channel)) * 255));
    palette[name] = `rgba(${rgb.join(', ')}, ${color.alpha})`;
}
print(JSON.stringify(palette));
window.destroy();
