import cytoscape from '../node_modules/cytoscape/dist/cytoscape.esm.min.js';


export {cy, cyCreateNode, cyCreateEdge, cyClearCanvas, runLayout, addEventListenerWithCheck, refresh, moveNodesIntoWindow, cyGrabifyNodes};


//////////////////////////////////////////////////////////////
//// -------------------- Cytoscape --------------------- ////
//////////////////////////////////////////////////////////////
//// ----------- Cytoscape object
//Creates standard cytoscape object & defines global properties.
var cy = cytoscape({
    container: document.getElementById('cytoscape'),
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

//disallow drag & drop in edit mode
//global var: EditMode
let editMode = document.getElementById("editMode")
//disable editmode at page load
if(inEditMode()){
    var button = document.querySelector('.toggle-button');
    button.classList.toggle('active');
}
//cy nodes not grabbable during edit mode
var button = document.getElementById("editButton");
button.addEventListener('click', function (event) {
    console.log("hello");
    cyGrabifyNodes();
})
function cyGrabifyNodes(){
    if(inEditMode()){
        cy.nodes().ungrabify();
    }
    else{
        cy.nodes().grabify();
    }
}



//// ----------- Node Creation

/**
 * Creates a Node in the cytoscape Object with the specified properties.
 * 
 * @param {number} nodeId - unique identifier of the node (same as in TM object)
 * @param {string} nodeName - Name of node displayed on node
 * @param {number} xPos - xCoord of node in window, if not specified, set to 200
 * @param {number} yPos - yCoord of node in window, if not specified, set to 200
 * @param {boolean} isStarting - used to specify style properties
 * @param {boolean} isAccepting - used to specify style properties
 * @param {boolean} isRejecting - used to specify style properties
 */
function cyCreateNode(nodeId, nodeName, xPos=200, yPos=200, isStarting, isAccepting, isRejecting){
    console.log("cyCreateNode with id", nodeId, " xPos: ", xPos, " yPos: ", yPos);
    
    //default values
    let label = nodeName;
    let id = nodeId;
    let color = 'lightgrey';
    let borderWidth = 0;
    let borderColor = 'white';

    //adjust style for Accepting/Starting/Rejecting nodes
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
    //core
    cy.add({
        group: 'nodes',
        data: {id: id},
        style: {
            'background-color': `${color}`,
            'border-width': `${borderWidth}`, // Set the border width for the nodes
            'border-color': `${borderColor}`,
            'label': `${label}`,
            "text-valign": "center",
            "text-halign": "center",
            'width': `${label.length*10 + 10}px` //dynamically set width
        },
        position: { x: parseInt(xPos), y: parseInt(yPos)},
    });
}

//// ----------- Edge Creation

/**
 * Creates an Edge in the Cytoscape object
 * 
 * @param {number} fromNode ID of node Edge originates from
 * @param {number} toNode ID of node Edge goes to
 * @param {string} label Label of Edge
 * @param {char} readToken Edge responsible for when this token is read (used in EdgeAnimation)
 */
function cyCreateEdge(fromNode, toNode, label, readToken){
    console.log("cyCreateEdge " + fromNode + " | " + toNode + " | " + label);

    //core
    cy.add({ 
        group: 'edges', 
        data: { 
            source: `${fromNode}`, 
            target: `${toNode}`,
            readToken: `${[readToken]}`,
        },
        style: {
            'label': `${label}`,
            'font-size': '12px',


          }
        }
    );
}

//// ----------- Edge Merging
//TO DO - decide how to merge edges 
function mergeEdges(edge1, edge2){
    //catch source/target not matching
    if(edge1.data().source !== edge2.data().source ||
    edge1.data().target !== edge2.data().target){
        return;
    }

    //save edge data

    let mergedSource = edge1.data().source;
    let mergedTarget = edge1.data().target;
    let readToken1 = edge1.data().readToken;
    let readToken2 = edge2.data().readToken;

    //remove old edges
    cy.remove(edge1);
    cy.remove(edge2);

    //create merged edge
    cyCreateEdge(mergedSource, mergedTarget, label, readToken1);

}

//// ----------- Clear Canvas
/**
 * Clears Canvas (Reset Cytoscape object)
 */
function cyClearCanvas(){
    var cyNodes = cy.nodes();
    cyNodes.remove();
}




//////////////////////////////////////////////////////////////
//// ---------------------- Layout ---------------------- ////
//////////////////////////////////////////////////////////////

//specifies node (&edge) layout
/**
 * Specifies a default layout of the nodes in the cytoscape object
 * note: not used at the moment
 */
function runLayout(){
    var layoutOptions = {
        name: 'grid',
        avoidOverlap: true,
        padding: 20,
        randomize: false,
        fit: true,
    };
    var layout = cy.layout(layoutOptions);
    layout.run();
}
/**
 * Refreshes cytoscape window (upon edit)
 * note: not used at the moment
 */
function refresh(){
    var layoutOptions = {
        name:"grid",
    };
    var layout = cy.layout(layoutOptions);
    layout.run;
}

//////////////////////////////////////////////////////////////
//// -------------------- SuperNode --------------------- ////
//////////////////////////////////////////////////////////////

/**
 * Experimental Area to try to create supernode
 */
/*
cy.on('dbltap', 'node', function(event){
    var node = event.target;
    openNewSubWindow();
})

document.getElementById("subWindowOpener").addEventListener('click', openNewSubWindow);

function openNewSubWindow(){
    var newWindow = window.open('sub_window.html', '_blank', 'width=800, height=600');
}
*/


//////////////////////////////////////////////////////////////
//// --------------------- Helpers ---------------------- ////
//////////////////////////////////////////////////////////////

/**
 * 
 * Helper: that creates EventListeners, if not yet existent (avoids duplication of EventListeners)
 * 
 * @param {document Element} element - HTML element the EventListener is used on
 * @param {string} eventType - specifies event Type (such as 'click')
 * @param {function} listener - Function that is called when the eventlistener triggers
 */
function addEventListenerWithCheck(element, eventType, listener){
    const existingListeners = element.__eventListeners || {};
    if(!existingListeners[eventType]){
        element.addEventListener(eventType, listener);
        existingListeners[eventType] = listener;
    }
}

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

    var layoutOptions = {
        name: 'preset',
    }
    cy.layout(layoutOptions).run();


    seperateNodes();
}
//call function whenever window resizes
window.addEventListener('resize', function () {
    moveNodesIntoWindow();
});
//call function on user moving node (releasing node)
cy.on('mouseup', function (e) {
    moveNodesIntoWindow();
})


//Helper: seperates Nodes too close to each other
//TO DO
function seperateNodes(){
    
}


function inEditMode(){
    var button = document.querySelector('.toggle-button');
    // Check if the button is currently active
    var isActive = button.classList.contains('active');
    return isActive;
}
