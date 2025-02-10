import { useEffect, useRef, useState } from "react";
import { ScrollAreaRefViewport } from "../../scroll-area";
import { SearchInput } from "../../search-input";
import { useTree } from "./hooks";
import { IData } from "./interfaces";
import TreeContainer from "./tree-container";
import { useDebounceValue } from "@/hooks/hooks";
import { Commands } from "@/API";

interface ITreeProps {
  data: IData;
  defaultValue?: string | string[];
  onSelect?: (value: string | string[]) => void;
  nodeContextCommands?: (id: string) => Commands;
}

function Tree(props: ITreeProps) {
  const tree = useTree(props.data, props.onSelect, props.nodeContextCommands);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounceValue(searchTerm, 300);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tree.search(debouncedSearchTerm);
  }, [debouncedSearchTerm, tree]);

  useEffect(() => {
    if (props.defaultValue) {
      if (Array.isArray(props.defaultValue)) {
        tree.addSelectedNodeByIDs(props.defaultValue);
      } else {
        tree.addSelectedNodeByID(props.defaultValue);
      }
    }
  }, [props.defaultValue, tree]);

  return (
    <div className=" pb-3 p-1 pt-0 flex flex-col gap-1">
      <SearchInput
        className=" h-7  "
        autoFocus
        onChange={(e) => {
          setSearchTerm(e.target.value);
        }}
      />

      <ScrollAreaRefViewport className="h-full w-full">
        <TreeContainer tree={tree} scrollRef={scrollRef}></TreeContainer>
      </ScrollAreaRefViewport>
    </div>
  );
}

export default Tree;
