; Graphie Builder NSIS include - custom branding and pages
; Included by electron-builder's NSIS compiler via `nsis.include`.

!include "MUI2.nsh"

; ---------------------------------------------------------------
; Branding images (relative to project root where makensis runs)
; ---------------------------------------------------------------
!define MUI_HEADERIMAGE_BITMAP "build/installer-assets/bmp/installer-header.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP "build/installer-assets/bmp/installer-complete.bmp"

; ---------------------------------------------------------------
; Finish page link
; ---------------------------------------------------------------
!define MUI_FINISHPAGE_LINK "https://graphie.dev/docs"
!define MUI_FINISHPAGE_LINK_LOCATION "https://graphie.dev/docs"
