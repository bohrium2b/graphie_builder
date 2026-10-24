{
  pkgs,
  lib,
  config,
  inputs,
  ...
}:

{

  # https://devenv.sh/basics/
  env.GREET = "devenv";

  # https://devenv.sh/packages/
  # packages = [ pkgs.git ];

  # https://devenv.sh/languages/
  # languages.rust.enable = true;
  # Enable JavaScript/Node.js language support
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs; # Or specify pkgs.nodejs_20
    corepack.enable = true;
  };

  # Enable Rust language support (required for Tauri)
  languages.rust = {
    enable = true;
    channel = "stable";
    components = [ "cargo" "rustc" "clippy" "rustfmt" ];
  };

  # Add extra packages required for Tauri CLI and Linux webkit/build dependencies
  packages = with pkgs; [
    cargo-tauri
    gobject-introspection
  ];

  # Optional environment variables if needed
  env = {
    RUST_BACKTRACE = "1";
  };


  apple.sdk = if pkgs.stdenv.hostPlatform.isDarwin then pkgs.apple-sdk_15 else null;

  # https://devenv.sh/processes/
  # processes.dev.exec = "${lib.getExe pkgs.watchexec} -n -- ls -la";

  # https://devenv.sh/services/
  # services.postgres.enable = true;

  # https://devenv.sh/scripts/
  scripts.hello.exec = ''
    echo hello from $GREET
  '';

  # https://devenv.sh/basics/
  enterShell = ''
    hello         # Run scripts directly
    git --version # Use packages
  '';

  # https://devenv.sh/tasks/
  # tasks = {
  #   "myproj:setup".exec = "mytool build";
  #   "devenv:enterShell".after = [ "myproj:setup" ];
  # };

  # https://devenv.sh/tests/
  enterTest = ''
    echo "Running tests"
    git --version | grep --color=auto "${pkgs.git.version}"
  '';

  # https://devenv.sh/git-hooks/
  # git-hooks.hooks.shellcheck.enable = true;

  # See full reference at https://devenv.sh/reference/options/
}
