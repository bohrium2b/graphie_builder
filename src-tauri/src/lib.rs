// Graphie Builder library entry point (used by build.rs for the FFI boundary).
// The real application logic lives in the frontend; this module exposes the
// Tauri command surface.

use tauri::Builder;

pub fn run() {
    Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}