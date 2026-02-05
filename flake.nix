{
  description = "ClawWatch - agent monitoring, cost control, and alerting";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-compat.url = "github:edolstra/flake-compat";
    flake-compat.flake = false;
  };

  outputs =
    {
      self,
      nixpkgs,
      ...
    }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forEachSystem = nixpkgs.lib.genAttrs systems;
    in
    {
      # ------------------------------------------------------------
      # Development shell (nix develop .)
      # ------------------------------------------------------------
      devShells = forEachSystem (
        system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        {
          default = pkgs.mkShell {
            buildInputs = with pkgs; [
              # Core packages
              curl
              wget

              # Development tools
              just

              # Nix development tools
              nixfmt-rfc-style
              nixfmt-tree
              statix
              deadnix
              nil
              oxlint
              oxfmt

              # Language runtimes
              bun
              nodejs_24
            ];

            shellHook = ''
              echo "Bun version: $(bun --version)"
              echo "Node version: $(node --version)"
              echo "ClawWatch development shell activated"
            '';
          };
        }
      );

      # ------------------------------------------------------------
      # Formatter (nix fmt)
      # ------------------------------------------------------------
      formatter = forEachSystem (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        pkgs.writeShellApplication {
          name = "clawwatch-fmt";
          runtimeInputs = [ pkgs.oxfmt pkgs.oxlint ];
          text = ''
            echo "Running oxfmt"
            oxfmt .
          '';
        }
      );

      # ------------------------------------------------------------
      # Checks (nix flake check)
      # ------------------------------------------------------------
      checks = forEachSystem (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          lint = pkgs.runCommand "oxlint-check" { src = self; buildInputs = [ pkgs.oxlint ]; } ''
            cd $src
            oxlint .
            mkdir -p $out
          '';

          nixfmt = pkgs.runCommand "nixfmt-check" { src = self; buildInputs = [ pkgs.nixfmt-rfc-style pkgs.findutils ]; } ''
            cd $src
            files=$(find . -name "*.nix" -type f)
            if [ -n "$files" ]; then
              nixfmt --check $files
            fi
            mkdir -p $out
          '';

          tests = pkgs.runCommand "tests" { src = self; } ''
            echo "No test suite configured yet"
            mkdir -p $out
          '';

          build = pkgs.runCommand "build" { src = self; } ''
            echo "No build derivation configured yet"
            mkdir -p $out
          '';
        }
      );
    };
}
