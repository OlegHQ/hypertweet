{
  description = "Hypertweet development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs = { self, nixpkgs, flake-utils, rust-overlay }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [ (import rust-overlay) ];
        pkgs = import nixpkgs {
          inherit system overlays;
        };
        
        rustToolchain = pkgs.rust-bin.stable.latest.default.override {
          extensions = [ "rust-src" "rustfmt" "clippy" ];
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js ecosystem
            nodejs_22
            nodePackages.npm
            nodePackages.yarn
            nodePackages.pnpm
            
            # Build tools
            esbuild
            nodePackages.prettier
            
            # Rust toolchain
            rustToolchain
            cargo-watch
            
            # Development utilities
            git
            which
          ];

          shellHook = ''
            echo "🚀 Hypertweet development environment loaded"
            echo "Node: $(node --version)"
            echo "npm: $(npm --version)"
            echo "esbuild: $(esbuild --version)"
            echo "prettier: $(prettier --version)"
            echo "rustc: $(rustc --version)"
            echo "cargo: $(cargo --version)"
          '';
        };
      });
}