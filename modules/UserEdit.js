import { cy, cyCreateEdge, runLayout, addEventListenerWithCheck, refresh, cyGrabifyNodes} from "./Cytoscape.js";
import { TuringMachine, turingMachine } from "./TuringMachine.js";
import {createDropdownMenues, disableSliders, inEditMode, userNodeInputHandler, userEdgeInputHandler } from "./UserInput.js";
import { editNodeLocalTM, getLocalTM, userEditSuperNodeHandler, getRootTM, getAcceptSubTM, getStartSubTM } from "./SuperStates.js";

export { editNode, cytoEditNode }
//////////////////////////////////////////////////////////////
//// -------------------- User Edit --------------------- ////
//////////////////////////////////////////////////////////////

//Globals
//editNode to save node clicked on to edit
var cytoEditNode;
var editNode;
//editEdge to save edge clicked on to edit
var cytoEditEdge;
var editEdgeKey;
var editEdgeKeyLocal;
var editEdgeContent;
var editEdgeContentLocal;

var localEditEdgeKey;
var localEditEdgeContent;
var globalEditEdgeKey;
var globalEditEdgeContent;




//// ----------- Node Edit
/**Node Edit works as follows:
 * User right click on node -> Open Edit Node Modal ->
 *      (1) User submit modal -> userEditNodeHandler() -> hide Modal
 *      (2) User delete Node -> userDeleteNodeHandler() -> hide Modal
 *      (3) User cancels modal -> hide Modal
 */
let clickTime = 0;
//mousedown on node
cy.on('mousedown', 'node', (event) =>{
    clickTime = Date.now();
})
//mouseup on node ("click")
cy.on('mouseup', 'node', (event) =>{
    clickTime = Date.now() - clickTime;
    //in edit mode & clicked not longer than 200ms (otherwise it is a loop edge creation)
    if(inEditMode() && clickTime < 200){
        console.log("clicked on node");
        clickEditNode(event);
    }
})
function clickEditNode(event){
    //save node clicked on (global vars)
    cytoEditNode = event.target;

    editNode = turingMachine.getStatebyId(cytoEditNode.id());
    let localEditNode = getLocalTM().getStatebyId(cytoEditNode.id());

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
            nodeEditButton.innerText = "Zustand bearbeiten";
            // Replace the existing button with the new button
            superNodeButton.parentNode.replaceChild(nodeEditButton, superNodeButton);
        }

        //event listener, userEditSuperNodeHandler implemented in SuperStates.js
        addEventListenerWithCheck(document.getElementById('superNodeEditButton'), 'click', userEditSuperNodeHandler);

        //open modal
        superNodeModal.style.display = 'block';
        return;
    }

    //// Case 2: clicked on normal node

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
    nodeModal.style.paddingLeft = `${position.x + leftValue}px`;
    let maxPaddingTop = Math.min(position.y + topValue, window.innerHeight-390);
    nodeModal.style.paddingTop = `${maxPaddingTop}px`;
    nodeModal.style.display = 'block';



    ////change button from "create node" to "edit node"
    var nodeButton = document.getElementById("nodeButton");
    if(nodeButton){
        var nodeEditButton = document.createElement("button");
        nodeEditButton.id = "nodeEditButton";
        nodeEditButton.innerText = "Zustand bearbeiten";
        // Replace the existing button with the new button
        nodeButton.parentNode.replaceChild(nodeEditButton, nodeButton);
    }

    ////Create Delete button (if not yet existing)
    const deleteButton = document.getElementById("nodeDeleteButton");
    if(!deleteButton){
        var newButton = document.createElement("button");
        newButton.id = "nodeDeleteButton";
        newButton.innerText = "Zustand löschen";
        newButton.className = "red-button";
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
    addEventListenerWithCheck(document.getElementById('nodeEditButton'), 'click', userEditNodeHandler);

}

//Right click on Node to Edit node (opens Edit Node Modal)
/*
cy.on('click', 'node', function(event){
    //only if in edit mode
    if(inEditMode() && clickTime < 200){
        
    }
})
*/

/**
 * Handles the User editing a node (TM object & cyto node) & closes Modal
 * note: simmilar to userNodeInputHandler but more sophisticated
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
    refresh()
    //Global TM object (node)
    editNode.name = newName;



    ////Starting/Accepting/Rejecting property
    var isStarting = document.getElementById("stateStarting").checked;
    var isAccepting = document.getElementById("stateAccepting").checked;
    var isRejecting = document.getElementById("stateRejecting").checked;
    //catch accepting&rejecting case
    if(isAccepting && isRejecting){
        alert("Ein Zustand kann nicht gleichzeitig akzeptierend und verwerfend sein")
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

    //edit localTM object
    editNodeLocalTM(editNode);

    ////logging
    console.log("---NODE EDITED---")
    console.log("global TM ", turingMachine);
    console.log('local TM ', getLocalTM());


    //Grabify nodes
    cyGrabifyNodes();


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

    ////delete from global TM object
    //remove node
    turingMachine.states.delete(editNode);
    if(editNode.isStarting && (getLocalTM() == getRootTM())){
        turingMachine.startstate = null;
    }
    if(editNode.isAccepting && (getLocalTM() == getRootTM())){
        turingMachine.acceptstate = null;
    }
    if(editNode.isRejecting && (getLocalTM() == getRootTM())){
        turingMachine.rejectstate = null;
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
    editNode = localTM.getStatebyId(editNode.id)
    localTM.states.delete(editNode);
    if(editNode.isStarting){
        localTM.startstate = null;
    }
    if(editNode.isAccepting){
        localTM.acceptstate = null;
    }
    if(editNode.isRejecting){
        localTM.rejectstate = null;
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


//// ----------- Edge Edit
/**Edge Edit works as follows:
 * User right click on edge -> Open Edit Edge Modal ->
 *      (1) User submit modal -> userEditEdgeHandler() -> hide Modal
 *      (2) User delete Node -> userDeleteEdgeHandler() -> hide Modal
 *      (3) User cancels modal -> hide Modal
 */

//Click on Edge to Edit edge (opens Edit Edge Modal)

cy.on('click', 'edge', function(event){
    //only if in edit mode
    if(inEditMode()){
        ////Precalculations
        //save edge clicked on (global var)
        cytoEditEdge = event.target;

        //local TM
        let localTM = getLocalTM();

        //get edge TM object (delta) (& put into global variable)
        //Local
        let localFromNodeId = cytoEditEdge.source().id();
        let localFromNode = localTM.getStatebyId(localFromNodeId);
        let readToken = cytoEditEdge.data("readToken");
        localEditEdgeKey = localTM.getKeyByContent([localFromNode, readToken]);
        localEditEdgeContent = localTM.delta.get(localEditEdgeKey);

        //Global
        let globalFromNodeId = localFromNodeId;
        let globalFromNode = turingMachine.getStatebyId(localFromNodeId);
        if(globalFromNode === undefined){
            //from node is super node
            globalFromNodeId = getAcceptSubTM(localFromNodeId);
            globalFromNode = turingMachine.getStatebyId(globalFromNodeId);
        }
        globalEditEdgeKey = turingMachine.getKeyByContent([globalFromNode, readToken]);
        globalEditEdgeContent = turingMachine.delta.get(globalEditEdgeKey);

        
        //open Modal at click position
        const position = event.position;
        const edgeModal = document.getElementById('edgeModal');
        //get cytoscape window position
        const cytoWindow = document.querySelector('#cytoscape');
        const leftValue = parseInt(window.getComputedStyle(cytoWindow).getPropertyValue('left'), 10);
        const topValue = parseInt(window.getComputedStyle(cytoWindow).getPropertyValue('top'), 10);

        //display modal at node position
        edgeModal.style.paddingLeft = `${position.x + leftValue}px`
        let maxPaddingTop = Math.min(position.y + topValue, window.innerHeight-410);
        edgeModal.style.paddingTop = `${maxPaddingTop}px`;
        edgeModal.style.display = 'block';

        ////change nodeModal to edit style
        //replace "create edge" with "edit edge" button
        var edgeButton = document.getElementById("edgeButton");
        if(edgeButton){
            var edgeEditButton = document.createElement("button");
            edgeEditButton.id = "edgeEditButton";
            edgeEditButton.innerText = "Übergang bearbeiten";
            edgeEditButton.style.width = "180px";
            edgeButton.parentNode.replaceChild(edgeEditButton, edgeButton);
        }
        
        ////Create Delete button (if not yet existing)
        const deleteButton = document.getElementById("edgeDeleteButton");
        if(!deleteButton){
            var newButton = document.createElement("button");
            newButton.id = "edgeDeleteButton";
            newButton.innerText = "Übergang löschen";
            newButton.className = "red-button";
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

        //Grabify nodes
        cyGrabifyNodes();
    }

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
        labelElement.textContent = "Von: "
        const selectElement = document.createElement("select")
        selectElement.id = "fromState";
        //add to div
        document.getElementById("fromStateDiv").appendChild(labelElement);
        document.getElementById("fromStateDiv").appendChild(selectElement);
    }
    //create dropdown menu of existing states
    createDropdownMenues(document.getElementById("fromState"))
    document.getElementById("fromState").value = localEditEdgeKey[0].name;

    //to State
    createDropdownMenues(document.getElementById("toState"))
    document.getElementById("toState").value = localEditEdgeContent[0].name;

    //read Label
    if(localEditEdgeKey[1] === 'else'){
        document.getElementById("readLabelElse").checked = true;
        document.getElementById("readLabel").value = '';
        document.getElementById("readLabel").style.display = "none";
    }
    else{
        document.getElementById("readLabelElse").checked = false;
        document.getElementById("readLabel").value = localEditEdgeKey[1];
    }

    //write Label
    if(localEditEdgeContent[1] === 'nothing'){
        //write Nothing was eneabled
        document.getElementById("writeLabel").value = '';
        document.getElementById('writeLabelNothing').checked = true;
        document.getElementById("writeLabel").style.display = "none";
    }
    else{
        document.getElementById("writeLabel").value = localEditEdgeContent[1];
        document.getElementById('writeLabelNothing').checked = false;
    }

    //tape Movement
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
 */
function userEditEdgeHandler(){
    //close modal
    edgeModal.style.display = 'none';

    ////Read User Input

    //get local TM
    let localTM = getLocalTM();

    //fromNode (Local & Global TM)
    let dropdownfrom = document.getElementById("fromState");
    let localFromNode = localTM.getStatebyName(dropdownfrom.options[dropdownfrom.selectedIndex].textContent);
    let fromNodeId = localFromNode.id;
    let globalFromNode = turingMachine.getStatebyId(fromNodeId)
    if (globalFromNode === undefined){
        //from node supernode (=not in global TM)
        globalFromNode = turingMachine.getStatebyId(getAcceptSubTM(fromNodeId));
    }
    
    //toNode (Local & Global TM)
    let dropdown = document.getElementById("toState")
    let localToNode = localTM.getStatebyName(dropdown.options[dropdown.selectedIndex].textContent);
    let toNodeId = localToNode.id;
    let globalToNode = turingMachine.getStatebyId(toNodeId);
    if(globalToNode === undefined){
        //to node supernode (=not in global TM)
        globalToNode = turingMachine.getStatebyId(getStartSubTM(toNodeId));
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


    ////Edit Global & Local TM object

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
    //remove
    cy.remove(cytoEditEdge);
    //create new
    cyCreateEdge(localFromNode.id, localToNode.id, cyLabel, readToken);


    ////Logging
    console.log('---Edge Edited---');

}

/**
 * Handles the User deleting an edge (TM object & cyto node) & closes Modal
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




