{ nixpkgs, system }:
let
  pkgs = import nixpkgs { inherit system; };
in
{
  devShells.${system}.default = pkgs.mkShell {
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

      # Language runtimes
      bun
      nodejs_24
      starship
    ];

    shellHook = ''
      echo "Bun version: $(bun --version)"
      echo "Node version: $(node --version)"
      echo "ClawWatch development shell activated"
    '';

    preferLocalBuild = true;
    shell = "${pkgs.zsh}/bin/zsh";
  };
}
