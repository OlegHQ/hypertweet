{
  description = "A development environment with Bun, Node.js 22, TypeScript LSP, and Fish shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            bun
            nodejs_22
            nodePackages.typescript
            nodePackages.typescript-language-server
          ];

          shellHook = ''
            # Automatically start fish shell
            exec fish
          '';
        };
      }
    );
} 

