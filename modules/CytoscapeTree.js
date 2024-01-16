/*
  Author: Mauro Vogel
  Date: January 2024
  
  Description: 
    - Defines cytoscape Tree object cyTree (used for tree representation).
    - Builds visual Tree representation of sub Turing machines in cyTree window.

  Dependencies/Imports:
    - cytoscape Library
    - SuperStates.js | global variables: the tmTree & currTreeNodeName

  Exports:
    - Functions to manipulate visible Tree
*/

import cytoscape from '../node_modules/cytoscape/dist/cytoscape.esm.min.js';
import { tmTree, currTreeNodeName } from "./SuperStates.js";

export{cyTreeCreate, cyTreeStyleCurrentNode, cyTreeReset}


/**
 * Cytoscape Global Configuration Object
 *
 * cyTree is initializes by Cytoscape instance with specified container, style, and interaction settings.
 * Global style properties are set here
*/
var cyTree = cytoscape({
    container: document.getElementById('cytoscapeTree'),
    style: [
    {
        selector: 'node',
        style: {
            shape: 'round-rectangle',
            'background-color': '#5463ff',
            'width': '50px',
        }
    },
    {
        
        selector: 'edge',
        style: {
            'line-color': '#1903a3',
            'width': 2,
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#03dbfc',
            'arrow-scale': 1.5,
            'curve-style': 'bezier',
            'control-point-distance': 50,
            'control-point-weight': 0.5, 
            'loop-direction': '0deg',
            'text-margin-x': "-10px",
            'text-margin-y': "-5px",
        }
        
    }],
    // disable panning & zooming
    zoomingEnabled: false,
    userPanningEnabled: false,

});

//Create Root at load time
cyTreeCreateNode("root", 0, 0, 0);
cyTreeStyleCurrentNode(0);

/**
 * Creates the Cytoscape tree structure based on the global Variable tmTree
 *
 * @param loadTM Flag indicating whether the function is called after loading in a TM.
 *               If true, it retrieves node names from all the Turing Machine's super states.
 *               If false, it suffices to just take the name of the new super state just provided by the user
 */
function cyTreeCreate(loadTM){
    // Initialize variables for tree traversal
    let currTreeNode = tmTree.root;
    let depth = 1;
    let width = 0;
    let currChildren = currTreeNode.children;
    let nextLevelChildren = [];

    // Traverse the tree until no more children are left
    while(currChildren.length > 0){
        //level by level
        for(let i = 0; i < currChildren.length; i++){
            //create nodes & edges for current level
            let currentChild = currChildren[i];

            //get name of current node
            let currname = "";
            if(loadTM){
                //Case 1: function is called in a LoadTM style, currTreeNodeName unavailable
                if(currentChild.parent !== null && currentChild.parent !== undefined){
                    let currState = currentChild.parent.turingMachine.getStateById(currChildren[i].superNodeId);
                    if(currState !== undefined){
                        currname = currState.name;
                    }
                }
            }
            else{
                //Case 2: User manually creates Super State
                currname = currTreeNodeName;
            }

            // Create a node and edge for the current TreeNode
            cyTreeCreateNode(currname, currChildren[i].superNodeId, depth, width);
            cyTreeCreateEdge(currChildren[i].parent.superNodeId, currChildren[i].superNodeId);
            width++;
            //save children of next level 
            for(let j = 0; j < currChildren[i].children.length; j++){
                nextLevelChildren.push(currChildren[i].children[j])
            }
        }
        //adjust parameters for next level
        width = 0;
        depth++;
        currChildren = nextLevelChildren;
        nextLevelChildren = [];
    }
    //move nodes into window
    moveNodesIntoWindow();
}

/**
 * Creates a node in CyTree with the specified characteristics.
 *
 * @param name   The name of the node to be displayed. If undefined, an empty string is used.
 * @param id     The identifier of the node.
 * @param depth  The depth level at which the node should be positioned in the tree.
 * @param width  The horizontal position of the node within its level, affecting its X-coordinate.
 */
function cyTreeCreateNode(name, id, depth, width){
    if(name === undefined){
        name = "";
    }
    cyTree.add({
        group: 'nodes',
        data: {id: id},
        style: {
            'background-color': `grey`,
            'label': `${name}`,
            "text-valign": "center",
            "text-halign": "center",
            'width': `${name.length*5 + 10}px` //dynamically set width
        },
        position: { x: parseInt(50*width + 20), y: parseInt(50* depth + 50)},
    })
}

/**
 * Creates an edge in CyTree between the specified source and target nodes.
 * Checks if the edge already exists before creating it to avoid duplicates.
 *
 * @param fromNodeId The identifier of the source node.
 * @param toNodeId   The identifier of the target node.
 */
function cyTreeCreateEdge(fromNodeId, toNodeId){
    //check if edge already exists
    for (let edge of cyTree.edges()) {
        if(edge.source().data().id == fromNodeId && edge.target().data().id == toNodeId){
            return;
        }
    }
    cyTree.add({ 
        group: 'edges', 
        data: { 
            source: `${fromNodeId}`, 
            target: `${toNodeId}`,
        }
        }
    );
}

/**
 * Colors the node with @param nodeId in the cyTree blue, while
 * coloring all others grey.
 *
 * @param nodeId The identifier of the current node to be styled.
 */
function cyTreeStyleCurrentNode(nodeId){
    cyTree.nodes().forEach(node => {
        if (parseInt(node.id()) === nodeId) {
          // Change color to blue for the specified node
          node.style('background-color', '#5463ff');
        } else {
          // Change color to grey for all other nodes
          node.style('background-color', 'grey');
        }
      });
}

/**
 * Resets cyTree to state a page load time (only root node)
 *
 */
function cyTreeReset(){
    var cyNodes = cyTree.nodes();
    cyNodes.remove();
    cyTreeCreateNode("root", 0, 0, 0);
    cyTreeStyleCurrentNode(0);
}

/**
 * Helper: that moves all nodes back inside of window if user drags them out of it
 */
function moveNodesIntoWindow(){
    let w = cyTree.width();
    let h = cyTree.height();
    cyTree.nodes().forEach(node => {
        if(node.position().x > w-10){
            node.position().x = w-10;
        }
        if(node.position().x < 0+10){ 
            node.position().x = 0+10;
        }
        if(node.position().y > h-10){
            node.position().y = h-10;
        } 
        if(node.position().y < 0+10){
            node.position().y = 0+10;
        } 
    })
    //run default layout to refresh cytoscape window
    var layoutOptions = {
        name: 'preset',
    }
    cyTree.layout(layoutOptions).run();
}
//call function on user moving node (releasing node)
cyTree.on('mouseup', function (e) {
    moveNodesIntoWindow();
})
