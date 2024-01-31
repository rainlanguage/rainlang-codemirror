{
  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    rainix.url = "github:rainprotocol/rainix";
  };

  outputs = { self, flake-utils, rainix }:

  flake-utils.lib.eachDefaultSystem (system:
    let
      pkgs = rainix.pkgs.${system};
    in rec {

      # For `nix develop`:
      devShells = {
        js = pkgs.mkShell {
          nativeBuildInputs = [
            rainix.node-build-inputs.${system}
          ] ++ (with pkgs; [ 
            wasm-bindgen-cli
            (writeShellScriptBin "flush" ''
              rm -rf dist
              rm -rf docs
              rm -rf temp
            '')
            (writeShellScriptBin "hard-flush" ''
              rm -rf dist
              rm -rf docs
              rm -rf temp
              rm -rf target
              rm -rf node_modules
            '')
            (writeShellScriptBin "hard-build" ''
              hard-flush
              npm install
              npm run build
            '')
          ]);
          shellHook = '' npm install '';
        };
      } // rainix.devShells.${system};
    }
  );
}