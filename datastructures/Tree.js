
export class TreeNode{
    /*
     * Node of the Tree, saving Turingmachine & node positions in cytowindow
     * 
     * @param {TuringMachine} turingMachine - turingMachine in this node
     * @param {Map<number, [number, number]>} nodePositions - Map from [nodeId] to [nodeXPos, nodeYPos]
     * @param {TreeNode} parent - parentNode
     * @param {number} superNodeId - Id of SuperNode associated to this TreeNode in parentTM
     */
    constructor(turingMachine, nodePositions = new Set(), parent=null, superNodeId = undefined){
        this.turingMachine = turingMachine;
        this.nodePositions = nodePositions;
        this.parent = parent;
        this.children = [];
        this.superNodeId = superNodeId;
    }
    getTreeNodeById(id){
        if(this.superNodeId == id){
            console.log("**", this.superNodeId);
            return this;
        }
        // Recursively search for the node in the children
        for (const child of this.children) {
            const foundNode = child.getTreeNodeById(id);
            if (foundNode) {
                return foundNode; // Node found in the child subtree
            }
        }
        return null;
    }

}

export class Tree{
    constructor(root){
        this.root = root;
    }

}