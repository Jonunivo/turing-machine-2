import { cy, cyCreateEdge, runLayout, addEventListenerWithCheck} from "./Cytoscape.js";
import { turingMachine } from "./TuringMachine.js";
import {createDropdownMenues, disableSliders } from "./UserInput.js";

//////////////////////////////////////////////////////////////
//// -------------------- User Edit --------------------- ////
//////////////////////////////////////////////////////////////

//Globals
//editNode to save node clicked on to edit
var cytoEditNode;
var editNode;
//editEdge to save edge clicked on to edit
var cytoEditEdge;
var editEdgeKey
var editEdgeContent;

//// ----------- Node Edit
/**Node Edit works as follows:
 * User right click on node -> Open Edit Node Modal ->
 *      (1) User submit modal -> userEditNodeHandler() -> hide Modal
 *      (2) User delete Node -> userDeleteNodeHandler() -> hide Modal
 *      (3) User cancels modal -> hide Modal
 */


//Right click on Node to Edit node (opens Edit Node Modal)
cy.on('cxttap', 'node', function(event){

    //save node clicked on (global vars)
    cytoEditNode = event.target;
    editNode = turingMachine.getStatebyId(cytoEditNode.id());

    ////open Modal at click position
    //get click position
    const position = event.position;

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

/**
 * Handles the User editing a node (TM object & cyto node) & closes Modal
 * note: simmilar to userNodeInputHandler but more sophisticated
 */
function userEditNodeHandler(){
    //close modal
    nodeModal.style.display = 'none';

    ////Name
    var newName = document.getElementById("stateName").value;
    //cyto
    cytoEditNode.style('label', newName);
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
        turingMachine.startstate = undefined;
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

/**
 * Handles the User deleting a node (TM object & cyto node) & closes Modal
 * 
 */
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


//// ----------- Edge Edit
/**Edge Edit works as follows:
 * User right click on edge -> Open Edit Edge Modal ->
 *      (1) User submit modal -> userEditEdgeHandler() -> hide Modal
 *      (2) User delete Node -> userDeleteEdgeHandler() -> hide Modal
 *      (3) User cancels modal -> hide Modal
 */

//Right click on Node to Edit edge (opens Edit Edge Modal)
cy.on('cxttap', 'edge', function(event){
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

/**
 * Helper: that retrieves the Current Edge Properties to be displayed in Edge Modal
 */
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

/**
 * Handles the User editing an edge (TM object & cyto node) & closes Modal
 * note: simmilar to userEdgeInputHandler but more sophisticated
 */
function userEditEdgeHandler(){
    //close modal
    edgeModal.style.display = 'none';

    ////Read User Input

    //fromNode
    let dropdown1 = document.getElementById("fromState");
    let newfromNode = turingMachine.getStatebyName(dropdown1.value);
    
    //toNode
    let dropdown2 = document.getElementById("toState");
    let newtoNode = turingMachine.getStatebyName(dropdown2.value);
    
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
    let writeToken = "";
    if(document.getElementById('writeLabel').value !== ''){
        writeToken = document.getElementById('writeLabel').value;
        cyLabel = "R: " + readToken + " W: " + writeToken + " | " + tapeMovement;
    }
    else{
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

    //Cyto

    //remove
    cy.remove(cytoEditEdge);
    //create new
    cyCreateEdge(newfromNode.id, newtoNode.id, cyLabel, readToken);

}

/**
 * Handles the User deleting an edge (TM object & cyto node) & closes Modal
 * 
 */
function userDeleteEdgeHandler(){
    //close modal
    edgeModal.style.display = 'none';
    //delete in TM object
    turingMachine.delta.delete(editEdgeKey);
    //delete in cyto
    cy.remove(cytoEditEdge);
}