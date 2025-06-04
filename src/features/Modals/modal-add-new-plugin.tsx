import { closeModals } from "@/API/GUI-api/modal-api";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebounceValue } from "@/hooks/hooks";
import { PluginListType } from "electron/src/project/plugin-definitions";
import { Search } from "lucide-react";

import { useEffect, useMemo, useState } from "react";

function ModalAddNewPlugin() {
  const [pluginList, setPluginList] = useState<PluginListType[]>();
  const [searchQuery, setSearchQuery] = useState("");
  const [addedPlugins, setAddedPlugins] = useState<string[]>([]);

  // Debounce the search query with a 300ms delay
  const debouncedSearchQuery = useDebounceValue(searchQuery, 300);

  // Memoize filtered plugins to avoid recalculating on every render
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

  const handleAddPlugin = (pluginUUID: string) => {
    /////
    console.log(pluginUUID);
    setAddedPlugins([...addedPlugins, pluginUUID]);
  };

  useEffect(() => {
    const getPlugins = async () => {
      const plugins = await window.project.getListOfPlugins();
      setPluginList(plugins);
    };

    getPlugins();

    setAddedPlugins([]); //////
  }, []);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add or Remove Plugin</DialogTitle>
        <DialogDescription>
          Choose a plugin from the list to be added or removed from project
        </DialogDescription>
      </DialogHeader>

      <div className="relative my-4">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search plugins..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="max-h-[1000px] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 gap-4">
          {filteredPlugins.map((plugin) => (
            <div
              key={plugin.uuid}
              className="border rounded-lg p-4 flex flex-col bg-card text-card-foreground shadow"
            >
              <div className="flex items-center mb-2">
                {plugin.image ? (
                  <img
                    src={plugin.image}
                    alt={plugin.name}
                    className="w-12 h-12 mr-3 rounded"
                  />
                ) : (
                  <div className="w-12 h-12 mr-3 rounded bg-slate-500"></div>
                )}
                <h3 className="font-semibold text-lg">{plugin.name}</h3>
              </div>
              <p className="text-sm mb-4 flex-grow">{plugin.description}</p>
              <Button
                onClick={() => handleAddPlugin(plugin.uuid)}
                variant={
                  addedPlugins.indexOf(plugin.uuid) ? "outline" : "default"
                }
                className="w-full"
              >
                {addedPlugins.indexOf(plugin.uuid)
                  ? "Remove Plugin"
                  : "Add Plugin"}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary" onClick={() => closeModals()}>
            Close
          </Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}

export default ModalAddNewPlugin;
