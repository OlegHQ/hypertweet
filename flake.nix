{
  description = "Hypertweet development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js ecosystem with Bun
            nodejs_22
            bun

            # Build tools
            esbuild
            nodePackages.prettier

            # Development utilities
            git
            which
            just
          ];

          shellHook = ''
            echo "Hypertweet development environment loaded"
            echo "Node: $(node --version)"
            echo "Bun: $(bun --version)"
            echo "esbuild: $(esbuild --version)"
            echo "prettier: $(prettier --version)"
            echo "just: $(just --version)"
          '';
        };
      });
}
