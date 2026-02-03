{
  projectRootFile = "flake.nix";

  programs.nixfmt.enable = true;
  programs.biome = {
    enable = true;
    includes = [
      "*.js"
      "*.ts"
      "*.jsx"
      "*.tsx"
      "*.json"
    ];
    excludes = [
      "**/routeTree.gen.ts"
      "**/_generated/**"
      "**/*.css"
      "**/node_modules/**"
      "packages/ui/**"
    ];
    settings = {
      formatter = {
        indentStyle = "space";
        indentWidth = 2;
      };
      javascript = {
        formatter = {
          quoteStyle = "double";
          semicolons = "always";
        };
      };
      css = {
        linter.enabled = false;
        formatter.enabled = false;
      };
      linter = {
        rules = {
          suspicious = {
            noExplicitAny = "warn";
            noArrayIndexKey = "warn";
            noImplicitAnyLet = "warn";
          };
          style = {
            noNonNullAssertion = "warn";
            useTemplate = "warn";
            useNodejsImportProtocol = "warn";
          };
          a11y = {
            noStaticElementInteractions = "off";
          };
          correctness = {
            noUnusedVariables = "warn";
            noUnusedImports = "warn";
          };
          security = {
            noDangerouslySetInnerHtml = "warn";
          };
        };
      };
    };
  };
}
