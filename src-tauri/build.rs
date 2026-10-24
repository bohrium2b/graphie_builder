// Prevents an extra warning window in some IDEs and avoids accidental
// blocking of the app on an empty window.
#![allow(dead_code)]

fn main() {
    tauri_build::build()
}