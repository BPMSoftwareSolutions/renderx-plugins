import React from "react";
import { SchemaResolverService } from "../services/schema-resolver.service";
import type { ControlPanelConfig } from "../types/control-panel.types";

// Load configuration
const configPromise = fetch(
  "/plugins/control-panel/config/control-panel.schema.json"
).then((r) => r.json()) as Promise<ControlPanelConfig>;

export function useSchemaResolver() {
  const [resolver, setResolver] = React.useState<SchemaResolverService | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    const initResolver = async () => {
      try {
        const config = await configPromise;
        const schemaResolver = new SchemaResolverService(config);

        // Load common component schemas (extended with heading/paragraph/image/svg)
        await schemaResolver.loadComponentSchemas([
          "button",
          "input",
          "container",
          "line",
          "heading",
          "paragraph",
          "image",
          "svg",
          "html",
        ]);

        if (mounted) {
          setResolver(schemaResolver);
          setIsLoading(false);
        }
      } catch {
        // Silently handle schema resolver initialization failures
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initResolver();
    return () => {
      mounted = false;
    };
  }, []);

  return { resolver, isLoading };
}
