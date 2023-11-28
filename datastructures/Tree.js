
export class TreeNode{
    /**
     * Node of the Tree, saving Turingmachine & node positions in cytowindow
     * 
     * @param {TuringMachine} turingMaschine - turingMachine in this node
     * @param {Map<number, [number, number]>} nodePositions - Map from [nodeId] to [nodeXPos, nodeYPos]
     * @param {TreeNode} parent - parentNode
     */
    constructor(turingMaschine, nodePositions = new Set(), parent=null){
        this.turingMaschine = turingMaschine;
        this.nodePositions = nodePositions;
        this.parent = parent;
        this.children = [];
    }
}

export class Tree{
    constructor(root){
        this.root = root;
    }
}