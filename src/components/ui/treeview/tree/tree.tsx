import { ScrollArea } from "../../scroll-area";
import { useTree } from "./hooks";
import { IData } from "./interfaces";
import TreeContainer from "./tree-container";

interface ITreeProps {
  data: IData;
  height: number;
}

function Tree(props: ITreeProps) {
  const tree = useTree(props.data);
  //console.log("tree is rendering");
  //console.log(tree);
  return (
    <div className=" h-full  pb-3">
      <div className=" h-6">
        Tree conponent: here is space for some controls?
      </div>
      <ScrollArea
        style={{
          width: "100%",
          height: props.height - 24,
          //backgroundColor: "lightblue",
        }}
      >
        <TreeContainer tree={tree} height={props.height - 24}></TreeContainer>
      </ScrollArea>
    </div>
  );
}

export default Tree;
