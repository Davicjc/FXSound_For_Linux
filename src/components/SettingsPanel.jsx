import React from "react";

const RENDER_MODES = [
    { value: "auto", label: "Automatic" },
    { value: "gpu", label: "Graphics card (GPU)" },
    { value: "software", label: "Processor (software)" },
];

const REASONS = {
    "user-choice": "chosen here",
    "environment-override": "set by LIBGL_ALWAYS_SOFTWARE",
    detected: "graphics card detected",
    "virtual-machine": "virtual machine detected",
    "no-render-node": "no graphics card available",
    "nvidia-driver": "NVIDIA driver, kept on the safe path",
    wayland: "Wayland session, kept on the safe path",
    "previous-launch-failed": "the graphics card failed on the last launch",
};

function Toggle({ id, label, hint, checked, disabled, onChange }) {
    return (
        <div className={`settings-row ${disabled ? "settings-row--disabled" : ""}`}>
            <div className="settings-row__text">
                <label htmlFor={id} className="settings-row__label">{label}</label>
                {hint && <span className="settings-row__hint">{hint}</span>}
            </div>
            <button
                id={id}
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                className={`switch ${checked ? "switch--on" : ""}`}
                onClick={() => onChange(!checked)}
            >
                <span className="switch__knob" />
            </button>
        </div>
    );
}

/**
 * Window, startup and rendering options, plus configuration export/import.
 *
 * Props:
 *   info     — `get_ui_info` result: { ui, graphics, tray_available, autostart }
 *   onUi     — save a changed `ui` object
 *   onAutostart(enabled)
 *   onExport / onImport — open the file dialogs
 *   notice   — { kind: "ok" | "error", text } after an export/import, or null
 */
export default function SettingsPanel({ info, onUi, onAutostart, onExport, onImport, notice }) {
    if (!info) {
        return <div className="settings-panel settings-panel--loading">Loading…</div>;
    }
    const { ui, graphics, tray_available: tray, autostart } = info;
    const set = (key) => (value) => onUi({ ...ui, [key]: value });
    const renderer = graphics.renderer === "gpu" ? "graphics card" : "processor";
    const restartNeeded =
        (ui.render_mode === "gpu" && graphics.renderer !== "gpu") ||
        (ui.render_mode === "software" && graphics.renderer !== "software") ||
        (ui.render_mode === "auto" && graphics.reason === "user-choice");

    return (
        <div className="settings-panel">
            <Toggle
                id="set-visualizer"
                label="Spectrum visualizer"
                hint="Off saves CPU. Audio is not affected."
                checked={ui.visualizer}
                onChange={set("visualizer")}
            />
            <Toggle
                id="set-tray"
                label="Keep running in the tray when closed"
                hint={tray ? "Quit from the tray icon menu." : "No system tray found on this desktop."}
                checked={tray && ui.close_to_tray}
                disabled={!tray}
                onChange={set("close_to_tray")}
            />
            <Toggle
                id="set-autostart"
                label="Start with the system"
                checked={autostart}
                onChange={onAutostart}
            />
            <Toggle
                id="set-hidden"
                label="Start hidden in the tray"
                checked={tray && ui.start_hidden}
                disabled={!tray || !autostart}
                onChange={set("start_hidden")}
            />

            <div className="settings-row">
                <div className="settings-row__text">
                    <label htmlFor="set-render" className="settings-row__label">Window rendering</label>
                    <span className="settings-row__hint">
                        Now: {renderer} ({REASONS[graphics.reason] ?? graphics.reason})
                        {restartNeeded && " · restart FXSound to apply"}
                    </span>
                </div>
                <div className="dropdown__wrapper settings-row__select">
                    <select
                        id="set-render"
                        className="dropdown__select"
                        value={ui.render_mode}
                        onChange={(e) => set("render_mode")(e.target.value)}
                    >
                        {RENDER_MODES.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                    <svg aria-hidden="true" className="dropdown__arrow" width="10" height="6" viewBox="0 0 10 6">
                        <path d="M0 0l5 6 5-6z" fill="#e63462" />
                    </svg>
                </div>
            </div>

            <div className="settings-actions" title="EQ, effects, preset and these options. The output device stays per machine.">
                <button type="button" className="settings-btn" onClick={onExport}>Export configuration</button>
                <button type="button" className="settings-btn" onClick={onImport}>Import configuration</button>
            </div>
            <p className={`settings-notice ${notice ? `settings-notice--${notice.kind}` : ""}`} role="status">
                {notice?.text ?? ""}
            </p>
        </div>
    );
}
