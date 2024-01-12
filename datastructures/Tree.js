/*
  Author: Mauro Vogel
  Date: January 2024
  
  Description: 
    - Defines the Tree datastructure, including classes Tree & TreeNode
         used for structuring Sub Turing machines

  Dependencies/Imports:
    - none

  Exports:
    - class TreeNode
    - class Tree
*/
export class TreeNode{
    /** 
     * Constructor to create Node of the Tree.
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
    /**
     * Recursively searches for a tree node with the specified superNodeId.
     *
     * @param {number} id - The id of the tree node to search for.
     * @returns {TreeNode | null} - The found tree node or null if not found.
     */
    getTreeNodeById(id){
        if(this.superNodeId == id){
            return this;
        }
        // Recursively search for the node in the children
        for (const child of this.children) {
            const foundNode = child.getTreeNodeById(id);
            if (foundNode) {
                return foundNode;
            }
        }
        return null;
    }
}

export class Tree{
    /**
     * Constructs a Tree object with the specified root node.
     *
     * @param {TreeNode} root - The root node of the tree.
     */
    constructor(root){
        this.root = root;
    }
}