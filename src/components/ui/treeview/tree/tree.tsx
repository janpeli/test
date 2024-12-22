import { useTree } from "./hooks";
import { IData } from "./interfaces";
import TreeContainer from "./tree-container";

interface ITreeProps {
  data: IData;
}

function Tree(props: ITreeProps) {
  const tree = useTree(props.data);
  //console.log("tree is rendering");
  //console.log(tree);
  return (
    <div className=" h-full overflow-auto pb-3">
      Tree conponent: here is space for some controls?
      <br />
      <TreeContainer tree={tree}></TreeContainer>
    </div>
  );
}

export default Tree;
