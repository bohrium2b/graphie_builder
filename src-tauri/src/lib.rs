// Graphie Builder library entry point (used by build.rs for the FFI boundary).
// Registers the Tauri plugins used by the frontend native adapter
// (src/native/tauri.ts): dialog (save/open), fs (readTextFile/writeTextFile),
// clipboard-manager (writeText/readText). @tauri-apps/api's app.exit() is core
// and needs no plugin.
use tauri::Builder;

pub fn run() {
    Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
