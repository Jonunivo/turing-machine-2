import cytoscape from '../node_modules/cytoscape/dist/cytoscape.esm.min.js';

import { tmTree, currTreeNodeName } from "./SuperStates.js";

export{cyTreeCreate, cyTreeStyleCurrentNode}

var cyTree = cytoscape({
    container: document.getElementById('cytoscape-tree'),
    style: [
    {
        selector: 'node',
        style: {
            shape: 'round-rectangle',
            'background-color': 'red',
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

//buildup cyTree
function cyTreeCreate(){

    let currTreeNode = tmTree.root;

    let depth = 1;
    let width = 0;
    let id = 1;
    let currChildren = currTreeNode.children;
    let nextLevelChildren = [];

    //until no more children left
    while(currChildren.length > 0){
        //level by level
        for(let i = 0; i < currChildren.length; i++){
            //create nodes & edges for current level
            cyTreeCreateNode(currTreeNodeName, currChildren[i].superNodeId, depth, width);
            console.log(currChildren[i].parent);
            cyTreeCreateEdge(currChildren[i].parent.superNodeId, currChildren[i].superNodeId);
            id++;
            width++;
            //save children of next level 
            for(let j = 0; j < currChildren[i].children.length; j++){
                console.log("adding children");
                nextLevelChildren.push(currChildren[i].children[j])
            }
        }
        //adjust parameters for next level
        width = 0;
        depth++;
        currChildren = nextLevelChildren;
        nextLevelChildren = [];
    }
}

function cyTreeCreateNode(name, id, depth, width){
    if(name=== undefined){
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
        },
        style: {
          }
        }
    );
}

function cyTreeStyleCurrentNode(nodeId){
    cyTree.nodes().forEach(node => {
        console.log(node.id(), " | ", nodeId);
        if (parseInt(node.id()) === nodeId) {
          // Change color to red for the specified node
          node.style('background-color', 'red');
        } else {
          // Change color to grey for all other nodes
          node.style('background-color', 'grey');
        }
      });
}


