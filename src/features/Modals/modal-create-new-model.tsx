import { closeModals, createModelFromModal } from "@/API/GUI-api/modal-api";
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
import { useAppSelector } from "@/hooks/hooks";

import { Plugin } from "electron/src/project";
import { useMemo, useState } from "react";

import { Combobox } from "@/components/ui/combobox";

function ModalCreateNewModel() {
  const [modelName, setModelName] = useState("");
  const plugins: Plugin[] = useAppSelector(selectProjectPlugins);
  const [uuid, setUUID] = useState("");

  const pluginOptions = useMemo(() => {
    if (!plugins?.length) return [];
    return plugins.map((value) => {
      return { value: value.uuid, label: value.name };
    });
  }, [plugins]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create new model</DialogTitle>
        <DialogDescription>Choose folder name and location</DialogDescription>
      </DialogHeader>
      <Input
        onChange={(event) => {
          setModelName(event.target.value);
        }}
        placeholder="Model Name"
      />
      <Combobox options={pluginOptions} setter={setUUID} />
      <DialogFooter>
        <DialogClose asChild>
          <Button
            onClick={() => {
              createModelFromModal(modelName, uuid);
              closeModals();
            }}
          >
            Create Model and continue to editor
          </Button>
        </DialogClose>
        <DialogClose asChild>
          <Button variant="secondary" onClick={() => closeModals()}>
            Cancel
          </Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}

export default ModalCreateNewModel;
