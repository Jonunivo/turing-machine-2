/*
  Author: Mauro Vogel
  Date: January 2024
  
  Description: 
    - Defines cytoscape object cy (used for cytoscape main window)
    - Provides functionality to manipulate & control cy object / cytoscape main window

  Dependencies/Imports:
    - cytoscape Library

  Exports:
    - Shared variable cy
    - Functions to manipulate main cytoscape window
    - Function that generates nodePosMap used to save nodes positions in other modules
*/

import cytoscape from '../node_modules/cytoscape/dist/cytoscape.esm.min.js';
export {cy, cyCreateNode, cyCreateEdge, cyClearCanvas, moveNodesIntoWindow, cyGrabifyNodes, generateNodePosMap};

/// Global/shared variables


//////////////////////////////////////////////////////////////
//// -------------------- Cytoscape --------------------- ////
//////////////////////////////////////////////////////////////
/**
 * Cytoscape Global Configuration Object
 *
 * cy is initializes by Cytoscape instance with specified container, style, and interaction settings.
 * All objects in main cytoscape window are save in cy
*/
var cy = cytoscape({
    container: document.getElementById('cytoscape'),
    style: [
    {
        //default node styling
        selector: 'node',
        style: {
            shape: 'round-rectangle',
            'background-color': 'red',
            'width': '50px',
        }
    },
    {
        //default edge styling
        selector: 'edge',
        style: {
            'line-color': 'darkgrey',
            'width': 2,
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#363636',
            'arrow-scale': 1.2,
            'curve-style': 'bezier',
            'control-point-step-size': 50,
            'control-point-weight': 0.5, 
            'loop-direction': '0deg',
            'loop-sweep': '-120deg',
            'text-margin-x': "-10px",
            'text-margin-y': "-5px",
            'font-size': "12px",
//            'text-rotation': 'autorotate',
        }
        
    }],
    // disable panning & zooming
    zoomingEnabled: false,
    userPanningEnabled: false,
  });

/**
 * Creates a Node in the cytoscape Object with the specified properties.
 * The width of the node is dynamically set by length of nodeName.
 * !will not create the node if a cytoscape node with this ID already exists
 * 
 * @param {number} nodeId - unique identifier of the node (same as in TM object)
 * @param {string} nodeName - Name of node displayed on node
 * @param {number} xPos - xCoord of node in window
 * @param {number} yPos - yCoord of node in window
 * @param {boolean} isStarting - is node Starting?
 * @param {boolean} isAccepting - is node Accepting?
 * @param {boolean} isRejecting - is node Rejecting?
 * @param {boolean} isSuperNode - is node subTM node?
 */
function cyCreateNode(nodeId, nodeName, xPos=200, yPos=200, isStarting, isAccepting, isRejecting, isSuperNode = false){
    //style variables set to default values
    let color = 'lightgrey';
    let borderWidth = 0;
    let borderColor = 'white';
    let borderStyle = 'solid';

    //adjust style for Starting/Accepting/Rejecting nodes
    if(isStarting){
        borderWidth = 2;
        borderColor = 'black';
        color = 'darkgrey';
    }
    if(isAccepting){
        color = 'limegreen';
    }
    else if(isRejecting){
        color = 'red';
    }
    //styling of SuperNode
    if(isSuperNode){
        borderStyle = 'dashed';
        borderWidth = 2;
        borderColor = 'black';
        color = '#ffffa3';
    }
    //core
    cy.add({
        group: 'nodes',
        data: {id: nodeId},
        style: {
            'background-color': `${color}`,
            'border-width': `${borderWidth}`, // Set the border width for the nodes
            'border-color': `${borderColor}`,
            'border-style': `${borderStyle}`,
            'label': `${nodeName}`,
            "text-valign": "center",
            "text-halign": "center",
            'width': `${nodeName.length*10 + 10}px` //dynamically set width
        },
        position: { x: parseInt(xPos), y: parseInt(yPos)},
    });
}

/**
 * Creates an Edge in the Cytoscape object
 * 
 * @param {number} fromNodeId ID of node Edge originates from
 * @param {number} toNodeId ID of node Edge goes to
 * @param {string} label Label of Edge
 * @param {char} readToken Edge responsible for when this token is read (used in EdgeAnimation)
 */
function cyCreateEdge(fromNodeId, toNodeId, label, readToken){
    cy.add({ 
        group: 'edges', 
        data: { 
            source: `${fromNodeId}`, 
            target: `${toNodeId}`,
            readToken: `${[readToken]}`,
        },
        style: {
            'label': `${label}`,
          },
        },
    );
}

/**
 * Clears Canvas (Removes all nodes and edges from cy)
 */
function cyClearCanvas(){
    //removing all nodes will also remove all edges
    var cyNodes = cy.nodes();
    cyNodes.remove();
}

//////////////////////////////////////////////////////////////
//// --------------------- Helpers ---------------------- ////
//////////////////////////////////////////////////////////////

/**
 * Helper: that generates the positionMap of current Cytoscape window 
 * used in TreeNode to save Positions of CytoNodes
 * 
 * @returns {Map<number, [number, number]>} positionMap
 */
function generateNodePosMap(){
    let positionMap = new Map();
    cy.nodes().forEach(node => {
        positionMap.set(parseInt(node.data().id), [parseInt(node.position().x), parseInt(node.position().y)])
    });
    return positionMap;
}

//TO DO: move to UserInput or UserEdit or ..., function is not even used in this module


/**
 * Helper: that moves all nodes back inside of window if user drags them out of it, or if window is resized
 */
function moveNodesIntoWindow(){
    let w = cy.width();
    let h = cy.height();
    cy.nodes().forEach(node => {
        if(node.position().x > w-20){
            node.position().x = w-50;
        }
        if(node.position().x < 0+20){ 
            node.position().x = 0+50;
        }
        if(node.position().y > h-20){
            node.position().y = h-20;
        } 
        if(node.position().y < 0+60){
            node.position().y = 0+60;
        } 
    })
    //run default layout to refresh cytoscape window
    var layoutOptions = {
        name: 'preset',
    }
    cy.layout(layoutOptions).run();
}
//call function whenever window resizes
window.addEventListener('resize', function () {
    moveNodesIntoWindow();
});
//call function on user moving node (releasing node)
cy.on('mouseup', function (e) {
    moveNodesIntoWindow();
})

/**
 * Helper: that checks if the Move button is deactivated
 * @returns {boolean} true if move button is deactivated
 */
function inEditMode(){
    var button = document.querySelector('.toggle-button');
    var isNotActive = !button.classList.contains('active');
    return isNotActive;
}
//disable move mode at page load
if(!inEditMode()){
    var button = document.querySelector('.toggle-button');
    button.classList.toggle('active');
}

/**
 * Helper: enables/disables moving nodes in cytoscape window.
 */
function cyGrabifyNodes(){
    if(inEditMode()){
        cy.nodes().ungrabify();
    }
    else{
        cy.nodes().grabify();
    }
}
//call whenever move button is pressed
var button = document.getElementById("editButton");
button.addEventListener('click', function (event) {
    cyGrabifyNodes();
})
