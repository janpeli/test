import { closeModals } from "@/API/GUI-api/modal-api";
import {
  addPlugin,
  getListOfPlugins,
  removePlugin,
} from "@/API/project-api/project-api";
import { selectProjectPlugins } from "@/API/project-api/project-api.selectors";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAppSelector, useDebounceValue } from "@/hooks/hooks";
import { PluginListType } from "electron/src/project/plugin-definitions";
import { Search, AlertCircle } from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";

// Constants
const SEARCH_DEBOUNCE_DELAY = 300;
const MAX_CONTAINER_HEIGHT = "400px"; // More reasonable height

interface PluginActionState {
  [pluginUUID: string]: "adding" | "removing" | null;
}

function ModalAddNewPlugin() {
  const [pluginList, setPluginList] = useState<PluginListType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pluginActions, setPluginActions] = useState<PluginActionState>({});

  const projectPlugins = useAppSelector(selectProjectPlugins);
  const debouncedSearchQuery = useDebounceValue(
    searchQuery,
    SEARCH_DEBOUNCE_DELAY
  );

  // Get currently installed plugin UUIDs
  const installedPluginUUIDs = useMemo(
    () => new Set(projectPlugins.map((p) => p.uuid)),
    [projectPlugins]
  );

  // Memoize filtered plugins
  const filteredPlugins = useMemo(() => {
    if (!pluginList?.length) return [];

    if (!debouncedSearchQuery.trim()) return pluginList;

    const lowerQuery = debouncedSearchQuery.toLowerCase();
    return pluginList.filter(
      (plugin) =>
        plugin.name.toLowerCase().includes(lowerQuery) ||
        plugin.description.toLowerCase().includes(lowerQuery)
    );
  }, [pluginList, debouncedSearchQuery]);

  // Handle plugin add/remove with proper error handling
  const handlePluginAction = useCallback(
    async (pluginUUID: string) => {
      const isInstalled = installedPluginUUIDs.has(pluginUUID);
      const action = isInstalled ? "removing" : "adding";

      setPluginActions((prev) => ({ ...prev, [pluginUUID]: action }));
      setError(null);

      try {
        if (isInstalled) {
          await removePlugin(pluginUUID);
        } else {
          await addPlugin(pluginUUID);
        }
      } catch (err) {
        setError(`Failed to ${action} plugin. Please try again.`);
        console.error(`Error ${action} plugin:`, err);
      } finally {
        setPluginActions((prev) => ({ ...prev, [pluginUUID]: null }));
      }
    },
    [installedPluginUUIDs]
  );

  // Load plugins on mount
  useEffect(() => {
    const loadPlugins = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const plugins = await getListOfPlugins();
        setPluginList(plugins);
      } catch (err) {
        setError("Failed to load plugins. Please try again.");
        console.error("Error loading plugins:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlugins();
  }, []);

  // Render loading state
  if (isLoading) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Add or Remove Plugin</DialogTitle>
          <DialogDescription>Loading plugins...</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add or Remove Plugin</DialogTitle>
        <DialogDescription>
          Choose a plugin from the list to add or remove from your project
        </DialogDescription>
      </DialogHeader>

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md my-2">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Search input */}
      <div className="relative my-4">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search plugins..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Plugin list */}
      <div
        className="overflow-y-auto pr-2"
        style={{ maxHeight: MAX_CONTAINER_HEIGHT }}
      >
        {filteredPlugins.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {debouncedSearchQuery
              ? `No plugins found matching "${debouncedSearchQuery}"`
              : "No plugins available"}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPlugins.map((plugin) => {
              const isInstalled = installedPluginUUIDs.has(plugin.uuid);
              const isProcessing = pluginActions[plugin.uuid];

              return (
                <div
                  key={plugin.uuid}
                  className="border rounded-lg p-4 flex flex-col bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center mb-2">
                    {plugin.image ? (
                      <img
                        src={plugin.image}
                        alt={`${plugin.name} icon`}
                        className="w-12 h-12 mr-3 rounded object-cover"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.setAttribute(
                            "style",
                            "display: flex"
                          );
                        }}
                      />
                    ) : null}
                    <div
                      className="w-12 h-12 mr-3 rounded bg-muted flex items-center justify-center"
                      style={{ display: plugin.image ? "none" : "flex" }}
                    >
                      <span className="text-muted-foreground text-xs font-medium">
                        {plugin.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{plugin.name}</h3>
                      {isInstalled && (
                        <span className="text-xs text-green-600 font-medium">
                          Installed
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 flex-grow">
                    {plugin.description}
                  </p>

                  <Button
                    onClick={() => handlePluginAction(plugin.uuid)}
                    variant={isInstalled ? "outline" : "default"}
                    className="w-full"
                    disabled={Boolean(isProcessing)}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        {isProcessing === "adding"
                          ? "Adding..."
                          : "Removing..."}
                      </div>
                    ) : isInstalled ? (
                      "Remove Plugin"
                    ) : (
                      "Add Plugin"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary" onClick={closeModals}>
            Close
          </Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}

export default ModalAddNewPlugin;
