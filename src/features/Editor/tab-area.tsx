import { useAppSelector } from "@/hooks/hooks";
import { selectEditedFiles } from "@/API/editor-api/editor-api.slice";
import { Tab } from "./tab";

export function TabArea() {
  const editorData = useAppSelector(selectEditedFiles);
  return (
    <div className="overflow-x-hidden relative border-b bg-background select-none cursor-pointer">
      <div className="flex whitespace-nowrap transition-transform w-[max-content] ">
        {editorData.map((item) => (
          <Tab key={item.id} editedFile={item} />
        ))}
      </div>
    </div>
  );
}
