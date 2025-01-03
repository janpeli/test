import { useEffect, useRef, useState } from "react";
import { ScrollAreaRefViewport } from "../../scroll-area";
import { SearchInput } from "../../search-input";
import { useTree } from "./hooks";
import { IData } from "./interfaces";
import TreeContainer from "./tree-container";
import { useDebounceValue } from "@/hooks/hooks";

interface ITreeProps {
  data: IData;
  height: number;
}

function Tree(props: ITreeProps) {
  const tree = useTree(props.data);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounceValue(searchTerm, 300);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tree.search(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  return (
    <div className=" pb-3 p-1 pt-0 flex flex-col gap-1">
      <SearchInput
        className=" h-7  "
        autoFocus
        onChange={(e) => {
          setSearchTerm(e.target.value);
        }}
      />

      <ScrollAreaRefViewport
        ref={scrollRef}
        style={{
          width: "100%",
          height: props.height - 40,
          //backgroundColor: "lightblue",
        }}
      >
        <TreeContainer
          tree={tree}
          height={props.height - 32}
          scrollRef={scrollRef}
        ></TreeContainer>
      </ScrollAreaRefViewport>
    </div>
  );
}

export default Tree;
