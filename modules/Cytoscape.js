import cytoscape from '../node_modules/cytoscape/dist/cytoscape.esm.min.js';
import {TuringMachine, turingMachine} from './TuringMachine.js';

export {cy, cyCreateNode, cyCreateEdge, nodePresetHelper, nodePresetReset, cyClearCanvas};

//------ global variables ------//
//Id for node creation (cyto id & turingmaschine id)
var nodeId = 0;
//fromNode at Edge Creation (used to safe on which node the user clicked)
var fromNode;
//editNode to save node clicked on to edit
var cytoEditNode;
var editNode;
//editEdge to save edge clicked on to edit
var cytoEditEdge;
var editEdgeKey
var editEdgeContent;


//////////////////////////////////////////////////////////////
//// -------------------- Cytoscape --------------------- ////
//////////////////////////////////////////////////////////////
//// ----------- Cytoscape object
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
            'line-color': '#404040',
            'width': 2,
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#2371f7',
            'curve-style': 'bezier',
            'loop-direction': '0deg'
        }
        
    }],

    // disable panning & zooming
    zoomingEnabled: false,
    userPanningEnabled: false,
  });


//// ----------- Node Creation
function cyCreateNode(nodeName, xPos=200, yPos=200, isStarting, isAccepting, isRejecting){
    console.log("cyCreateNode with id", nodeId);
    
    //default values
    let label = nodeName;
    let id = nodeId;
    let color = 'lightgrey';
    let borderWidth = 0;
    let borderColor = 'white';

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
        },
        position: { x: xPos, y: yPos},
    });
    runLayout();
}

//// ----------- Edge Creation
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
            "text-margin-y": "-5px",

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
function cyClearCanvas(){
    var cyNodes = cy.nodes();
    cyNodes.remove();
}



//////////////////////////////////////////////////////////////
//// ------------------ User Creation ------------------- ////
//////////////////////////////////////////////////////////////
//// ----------- Node Creation
//dblclick -> create node
 cy.on('dblclick', (event) => {
    //get doubleclick position
    const position = event.position;

    //
    const nodeModal = document.getElementById('nodeModal');
    const modal = document.querySelector('.modal-content');

    //get cytoscape window position
    const cytoWindow = document.querySelector('#cytoscape');
    const leftValue = parseInt(window.getComputedStyle(cytoWindow).getPropertyValue('left'), 10);
    const topValue = parseInt(window.getComputedStyle(cytoWindow).getPropertyValue('top'), 10);

    ////change button from "edit node" to "create node"
    var nodeEditButton = document.getElementById("nodeEditButton");
    var nodeButton = document.createElement("button");
    nodeButton.id = "nodeButton";
    nodeButton.innerText = "Create Node";
    if(nodeEditButton){
        // Replace the existing button with the new button
        nodeEditButton.parentNode.replaceChild(nodeButton, nodeEditButton);
    }
    addEventListenerWithCheck(document.getElementById('nodeButton'), 'click', userNodeInputHandler)

    //disable sliders
    disableSliders();


    //remove delete node button
    let deleteButton = document.getElementById("nodeDeleteButton");
    if(deleteButton){
        document.getElementById("deleteNodeDiv").removeChild(deleteButton);
    }


    //display modal at doubleclick position
    nodeModal.style.paddingLeft = `${position.x + leftValue}px`
    nodeModal.style.paddingTop = `${position.y + topValue}px`;
    nodeModal.style.display = 'block';
})



function userNodeInputHandler(){
    //Close the modal
    nodeModal.style.display = 'none';
    
    //Read user input
    let stateName = document.getElementById('stateName').value;
    let isStartingState = document.getElementById("stateStarting").checked === true;
    let isAcceptingState = document.getElementById("stateAccepting").checked === true;
    let isRejectingState = document.getElementById("stateRejecting").checked === true;
    //catch accepting & rejecting case
    if(isAcceptingState && isRejectingState){
        alert("a state cannot be accepting & rejecting at the same time");
        return;
    }

    //create cyto node
    cyCreateNode(stateName, undefined, undefined, isStartingState, isAcceptingState, isRejectingState);
    
    //create node in TM
    turingMachine.createState(nodeId, stateName, isStartingState, isAcceptingState, isRejectingState);
    //adjust nodeId
    nodeId++;

    ////logging
    console.log("-----NEW STATE CREATED-----");
    console.log("new State with id: ", nodeId-1);
    console.log("tm now: ", turingMachine);

}
//Cancel button (node) pressed
document.getElementById("cancelButton").addEventListener('click', function(){
    nodeModal.style.display = 'none';
})

//Helper functions to adjust global variable nodeId (used in Presets.js)
function nodePresetHelper(){
    nodeId++;
}
function nodePresetReset(){
    nodeId = 0;
}


//// ----------- Edge Creation
//click on node to create edge from this node
cy.on('tap', 'node', (event) => {
    ////open modal
    //save click position
    const position = event.position;

    //
    const edgeModal = document.getElementById('edgeModal');
    const modal = document.querySelector('.modal-content');

    //get cytoscape window position
    const cytoWindow = document.querySelector('#cytoscape');
    const leftValue = parseInt(window.getComputedStyle(cytoWindow).getPropertyValue('left'), 10);
    const topValue = parseInt(window.getComputedStyle(cytoWindow).getPropertyValue('top'), 10);

    ////change button from "edit node" to "create node" (if necessary)
    var edgeEditButton = document.getElementById("edgeEditButton");
    var edgeButton = document.createElement("button");
    edgeButton.id = "edgeButton";
    edgeButton.innerText = "Create Edge";
    if(edgeEditButton){
        //replace if needed
        edgeEditButton.parentNode.replaceChild(edgeButton, edgeEditButton);
    }
    //user submit node inputs (Event Listener)
    addEventListenerWithCheck(document.getElementById("edgeButton"), 'click', userEdgeInputHandler)

    //remove delete edge button (if exists)
    const deleteButton = document.getElementById("edgeDeleteButton");
    if(deleteButton){
        document.getElementById("deleteEdgeDiv").removeChild(deleteButton);
    }
    //remove fromnode field (if exists)
    const fromNode1 = document.getElementById("fromState");
    const fromNode2 = document.getElementById("fromStateLabel");
    if(fromNode1){
        document.getElementById("fromStateDiv").removeChild(fromNode1);
    }
    if(fromNode2){
        document.getElementById("fromStateDiv").removeChild(fromNode2);
    }

    //display modal at click position
    edgeModal.style.paddingLeft = `${position.x + leftValue}px`
    edgeModal.style.paddingTop = `${position.y + topValue}px`;
    edgeModal.style.display = 'block';

    //create DropDownMenu for ToNode
    createDropdownMenues(document.getElementById("toState"))


    //save node clicked on
    const node = event.target;
    fromNode = turingMachine.getStatebyId(node.id());

});

//user submit edge inputs
function userEdgeInputHandler(){
    //Close the modal
    edgeModal.style.display = 'none';

    //// read user input

    //toNode 
    //!for this to work properly, it is assumed that the states in turingMachine are ordered ascendingly by ID!
    let dropdown = document.getElementById("toState")
    let toNodeId = parseInt(dropdown.selectedIndex);
    let toNode = turingMachine.getStatebyId(toNodeId);
    console.log(toNodeId);



    //readLabel
    let readLabel = document.getElementById('readLabel').value;
    //tapeMovement
    let tapeMovementValue = document.getElementById('tapeMovement').value;
    let tapeMovement = "N"
    if(parseInt(tapeMovementValue) === -1){
        tapeMovement = "L";
    }
    else if(parseInt(tapeMovementValue) === 1){
        tapeMovement = "R";
    }
    else{
        tapeMovement = "N";
    }
    //writeLabel
    let cyLabel = "";
    let writeLabel;
    if(document.getElementById('writeLabel').value !== ''){
        writeLabel = document.getElementById('writeLabel').value;
        cyLabel = "R: " + readLabel + " W: " + writeLabel + " | " + tapeMovement;
    }
    else{
        writeLabel = undefined;
        cyLabel = "R: " + readLabel + " | " + tapeMovement;
    }

    //create Edge Cytoscape
    cyCreateEdge(`${fromNode.id}`, `${toNodeId}`, cyLabel, readLabel);

    //create edge in TM
    let fromState = turingMachine.getStatebyId(fromNode.id);
    let toState = turingMachine.getStatebyId(toNode.id);
    turingMachine.createTransition(fromState, readLabel, toState, writeLabel, tapeMovement);
    console.log(turingMachine);
    //-- TO DO -- adjust Alphabet of TM if user enters new token

}

//Cancel button (edge) pressed
document.getElementById("cancelButton2").addEventListener('click', function(){

    edgeModal.style.display = 'none';
})

//Helper: Creates dropdown menus dynamically
function createDropdownMenues(dropdown){
    //remove all dropdown elements created earlier
    while(dropdown.options.length > 0){
        dropdown.remove(0);
    }
    //fetch options from existing nodeIds
    let options = [];
    for(const state of turingMachine.states){
        options.push(state.name);
    }
    //create HTML elements from options
    for(const option of options){
        const optionElement = document.createElement('option');
        optionElement.text = option;
        dropdown.add(optionElement);
    }



    ////
}


//////////////////////////////////////////////////////////////
//// -------------------- User Edit --------------------- ////
//////////////////////////////////////////////////////////////
//// ----------- Node Edit
cy.on('cxttap', 'node', function(event){

    //save node clicked on (global vars)
    cytoEditNode = event.target;
    editNode = turingMachine.getStatebyId(cytoEditNode.id());

    ////open Modal at click position
    //get click position
    const position = event.position;
    console.log(position);

    //
    const nodeModal = document.getElementById('nodeModal');
    const modal = document.querySelector('.modal-content');

    //get cytoscape window position
    const cytoWindow = document.querySelector('#cytoscape');
    const leftValue = parseInt(window.getComputedStyle(cytoWindow).getPropertyValue('left'), 10);
    const topValue = parseInt(window.getComputedStyle(cytoWindow).getPropertyValue('top'), 10);

    //display modal at node position
    nodeModal.style.paddingLeft = `${position.x + leftValue}px`
    nodeModal.style.paddingTop = `${position.y + topValue}px`;
    nodeModal.style.display = 'block';



    ////change button from "create node" to "edit node"
    var nodeButton = document.getElementById("nodeButton");
    if(nodeButton){
        var nodeEditButton = document.createElement("button");
        nodeEditButton.id = "nodeEditButton";
        nodeEditButton.innerText = "Edit Node";
        // Replace the existing button with the new button
        nodeButton.parentNode.replaceChild(nodeEditButton, nodeButton);
    }

    ////Create Delete button (if not yet existing)
    const deleteButton = document.getElementById("nodeDeleteButton");
    if(!deleteButton){
        var newButton = document.createElement("button");
        newButton.id = "nodeDeleteButton";
        newButton.innerText = "Delete Node";
        document.getElementById("deleteNodeDiv").appendChild(newButton);
        addEventListenerWithCheck(newButton, 'click', userDeleteNodeHandler)
    }
    else{
        //user delete node (Event Listener)
        addEventListenerWithCheck(deleteButton, 'click', userDeleteNodeHandler)
    }


    

    ////get current node properties
    //disable sliders
    disableSliders();

    //get name
    document.getElementById("stateName").value = editNode.name;
    //get Starting/Accepting/Rejecting property
    if(editNode.isStarting){
        document.getElementById("stateStarting").disabled = false;
        document.getElementById("stateStarting").checked = true;
    }
    if(editNode.isAccepting){
        document.getElementById("stateAccepting").disabled = false;
        document.getElementById("stateAccepting").checked = true;
    }
    if(editNode.isRejecting){
        document.getElementById("stateRejecting").disabled = false;
        document.getElementById("stateRejecting").checked= true;
    }

    //user submit node inputs (Event Listener)
    document.getElementById('nodeEditButton').addEventListener('click', function(){
        userEditNodeHandler();
    })

})

function userEditNodeHandler(){
    //close modal
    nodeModal.style.display = 'none';

    ////Name
    var newName = document.getElementById("stateName").value;
    //cyto
    cytoEditNode.style('label', newName);
    runLayout();
    //TM object (node)
    editNode.name = newName;

    ////Starting/Accepting/Rejecting property
    var isStarting = document.getElementById("stateStarting").checked;
    var isAccepting = document.getElementById("stateAccepting").checked;
    var isRejecting = document.getElementById("stateRejecting").checked;
    //catch accepting&rejecting case
    if(isAccepting && isRejecting){
        alert("A node cannot be accepting & rejecting at the same time")
        return;
    }

    //isStarting
    if (isStarting){
        //cyto
        cytoEditNode.style('background-color', 'darkgrey');
        cytoEditNode.style('border-width', 2);
        cytoEditNode.style('border-color', "black");
        //TM object
        turingMachine.startstate = editNode;
        editNode.isStarting = true;
    }
    else if(editNode.isStarting){
        //edit node was starting node but edit removed starting node property
        //cyto
        cytoEditNode.style('background-color', 'lightgrey');
        cytoEditNode.style('border-width', 0);
        //tm object
        editNode.isStarting = false;
        turingMachine.startstate = null;
    }

    //isAccepting
    if (isAccepting){
        //cyto
        cytoEditNode.style('background-color', 'limegreen');
        //TM object
        turingMachine.acceptstate = editNode;
        editNode.isAccepting = true;
    }
    else if(editNode.isAccepting){
        //edit node was accepting node but edit removed starting node property
        //cyto
        if(!isRejecting){
            cytoEditNode.style('background-color', 'lightgrey');
        }
        //tm object
        editNode.isAccepting = false;
        turingMachine.acceptstate = null;
    }

    //isRejecting
    if (isRejecting){
        //cyto
        cytoEditNode.style('background-color', 'red');
        //TM object
        turingMachine.rejectstate = editNode;
        editNode.isRejecting = true;
    }
    else if(editNode.isRejecting){
        //edit node was rejecting node but edit removed starting node property
        //cyto
        if(!isAccepting){
            cytoEditNode.style('background-color', 'lightgrey');
        }
        //tm object
        editNode.isRejecting = false;
        turingMachine.rejectstate = null;
    }
}

function userDeleteNodeHandler(){
    //close modal
    nodeModal.style.display = 'none';

    ////Delete in cyto
    cy.remove(cytoEditNode);

    ////delete from TM object
    //remove node
    turingMachine.states.delete(editNode);
    if(editNode.isStarting){
        turingMachine.startstate = null;
    }
    if(editNode.isAccepting){
        turingMachine.acceptstate = null;
    }
    if(editNode.isRejecting){
        turingMachine.rejectstate = null;
    }
    //remove all edges from / to this node
    let updatedDelta = new Map();
    for(const [key, value] of turingMachine.delta){
        if(key[0] !== editNode && value[0] !== editNode){
            updatedDelta.set(key, value)
        }
    }
    turingMachine.delta = updatedDelta;

}

//Helper: Disables sliders (avoid creating multiple starting/accep/.. nodes)
function disableSliders(){
    if(turingMachine.startstate !== null && turingMachine.startstate !== undefined){
        document.getElementById("stateStarting").disabled = true;
    }
    if(turingMachine.acceptstate !== null && turingMachine.acceptstate !== undefined){
        document.getElementById("stateAccepting").disabled = true;
    }
    if(turingMachine.rejectstate !== null && turingMachine.rejectstate !== undefined){
        document.getElementById("stateRejecting").disabled = true;
    }

    document.getElementById("stateStarting").checked = false;
    document.getElementById("stateAccepting").checked = false;
    document.getElementById("stateRejecting").checked = false;

}

//Helper: create eventlistener if not yet existent (avoids duplication of eventlisteners)
function addEventListenerWithCheck(element, eventType, listener){
    const existingListeners = element.__eventListeners || {};
    if(!existingListeners[eventType]){
        element.addEventListener(eventType, listener);
        existingListeners[eventType] = listener;
    }
}





//// ----------- Edge Edit
cy.on('tap', 'edge', function(event){
    ////Precalculations
    //save edge clicked on (global var)
    cytoEditEdge = event.target;

    //get edge TM object (delta)
    let fromNodeId = cytoEditEdge.source().id();
    let readToken = cytoEditEdge.data("readToken");
    editEdgeKey = turingMachine.getKeyByContent([turingMachine.getStatebyId(fromNodeId), readToken]);
    editEdgeContent = turingMachine.delta.get(editEdgeKey);
    
    //open Modal at click position
    const position = event.position;
    const edgeModal = document.getElementById('edgeModal');
    //get cytoscape window position
    const cytoWindow = document.querySelector('#cytoscape');
    const leftValue = parseInt(window.getComputedStyle(cytoWindow).getPropertyValue('left'), 10);
    const topValue = parseInt(window.getComputedStyle(cytoWindow).getPropertyValue('top'), 10);

    //display modal at node position
    edgeModal.style.paddingLeft = `${position.x + leftValue}px`
    edgeModal.style.paddingTop = `${position.y + topValue}px`;
    edgeModal.style.display = 'block';

    ////change nodeModal to edit style
    //replace "create edge" with "edit edge" button
    var edgeButton = document.getElementById("edgeButton");
    if(edgeButton){
        var edgeEditButton = document.createElement("button");
        edgeEditButton.id = "edgeEditButton";
        edgeEditButton.innerText = "Edit Edge";
        edgeButton.parentNode.replaceChild(edgeEditButton, edgeButton);
    }
    
    ////Create Delete button (if not yet existing)
    const deleteButton = document.getElementById("edgeDeleteButton");
    if(!deleteButton){
        var newButton = document.createElement("button");
        newButton.id = "edgeDeleteButton";
        newButton.innerText = "Delete Edge";
        document.getElementById("deleteEdgeDiv").appendChild(newButton);
        //event listener
        addEventListenerWithCheck(newButton, 'click', userDeleteEdgeHandler)
    }
    else{
        //event listener
        addEventListenerWithCheck(deleteButton, 'click', userDeleteEdgeHandler)
    }


    ////get current edge properties
    getCurrentEdgeProperties();

    addEventListenerWithCheck(document.getElementById("edgeEditButton"), "click", userEditEdgeHandler);
});
////user submit node inputs (Event Listener)
/*document.getElementById("edgeEditButton").addEventListener('click', function(){
    userEditEdgeHandler();
})*/

function getCurrentEdgeProperties(){
    //from State
    //Create Option to Change FromState (if not yet existing)
    const fromState = document.getElementById("fromState")
    if(!fromState){
        //if not: create it!
        const labelElement = document.createElement("label");
        labelElement.id = "fromStateLabel"
        labelElement.setAttribute("for", "fromState");
        labelElement.textContent = "From State: "
        const selectElement = document.createElement("select")
        selectElement.id = "fromState";
        //add to div
        document.getElementById("fromStateDiv").appendChild(labelElement);
        document.getElementById("fromStateDiv").appendChild(selectElement);
    }
    //create dropdown menu of existing states
    createDropdownMenues(document.getElementById("fromState"))
    document.getElementById("fromState").value = editEdgeKey[0].name;

    //to State
    createDropdownMenues(document.getElementById("toState"))
    document.getElementById("toState").value = editEdgeContent[0].name;

    //read Label
    document.getElementById("readLabel").value = editEdgeKey[1];

    //write Label
    document.getElementById("writeLabel").value = editEdgeContent[1];

    //tape Movement
    switch (editEdgeContent[2]){
        case "L":
            document.getElementById("tapeMovement").value = -1;
            break;
        case "N":
            document.getElementById("tapeMovement").value = 0;
            break;
        case "R":
            document.getElementById("tapeMovement").value = 1;
            break;       
    }
}

function userEditEdgeHandler(){
    //close modal
    edgeModal.style.display = 'none';

    ////Read User Input

    //fromNode
    //!for this to work properly, it is assumed that the states in turingMachine are ordered ascendingly by ID!
    let dropdown1 = document.getElementById("fromState");
    let newfromNode = turingMachine.getStatebyId(parseInt(dropdown1.selectedIndex));
    
    //toNode
    let dropdown2 = document.getElementById("toState");
    let newtoNode = turingMachine.getStatebyId(parseInt(dropdown2.selectedIndex));
    
    //readToken
    let readToken = document.getElementById("readLabel").value;

    //TapeMovement
    let tapeMovementValue = document.getElementById('tapeMovement').value;
    let tapeMovement = "N"
    if(parseInt(tapeMovementValue) === -1){
        tapeMovement = "L";
    }
    else if(parseInt(tapeMovementValue) === 1){
        tapeMovement = "R";
    }

    //writeToken
    let cyLabel = "";
    let writeToken;
    if(document.getElementById('writeLabel').value !== ''){
        writeToken = document.getElementById('writeLabel').value;
        cyLabel = "R: " + readToken + " W: " + writeToken + " | " + tapeMovement;
    }
    else{
        writeToken = undefined;
        cyLabel = "R: " + readToken + " | " + tapeMovement;
    }


    ////Edit TM object & cyto

    //TM object
    //remove old
    turingMachine.delta.delete(editEdgeKey);
    //create new
    const newEdgeKey = [newfromNode, readToken];
    const newEdgeValue = [newtoNode, writeToken, tapeMovement];
    turingMachine.delta.set(newEdgeKey, newEdgeValue);
    console.log(turingMachine.delta);

    //Cyto
    /*
    cytoEditEdge.data('source', newfromNode.id);
    cytoEditEdge.data('target', newtoNode.id);
    cytoEditEdge.data('readToken', readToken);
    cytoEditEdge.style('label', cyLabel);
*/
    //remove
    cy.remove(cytoEditEdge);
    //create new
    cyCreateEdge(newfromNode.id, newtoNode.id, cyLabel, readToken);

    //refresh();
    //runLayout();
}

function userDeleteEdgeHandler(){
    //close modal
    edgeModal.style.display = 'none';
    //delete in TM object
    turingMachine.delta.delete(editEdgeKey);
    //delete in cyto
    cy.remove(cytoEditEdge);
}


//////////////////////////////////////////////////////////////
//// ---------------------- Layout ---------------------- ////
//////////////////////////////////////////////////////////////

//specifies node (&edge) layout
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
function refresh(){
    var layoutOptions = {
        name:"grid",
    };
    var layout = cy.layout(layoutOptions);
    layout.run;
}
