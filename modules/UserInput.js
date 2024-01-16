/*
  Author: Mauro Vogel
  Date: January 2024
  
  Description: 
    - Detects user action to create States & Transitions
    - Manages Creation modals & reads user input
    - Helper Function that creates dropdown menu for from&to states in Edge modal.
    - upholds the node Id invariant

  Dependencies/Imports:
    - Cytoscape.js     | cy Object & functions to create Nodes & Edges
    - TuringMachine.js | global variable global turingMachine
    - SuperState.js    | Helper functions to create edges from/to super states & to edit local TM object

  Exports:
    - createDropdownMenues
    - functions to uphold node Id invariant
    - Helper function that disables sliders in Node modal
    - Helper function detecting if in edit mode
    - Helper function that avoid duplicating EventListeners

  Invariant to keep up:
    - Every state in a TM has a unique ID. Each Cytoscape node representing this state has the same ID.

*/


import { cy, cyCreateNode, cyCreateEdge, cyGrabifyNodes} from "./Cytoscape.js";
import { turingMachine } from "./TuringMachine.js";
import { getLocalTM, getRootTM, getAcceptSubTM, getStartSubTM } from "./SuperStates.js";

export {createDropdownMenues, nodePresetHelper, nodePresetReset, disableSliders, inEditMode, addEventListenerWithCheck};


//////////////////////////////////////////////////////////////
//// ------------------ User Creation ------------------- ////
//////////////////////////////////////////////////////////////

//globals
//Id for node creation (cyto id & turingmaschine id)
var nodeId = 0;
//fromNode at Edge Creation (used to safe on which node the user clicked)
var fromNode;
//createNode Position
var position;
//saves node user drags mouse from across multiple functions
var dragFromNode = null;
//saves node user drags mouse to across multiple functions
var dragToNode = null;
//timer variable used to distinguish a click from a dragging
var waitForDragging = 0;


//// ----------- Node Creation
/**Node Creation works as follows:
 * User click on canvas -> Open Create Node Modal ->
 *      (1) User submit modal -> userNodeInputHandler() -> hide Modal
 *      (2) User cancels modal -> hide Modal
 */


/**
 * EventListener to the Cytoscape canvas ('cy') that triggers node creation in edit mode.
 * Displays the node creation modal at the clicked position and disables sliders.
 * Replaces the "Edit node" button with the "Create state" button.
 * Removes the delete node button if it exists.
 * 
 * @param {Event} event - The click event on the Cytoscape canvas.
 */
cy.on('click', (event) => {
    //only allow in editMode (& click on canvas)
    if(inEditMode() && event.target === cy){
        position = event.position;
        const nodeModal = document.getElementById('nodeModal');

        ////Prepare Modal content
        //change button from "edit node" to "create node" (if needed) & add eventlistener
        var nodeEditButton = document.getElementById("nodeEditButton");
        var nodeButton = document.createElement("button");
        nodeButton.id = "nodeButton";
        nodeButton.innerText = "Create state";
        nodeButton.className = "green-button";
        if(nodeEditButton){
            nodeEditButton.parentNode.replaceChild(nodeButton, nodeEditButton);
        }
        addEventListenerWithCheck(document.getElementById('nodeButton'), 'click', userNodeInputHandler)

        //disable sliders
        disableSliders();

        //remove delete node button (if exists)
        let deleteButton = document.getElementById("nodeDeleteButton");
        if(deleteButton){
            document.getElementById("deleteNodeDiv").removeChild(deleteButton);
        }

        
        ////Determine position of Modal & display it
        const cytoWindow = document.querySelector('#cytoscape');
        const leftValue = parseInt(window.getComputedStyle(cytoWindow).getPropertyValue('left'), 10);
        const topValue = parseInt(window.getComputedStyle(cytoWindow).getPropertyValue('top'), 10);
        //display modal at click position (ensure not below window)
        nodeModal.style.paddingLeft = `${position.x + leftValue}px`
        let maxPaddingTop = Math.min(position.y + topValue, window.innerHeight-350);
        nodeModal.style.paddingTop = `${maxPaddingTop}px`;
        nodeModal.style.display = 'block';
    }
});

/**
 * Reads user input from NodeModal & creates Node user requested (Cytoscape & TM object) & closes modal
 * ensures NodeId is the same for cyto nodes as for TM nodes.
 * catch: User tries to create State that is Accepting & Rejecting
 * catch: Name of state already exists
 */
function userNodeInputHandler(){
    //Close the modal
    nodeModal.style.display = 'none';

    //get local TM
    let localTM = getLocalTM();
    
    //Read user input
    let stateName = document.getElementById('stateName').value;
    let isStartingState = document.getElementById("stateStarting").checked === true;
    let isAcceptingState = document.getElementById("stateAccepting").checked === true;
    let isRejectingState = document.getElementById("stateRejecting").checked === true;
    //catch accepting & rejecting case
    if(isAcceptingState && isRejectingState){
        alert("A state cannot be Accepting and Rejecting at the same time");
        nodeModal.style.display = 'block';
        return;
    }
    //catch name already exists
    for(const state of localTM.states){
        if(state.name === stateName){
            alert(`state with Name ${state.name} already exists, please choose a unique name`);
            nodeModal.style.display = 'block';
            return;
        }
    }

    //// --- CORE --- ////
    //create cyto node at click position
    cyCreateNode(nodeId, stateName, position.x, position.y, isStartingState, isAcceptingState, isRejectingState);
    
    //create node in Global TM
    if(getRootTM() === localTM){
        //in root -> set global start/accept state
        turingMachine.createState(nodeId, stateName, isStartingState, isAcceptingState, isRejectingState);
    }
    else{
        turingMachine.createState(nodeId, stateName, false, false, isRejectingState);
    }
    
    //create node in Local TM
    localTM.createState(nodeId, stateName, isStartingState, isAcceptingState, isRejectingState);

    //adjust nodeId
    nodeId++;

    /////////////////////
    //Grabify nodes
    cyGrabifyNodes();
}
/**
 * EventListener to the "Cancel" button in the node modal.
 * Hides the node modal when the "Cancel" button is clicked.
 */
document.getElementById("cancelButton").addEventListener('click', function(){
    nodeModal.style.display = 'none';
})



/**
 * Helper function for generating unique node IDs from outside of this module.
 * Increments the nodeId by 1 and returns the updated value.
 *
 * @return {number} The updated nodeId value.
 */
function nodePresetHelper(){
    nodeId = nodeId + 1;
    return nodeId;
}
/**
 * Helper function for resetting nodeId from outside of this module
 *
 */
function nodePresetReset(){
    nodeId = 0;
}

//// ----------- Edge Creation
/**
 * Edge Creation works as follows:
 * User clicks on node -> Open Create Edge Modal ->
 *      (1) User submit modal -> userEdgeInputHandler() -> hide Modal
 *      (2) User cancels modal -> hide Modal
 */


/**
 * EventListener that saves the node the user drags from.
 */
cy.on('mousedown', 'node', (event) =>{
    dragFromNode = event.target;
    //start dragging timer
    waitForDragging = Date.now();
})

/**
 * EventListener that saves the node the user drags to.
 */
cy.on('mouseup', 'node', (event) =>{
    dragToNode = event.target;
    //stop dragging timer
    waitForDragging = Date.now() - waitForDragging;
    if(dragFromNode === dragToNode){
        //trying to create loop edge?
        //user held mouse button for at least 300ms
        if(waitForDragging > 300){
            dragCreateEdge(event);
        }
    }
    else{
        dragCreateEdge(event);
    }
});

/**
 * Handles the initiation of the edge creation process.
 * Opens the edge creation modal & sets from & to state according to draggin behaviour
 * Preparing and displaying the edge modal at the click position.
 *
 * @param {Event} event - The event triggered user drops mouse on.
 */
function dragCreateEdge(event){
    //only allow if in Edit mode
    if(inEditMode()){
        //save from node (TM) (to global var)
        fromNode = getLocalTM().getStateById(dragFromNode.id());
        dragToNode = event.target;

        
        
        //// Prepare Modal Content
        const edgeModal = document.getElementById('edgeModal');
        //fromState
        const fromState = document.getElementById("fromState")
        if(!fromState){
            //if not: create it!
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

        //create dropdown menu for fromState
        createDropdownMenues(document.getElementById("fromState"))
        document.getElementById("fromState").value = fromNode.name;

        //create dropdown menu for toState
        createDropdownMenues(document.getElementById("toState"))
        var toNode = getLocalTM().getStateById(dragToNode.id());
        document.getElementById("toState").value = toNode.name;

        //slider input show symbol
        const slider = document.getElementById("tapeMovement");
        const sliderValue = document.getElementById("slider-value");
        const value = parseFloat(slider.value);
        sliderValue.textContent = value === -1 ? "⮜" : value === 0 ? "⯀" : "➤";
        sliderValue.className = value === -1 ? "left" : value === 0 ? "neutral" : "right";

        //change button from "edit node" to "create node" (if necessary)
        var edgeEditButton = document.getElementById("edgeEditButton");
        var edgeButton = document.createElement("button");
        edgeButton.id = "edgeButton";
        edgeButton.innerText = "Create Edge";
        edgeButton.className = "grey-button";
        if(edgeEditButton){
            //replace if needed
            edgeEditButton.parentNode.replaceChild(edgeButton, edgeEditButton);
        }
        //remove delete edge button (if exists)
        const deleteButton = document.getElementById("edgeDeleteButton");
        if(deleteButton){
            document.getElementById("deleteEdgeDiv").removeChild(deleteButton);
        }

        //Event Listener for confirm button
        addEventListenerWithCheck(document.getElementById("edgeButton"), 'click', userEdgeInputHandler)


        //// Display Modal a click position
        const position = event.position;
        //get cytoscape window position
        const cytoWindow = document.querySelector('#cytoscape');
        const leftValue = parseInt(window.getComputedStyle(cytoWindow).getPropertyValue('left'), 10);
        const topValue = parseInt(window.getComputedStyle(cytoWindow).getPropertyValue('top'), 10);

        edgeModal.style.paddingLeft = `${position.x + leftValue}px`
        let maxPaddingTop = Math.min(position.y + topValue, window.innerHeight-350);
        edgeModal.style.paddingTop = `${maxPaddingTop}px`;
        edgeModal.style.display = 'block';
    }
}


/**
 * Reads user input from EdgeModal & creates Edge user requested (Cytoscape & TM object) & closes modal
 *
 */
function userEdgeInputHandler(){
    //Close the modal
    edgeModal.style.display = 'none';
    //get local TM
    let localTM = getLocalTM();

    //// read user input

    //get fromNode (Local & Global TM)
    let dropdownfrom = document.getElementById("fromState");
    let localFromNode = localTM.getStateByName(dropdownfrom.options[dropdownfrom.selectedIndex].textContent);
    let fromNodeId = localFromNode.id;
    let globalFromNode = turingMachine.getStateById(fromNodeId)
    if (globalFromNode === undefined){
        //from node supernode (=not in global TM)
        globalFromNode = turingMachine.getStateById(getAcceptSubTM(fromNodeId));
    }
    
    //get toNode (Local & Global TM)
    let dropdown = document.getElementById("toState")
    let localToNode = localTM.getStateByName(dropdown.options[dropdown.selectedIndex].textContent);
    let toNodeId = localToNode.id;
    let globalToNode = turingMachine.getStateById(toNodeId);
    if(globalToNode === undefined){
        //to node supernode (=not in global TM)
        globalToNode = turingMachine.getStateById(getStartSubTM(toNodeId));
    }

    //get readLabel
    let readLabel = document.getElementById('readLabel').value;
    if(document.getElementById("readLabelElse").checked){
        readLabel = 'else';
    }

    //get tapeMovement
    let tapeMovementValue = document.getElementById('tapeMovement').value;
    let tapeMovement = "N"
    let labelMove = "⯀";
    if(parseInt(tapeMovementValue) === -1){
        tapeMovement = "L";
        labelMove = "⮜"
    }
    else if(parseInt(tapeMovementValue) === 1){
        tapeMovement = "R";
        labelMove = "➤"
    }
    else{
        tapeMovement = "N";
    }

    //get writeLabel
    let cyLabel = "";
    let writeLabel = 'nothing';
    if(!document.getElementById('writeLabelNothing').checked){
        writeLabel = document.getElementById('writeLabel').value;
        cyLabel = "🔍 " + readLabel + "  | ✎ " + writeLabel + " | " + labelMove;
    }
    else{
        //write nothing checked (dont write)
        cyLabel = "🔍 " + readLabel + " | " + labelMove;
        writeLabel = 'nothing';
    }

    //// --- CORE --- ////

    try{
        //! bad design, but it works
        //catch Edge with this readLabel already exists
        localTM.getKeyByContent([localFromNode, readLabel])

        //edge with this readLabel from this state does already exist!
        alert(`Transition with readLabel ${readLabel} from this state already exists`);
        edgeModal.style.display = 'block';
        return;

    }
    catch{
        //can be left empty
    }
    //edge does not yet exist:
    //create Edge Cytoscape
    cyCreateEdge(`${fromNodeId}`, `${toNodeId}`, cyLabel, readLabel);

    //create Edge in Global TM
    turingMachine.createTransition(globalFromNode, readLabel, globalToNode, writeLabel, tapeMovement);
    
    //create Edge in Local TM
    localTM.createTransition(localFromNode, readLabel, localToNode, writeLabel, tapeMovement);



    //////////////////////
}

/**
 * EventListener to the "Cancel" button in the edge modal.
 * Hides the edge modal when the "Cancel" button is clicked.
 */
document.getElementById("cancelButton2").addEventListener('click', function(){
    dragFromNode = null;
    dragToNode = null;
    edgeModal.style.display = 'none';
})



//////////////////////////////////////////////////////////////
//// --------------------- Helpers ---------------------- ////
//////////////////////////////////////////////////////////////
/**
 * 
 * Helper: Creates the dropdown menu for EdgeModal with all nodes as options
 * 
 * @param {Object} dropdown - the dropdown html object in question
 */
function createDropdownMenues(dropdown){
    //remove all dropdown elements created earlier
    while(dropdown.options.length > 0){
        dropdown.remove(0);
    }
    //fetch options from existing nodeIds
    let options = [];
    for(const state of getLocalTM().states){
        options.push(state.name);
    }
    //create HTML elements from options
    for(let option of options){
        const optionElement = document.createElement('option');
        option = option.replace(/ /g, "﹍");
        const textNode = document.createTextNode(option);
        optionElement.appendChild(textNode);
        dropdown.appendChild(optionElement);
    }
}


/**
 * Helper: that disables sliders in CreateNode/EditNode Modal (avoids creating multiple starting, accepting, rejecting states)
 */
function disableSliders(){
    let localTM = getLocalTM();
    //starting
    if(localTM.startstate !== null && localTM.startstate !== undefined){
        document.getElementById("stateStarting").disabled = true;
    }
    else{
        document.getElementById("stateStarting").disabled = false;
    }
    //accepting
    if(localTM.acceptstate !== null && localTM.acceptstate !== undefined){
        document.getElementById("stateAccepting").disabled = true;
    }
    else{
        document.getElementById("stateAccepting").disabled = false;
    }
    //rejecting
    if(localTM.rejectstate !== undefined && localTM.rejectstate !== null && localTM.rejectstate.size > 0){
        document.getElementById("stateRejecting").disabled = true;
    }
    else{
        document.getElementById("stateRejecting").disabled = false;
    }
    
    document.getElementById("stateStarting").checked = false;
    document.getElementById("stateAccepting").checked = false;
    document.getElementById("stateRejecting").checked = false;
    
}

/**
 * Checks if we are currently in edit mode.
 *
 * @returns {boolean} - True if in edit mode, false otherwise.
 */
function inEditMode(){
    var button = document.querySelector('.toggle-button');
    // Check if the button is currently active
    var isActive = !button.classList.contains('active');
    return isActive;
}

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