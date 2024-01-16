/*
  Author: Mauro Vogel
  Date: January 2024
  
  Description: 
    - Detects user action to edit&delete States & Transitions
    - Manages Edit modals & reads user input

  Dependencies/Imports:
    - Cytoscape.js     | cy Object & functions to create Edges
    - TuringMachine.js | global variable global turingMachine
    - UserInput.js     | functions to prepare modal & detect if in edit mode
    - SuperState.js    | Helper functions to edit edges from/to super states & to edit local TM object

  Exports:
    - variables editNode & cytoeditNode specifying which node is being edited

  Invariant to keep up:
    - Every state in a TM has a unique ID. Each Cytoscape node representing this state has the same ID.
*/

import { cy, cyCreateEdge, cyGrabifyNodes} from "./Cytoscape.js";
import { turingMachine } from "./TuringMachine.js";
import {createDropdownMenues, disableSliders, inEditMode, addEventListenerWithCheck} from "./UserInput.js";
import { editNodeLocalTM, getLocalTM, userEditSuperNodeHandler, userDeleteSuperNodeHandler, getRootTM, getAcceptSubTM, getStartSubTM } from "./SuperStates.js";

export { editNode, cytoEditNode }

//Globals
//editNode to save node clicked on to edit
var cytoEditNode;
var editNode;
//editEdge to save edge clicked on to edit
var cytoEditEdge;
//variables saved across multiple functions
var localEditEdgeKey;
var localEditEdgeContent;
var globalEditEdgeKey;
var globalEditEdgeContent;



//////////////////////////////////////////////////////////////
//// -------------------- Node Edit --------------------- ////
//////////////////////////////////////////////////////////////

/**Node Edit works as follows:
 * User click on node -> Open Edit Node Modal ->
 *      (1) User submit modal -> userEditNodeHandler() -> hide Modal
 *      (2) User delete Node -> userDeleteNodeHandler() -> hide Modal
 *      (3) User cancels modal -> hide Modal
 */

/**
 * EventListeners that detect a click on a node
 */
let clickTime = 0;
cy.on('mousedown', 'node', (event) =>{
    clickTime = Date.now();
})
//mouseup on node ("click")
cy.on('mouseup', 'node', (event) =>{
    clickTime = Date.now() - clickTime;
    //in edit mode & clicked not longer than 200ms (otherwise it is a loop edge creation)
    if(inEditMode() && clickTime < 200){
        clickEditNode(event);
    }
})

/**
 * Handles the click event on a node in edit mode. Opens the node modal at the clicked position
 * and prepares the Modal for node editing.
 * Handles both normal nodes and super nodes
 *
 * @param {Object} event - The click event.
 */
function clickEditNode(event){
    //save node clicked on (to global vars)
    cytoEditNode = event.target;
    editNode = turingMachine.getStateById(cytoEditNode.id());
    let localEditNode = getLocalTM().getStateById(cytoEditNode.id());

    //helpers for opening modals at click position
    const position = event.position;
    const cytoWindow = document.querySelector('#cytoscape');
    const leftValue = parseInt(window.getComputedStyle(cytoWindow).getPropertyValue('left'), 10);
    const topValue = parseInt(window.getComputedStyle(cytoWindow).getPropertyValue('top'), 10);


    //// Case 0: clicked on uneditable node
    //globally not accepting, but locally (-> local End State)
    if(editNode !== undefined && !editNode.isAccepting && localEditNode.isAccepting){
        return;
    }
    //globally not starting, but locally (-> local Start State)
    if(editNode !== undefined && !editNode.isStarting && localEditNode.isStarting){
        return;
    }
    

    //// Case 1: clicked on SuperNode
    if(editNode === undefined){
        //open superNode window & return
        editNode = localEditNode;
        
        //change button from "create node" to "edit node"
        let superNodeButton = document.getElementById("superNodeButton");
        if(superNodeButton){
            let nodeEditButton = document.createElement("button");
            nodeEditButton.id = "superNodeEditButton";
            nodeEditButton.innerText = "Edit State";
            nodeEditButton.className = "grey-button"
            // Replace the existing button with the new button
            superNodeButton.parentNode.replaceChild(nodeEditButton, superNodeButton);
        }
        //Create Delete button (if not yet existing)
        const deleteButton = document.getElementById("superNodeDeleteButton");
        if(!deleteButton){
            var newButton = document.createElement("button");
            newButton.id = "superNodeDeleteButton";
            newButton.innerText = "Delete State";
            newButton.className = "red-button";
            document.getElementById("deleteSuperNodeDiv").appendChild(newButton);
            addEventListenerWithCheck(newButton, 'click', userDeleteSuperNodeHandler)
        }
        else{
            //EventListener: user delete node (Event Listener)
            addEventListenerWithCheck(deleteButton, 'click', userDeleteSuperNodeHandler)
        }

        //get current node name
        document.getElementById("superStateName").value = editNode.name;

        //event listener for edit button, userEditSuperNodeHandler implemented in SuperStates.js
        addEventListenerWithCheck(document.getElementById('superNodeEditButton'), 'click', userEditSuperNodeHandler);

        ////open SuperNodeModal at node position
        const superNodeModal = document.getElementById('superNodeModal');
        superNodeModal.style.paddingLeft = `${position.x + leftValue}px`;
        let maxPaddingTop = Math.min(position.y + topValue, window.innerHeight-390);
        superNodeModal.style.paddingTop = `${maxPaddingTop}px`;
        superNodeModal.style.display = 'block';
        //focus on name field
        document.getElementById("superStateName").focus()
        return;
    }


    //// Case 2: clicked on normal node
    const nodeModal = document.getElementById('nodeModal');

    //change button from "create node" to "edit node"
    var nodeButton = document.getElementById("nodeButton");
    if(nodeButton){
        var nodeEditButton = document.createElement("button");
        nodeEditButton.id = "nodeEditButton";
        nodeEditButton.innerText = "Edit State";
        nodeEditButton.className = "grey-button";
        // Replace the existing button with the new button
        nodeButton.parentNode.replaceChild(nodeEditButton, nodeButton);
    }

    //Create Delete button (if not yet existing)
    const deleteButton = document.getElementById("nodeDeleteButton");
    if(!deleteButton){
        var newButton = document.createElement("button");
        newButton.id = "nodeDeleteButton";
        newButton.innerText = "Delete State";
        newButton.className = "red-button";
        document.getElementById("deleteNodeDiv").appendChild(newButton);
        addEventListenerWithCheck(newButton, 'click', userDeleteNodeHandler)
    }
    else{
        //Event Listener for Delete button
        addEventListenerWithCheck(deleteButton, 'click', userDeleteNodeHandler)
    }

    ////get current node properties
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

    //Event Listener for Submit button
    addEventListenerWithCheck(document.getElementById('nodeEditButton'), 'click', userEditNodeHandler);

    //display modal at node position
    nodeModal.style.paddingLeft = `${position.x + leftValue}px`;
    let maxPaddingTop = Math.min(position.y + topValue, window.innerHeight-390);
    nodeModal.style.paddingTop = `${maxPaddingTop}px`;
    nodeModal.style.display = 'block';
    //focus on name field
    document.getElementById("stateName").focus()
}


/**
 * Handles the User editing a node (TM object & cyto node) & closes Modal
 * note: simmilar to userNodeInputHandler but more sophisticated
 * called by user pressing "Edit Node" button
 * 
 */
function userEditNodeHandler(){
    //close modal
    nodeModal.style.display = 'none';

    ////Name
    var newName = document.getElementById("stateName").value;
    //catch name already exists
    if(newName !== editNode.name)
    for(const state of getLocalTM().states){
        if(state.name === newName){
            alert(`state with Name ${state.name} already exists, please choose a unique name`);
            nodeModal.style.display = 'block';
            return;
        }
    }
    //cyto
    cytoEditNode.style('label', newName);
    cytoEditNode.style('width', `${newName.length*10 + 10}px`)
    //Global TM object (node)
    editNode.name = newName;

    ////Starting/Accepting/Rejecting property
    var isStarting = document.getElementById("stateStarting").checked;
    var isAccepting = document.getElementById("stateAccepting").checked;
    var isRejecting = document.getElementById("stateRejecting").checked;
    //catch accepting&rejecting case
    if(isAccepting && isRejecting){
        alert("A state cannot be Accepting and Rejecting at the same time");
        nodeModal.style.display = 'block';
        return;
    }

    //booleans to save editing rejectset, parameters for editNodeLocalTM()
    let rejectAdded = false;
    let rejectDeleted = false;
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
        //edit node was accepting node but edit removed accept node property
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
        turingMachine.rejectstate.add(editNode);
        editNode.isRejecting = true;
        //parameter for editNodeLocalTM()
        rejectAdded = true;
    }
    else if(editNode.isRejecting){
        //edit node was rejecting node but edit removed reject node property
        //cyto
        if(!isAccepting){
            cytoEditNode.style('background-color', 'lightgrey');
        }
        //tm object
        editNode.isRejecting = false;
        turingMachine.rejectstate.delete(editNode);
        //parameter for editNodeLocalTM()
        rejectDeleted = true;
    }

    //edit localTM object
    editNodeLocalTM(editNode, rejectAdded, rejectDeleted);
    
    //Grabify nodes
    cyGrabifyNodes();


}



/**
 * Handles the User deleting a node (TM object & cyto node) & closes Modal
 * called by user pressing "Delete Node"
 * 
 */
function userDeleteNodeHandler(){
    //close modal
    nodeModal.style.display = 'none';

    ////Delete in cyto
    cy.remove(cytoEditNode);

    ////delete from global TM object
    //remove node
    turingMachine.states.delete(editNode);
    if(editNode.isStarting && (getLocalTM() == getRootTM())){
        turingMachine.startstate = null;
    }
    if(editNode.isAccepting && (getLocalTM() == getRootTM())){
        turingMachine.acceptstate = null;
    }
    if(editNode.isRejecting){
        turingMachine.rejectstate.delete(editNode);
    }
    //GlobalTM: remove all edges from / to this node
    let updatedDelta = new Map();
    for(const [key, value] of turingMachine.delta){
        if(key[0] !== editNode && value[0] !== editNode){
            updatedDelta.set(key, value)
        }
    }
    turingMachine.delta = updatedDelta;

    ////delete from local TM object
    const localTM = getLocalTM();
    editNode = localTM.getStateById(editNode.id)
    localTM.states.delete(editNode);
    if(editNode.isStarting){
        localTM.startstate = null;
    }
    if(editNode.isAccepting){
        localTM.acceptstate = null;
    }
    if(editNode.isRejecting){
        turingMachine.rejectstate.delete(editNode);
    }
    //remove all edges from/to this node
    updatedDelta = new Map();
    for(const [key, value] of localTM.delta){
        if(key[0] !== editNode && value[0] !== editNode){
            updatedDelta.set(key, value)
        }
    }
    localTM.delta = updatedDelta;

    //Grabify nodes
    cyGrabifyNodes();
}


//////////////////////////////////////////////////////////////
//// -------------------- Edge Edit --------------------- ////
//////////////////////////////////////////////////////////////

/**Edge Edit works as follows:
 * User right click on edge -> Open Edit Edge Modal ->
 *      (1) User submit modal -> userEditEdgeHandler() -> hide Modal
 *      (2) User delete Node -> userDeleteEdgeHandler() -> hide Modal
 *      (3) User cancels modal -> hide Modal
 */

/**
 * Handles the click event on a edge in edit mode. Opens the edge modal at the clicked position
 * and prepares the Modal for edge editing.
 *
 * @param {Object} event - The click event.
 */
cy.on('click', 'edge', function(event){
    //only if in edit mode
    if(inEditMode()){
        ////Precalculations
        //save edge clicked on (global var)
        cytoEditEdge = event.target;
        //local TM
        let localTM = getLocalTM();
        //get edge TM object (delta) (& put into global variables)
        
        //Local
        let localFromNodeId = cytoEditEdge.source().id();
        let localFromNode = localTM.getStateById(localFromNodeId);
        let readToken = cytoEditEdge.data("readToken");
        //!ATTENTION: getKeyByContent is problematic if multiple edges from the same state with same readToken exist
        //-> Value in "From" can be set wrong in getCurrentEdgeProperties()
        //does not have impact on actual edit, but might confuse User expecting it to be correct
        localEditEdgeKey = localTM.getKeyByContent([localFromNode, readToken]);
        localEditEdgeContent = localTM.delta.get(localEditEdgeKey);

        //Global
        let globalFromNodeId = localFromNodeId;
        let globalFromNode = turingMachine.getStateById(localFromNodeId);
        if(globalFromNode === undefined){
            //from node is super node
            globalFromNodeId = getAcceptSubTM(localFromNodeId);
            globalFromNode = turingMachine.getStateById(globalFromNodeId);
        }
        globalEditEdgeKey = turingMachine.getKeyByContent([globalFromNode, readToken]);
        globalEditEdgeContent = turingMachine.delta.get(globalEditEdgeKey);

        
        ////prepare modal at node position
        const position = event.position;
        const edgeModal = document.getElementById('edgeModal');
        //get cytoscape window position
        const cytoWindow = document.querySelector('#cytoscape');
        const leftValue = parseInt(window.getComputedStyle(cytoWindow).getPropertyValue('left'), 10);
        const topValue = parseInt(window.getComputedStyle(cytoWindow).getPropertyValue('top'), 10);
        edgeModal.style.paddingLeft = `${position.x + leftValue}px`
        let maxPaddingTop = Math.min(position.y + topValue, window.innerHeight-410);
        edgeModal.style.paddingTop = `${maxPaddingTop}px`;

        ////replace "create edge" with "edit edge" button
        var edgeButton = document.getElementById("edgeButton");
        if(edgeButton){
            var edgeEditButton = document.createElement("button");
            edgeEditButton.id = "edgeEditButton";
            edgeEditButton.innerText = "Edit Transition";
            edgeEditButton.className = "grey-button";
            edgeButton.parentNode.replaceChild(edgeEditButton, edgeButton);
        }
        
        ////Create Delete button (if not yet existing)
        const deleteButton = document.getElementById("edgeDeleteButton");
        if(!deleteButton){
            var newButton = document.createElement("button");
            newButton.id = "edgeDeleteButton";
            newButton.innerText = "Delete Transition";
            newButton.className = "red-button";
            document.getElementById("deleteEdgeDiv").appendChild(newButton);
            //event listener for delete button
            addEventListenerWithCheck(newButton, 'click', userDeleteEdgeHandler)
        }
        else{
            //event listener for delete button
            addEventListenerWithCheck(deleteButton, 'click', userDeleteEdgeHandler)
        }

        ////get current edge properties
        getCurrentEdgeProperties();

        //Event listener for edit button
        addEventListenerWithCheck(document.getElementById("edgeEditButton"), "click", userEditEdgeHandler);

        //Grabify nodes
        cyGrabifyNodes();

        //display modal
        edgeModal.style.display = 'block';
        //focus on readLabel
        document.getElementById("readLabel").focus()

    }

});

/**
 * Helper: that retrieves the Current Edge Properties to be displayed in Edge Modal
 */
function getCurrentEdgeProperties(){
    ////from State
    const fromState = document.getElementById("fromState")
    if(!fromState){
        const labelElement = document.createElement("label");
        labelElement.id = "fromStateLabel"
        labelElement.setAttribute("for", "fromState");
        labelElement.textContent = "From: "
        const selectElement = document.createElement("select")
        selectElement.id = "fromState";
        //add to div
        document.getElementById("fromStateDiv").appendChild(labelElement);
        document.getElementById("fromStateDiv").appendChild(selectElement);
    }
    //create dropdown menu of existing states
    createDropdownMenues(document.getElementById("fromState"))
    document.getElementById("fromState").value = localEditEdgeKey[0].name;

    ////to State
    createDropdownMenues(document.getElementById("toState"))
    document.getElementById("toState").value = localEditEdgeContent[0].name;

    ////read Label
    if(localEditEdgeKey[1] === 'else'){
        document.getElementById("readLabelElse").checked = true;
        document.getElementById("readLabel").value = '';
        document.getElementById("readLabel").style.display = "none";
    }
    else{
        document.getElementById("readLabelElse").checked = false;
        document.getElementById("readLabel").value = localEditEdgeKey[1];
        document.getElementById("readLabel").style.display = '';
    }

    ////write Label
    if(localEditEdgeContent[1] === 'nothing'){
        //write Nothing was eneabled
        document.getElementById("writeLabel").value = '';
        document.getElementById('writeLabelNothing').checked = true;
        document.getElementById("writeLabel").style.display = "none";
    }
    else{
        document.getElementById("writeLabel").value = localEditEdgeContent[1];
        document.getElementById('writeLabelNothing').checked = false;
        document.getElementById("writeLabel").style.display = '';
    }

    ////tape Movement
    switch (localEditEdgeContent[2]){
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
    //Tape Movement slider input info
    const slider = document.getElementById("tapeMovement");
    const sliderValue = document.getElementById("slider-value");
    const value = parseFloat(slider.value);
    sliderValue.textContent = value === -1 ? "⮜" : value === 0 ? "⯀" : "➤";
    sliderValue.className = value === -1 ? "left" : value === 0 ? "neutral" : "right";
}

/**
 * Handles the User editing an edge (TM object & cyto node) & closes Modal
 * note: simmilar to userEdgeInputHandler but more sophisticated
 * called by user pressing "Edit Edge" button
 * 
 */
function userEditEdgeHandler(){
    //close modal
    edgeModal.style.display = 'none';
    //get local TM
    let localTM = getLocalTM();

    ////Read User Input
    //fromNode (Local & Global TM)
    let dropdownfrom = document.getElementById("fromState");
    let localFromNode = localTM.getStateByName(dropdownfrom.options[dropdownfrom.selectedIndex].textContent);
    let fromNodeId = localFromNode.id;
    let globalFromNode = turingMachine.getStateById(fromNodeId)
    if (globalFromNode === undefined){
        //from node supernode (=not in global TM)
        globalFromNode = turingMachine.getStateById(getAcceptSubTM(fromNodeId));
    }
    
    //toNode (Local & Global TM)
    let dropdown = document.getElementById("toState")
    let localToNode = localTM.getStateByName(dropdown.options[dropdown.selectedIndex].textContent);
    let toNodeId = localToNode.id;
    let globalToNode = turingMachine.getStateById(toNodeId);
    if(globalToNode === undefined){
        //to node supernode (=not in global TM)
        globalToNode = turingMachine.getStateById(getStartSubTM(toNodeId));
    }
    
    //readToken
    let readToken = document.getElementById("readLabel").value;
    //'else'
    if(document.getElementById("readLabelElse").checked){
        readToken = 'else';
    }

    //TapeMovement
    let tapeMovementValue = document.getElementById('tapeMovement').value;
    let tapeMovement = "N"
    let labelMove = "⯀";
    if(parseInt(tapeMovementValue) === -1){
        tapeMovement = "L";
        labelMove = "⮜";
    }
    else if(parseInt(tapeMovementValue) === 1){
        tapeMovement = "R";
        labelMove = "➤";
    }

    //writeToken
    let cyLabel = "";
    let writeToken = "nothing";
    if(!document.getElementById('writeLabelNothing').checked){
        //write
        writeToken = document.getElementById('writeLabel').value;
        cyLabel = "🔍 " + readToken + "  | ✎ " + writeToken + " | " + labelMove;
    }
    else{
        //don't write
        cyLabel = "🔍 " + readToken + " | " + labelMove;
        writeToken = "nothing";
    }


    ////Edit Global & Local TM object & Cyto edge

    try{
        //! bad design, but it works
        //catch Edge with this readLabel already exists
        //if Error (getKeyByContent not found) -> all good
        localTM.getKeyByContent([localFromNode, readToken])
        if(localEditEdgeKey[1] === readToken){
            //if it is the Edge we're about to edit -> all good -> Throw error
            throw Error;
        }
        //No Error thrown: alert user as he is trying to create Edge with readLabel that already exists
        alert(`Transition with readLabel ${readToken} from this state already exists`);
        edgeModal.style.display = 'block';
        return;

    }
    catch{
        //can be left empty
    }
    //edge does not yet exist, edit allowed:

    //Global TM object
    //remove old
    turingMachine.delta.delete(globalEditEdgeKey);
    //create new
    turingMachine.createTransition(globalFromNode, readToken, globalToNode, writeToken, tapeMovement);

    //Local TM object
    //remove old
    localTM.delta.delete(localEditEdgeKey);
    //create new
    localTM.createTransition(localFromNode, readToken, localToNode, writeToken, tapeMovement);

    ////Cyto
    //remove old
    cy.remove(cytoEditEdge);
    //create new
    cyCreateEdge(localFromNode.id, localToNode.id, cyLabel, readToken);
}

/**
 * Handles the User deleting an edge (TM object & cyto node) & closes Modal
 * called by user pressing "Delete Edge" button
 * 
 */
function userDeleteEdgeHandler(){
    //close modal
    edgeModal.style.display = 'none';
    //delete in global TM object
    turingMachine.delta.delete(globalEditEdgeKey);
    //delete in local TM object
    getLocalTM().delta.delete(localEditEdgeKey);
    //delete in cyto
    cy.remove(cytoEditEdge);
}