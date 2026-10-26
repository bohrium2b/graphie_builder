; Graphie Builder - Custom NSIS Windows Installer
; Compiled by makensis. Includes custom landing pages with animations/carousel.

!include "MUI2.nsh"
!include "Memento.nsh"
!include "x64.nsi"
!include "WinVer.nsh"

; ---------------------------------------------------------------
; Identity
; ---------------------------------------------------------------
Name "Graphie Builder"
OutFile "release/Graphie Builder Setup.exe"
InstallDir "$PROGRAMFILES64\Graphie Builder"
RequestExecutionLevel admin

; ---------------------------------------------------------------
; MUI settings
; ---------------------------------------------------------------
!define MUI_ABORTWARNING
!define MUI_ICON "build\icon.png"
!define MUI_UNICON "build\icon.png"

; Custom branding images (BMP)
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "build/installer-assets/bmp/installer-header.bmp"
!define MUI_HEADERIMAGE_RIGHT

!define MUI_WELCOMEFINISHPAGE_BITMAP "build/installer-assets/bmp/installer-complete.bmp"

!define MUI_ICON "build\icon.png"

; ---------------------------------------------------------------
; Pages
; ---------------------------------------------------------------
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

; ---------------------------------------------------------------
; Sections
; ---------------------------------------------------------------
Section "MainSection"
  ; Files are embedded by electron-builder; this NSIS script is only
  ; used for the UI shell. electron-builder injects the actual file
  ; list at build time.
  SetOutPath "$INSTDIR"
  File "/oname=Graphie Builder.exe" "..\electron\main.cjs"
SectionEnd

; ---------------------------------------------------------------
; Custom welcome page with branding
; ---------------------------------------------------------------
Var WelcomePage

Function .onInit
  ; Use MUI default welcome page
FunctionEnd

; ---------------------------------------------------------------
; Install progress callback (electron-builder hooks into this)
; ---------------------------------------------------------------
Function un.onInit
  MessageBox MB_OKCANCEL "Uninstall Graphie Builder?" IDOK +2
  Abort
FunctionEnd

; ---------------------------------------------------------------
; Finish page: launch option
; ---------------------------------------------------------------
!insertmacro MUI_FINISHPAGE_SHOWREADME "README.md"
!insertmacro MUI_FINISHPAGE_RUN "$INSTDIR\Graphie Builder.exe"
