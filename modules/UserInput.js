import { cy, cyCreateNode, cyCreateEdge, addEventListenerWithCheck, cyGrabifyNodes} from "./Cytoscape.js";
import { turingMachine } from "./TuringMachine.js";
import { addStateLocalTM, addEdgeLocalTM, getLocalTM, getRootTM, getAcceptSubTM, getStartSubTM } from "./SuperStates.js";

export {createDropdownMenues, nodePresetHelper, nodePresetReset, disableSliders, inEditMode, userNodeInputHandler, userEdgeInputHandler};


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
//eventlistener already exists?
var eventListenerActive = true;
//editMode
const editMode = document.getElementById("editMode");

//// ----------- Node Creation
/**Node Creation works as follows:
 * User click on canvas -> Open Create Node Modal ->
 *      (1) User submit modal -> userNodeInputHandler() -> hide Modal
 *      (2) User cancels modal -> hide Modal
 */


//Click on cyto canvas (in edit mode) -> Create Node
//Opens Create Node Modal
cy.on('click', (event) => {
    //only allow in editMode (& click on canvas)
    if(inEditMode() && event.target === cy){
        //get click position
        position = event.position;

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
        nodeButton.innerText = "Zustand erstellen";
        if(nodeEditButton){
            // Replace the existing button with the new button
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

        //display modal at click position
        nodeModal.style.paddingLeft = `${position.x + leftValue}px`
        let maxPaddingTop = Math.min(position.y + topValue, window.innerHeight-350);
        nodeModal.style.paddingTop = `${maxPaddingTop}px`;
        nodeModal.style.display = 'block';


        //enter to confirm node creation (TO DO)
        /*
        document.addEventListener('keydown', function(event){
            enterToConfirm(event, 'nodeButton');
        });
        eventListenerActive = true;
        */



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
    
    //Read user input
    let stateName = document.getElementById('stateName').value;
    let isStartingState = document.getElementById("stateStarting").checked === true;
    let isAcceptingState = document.getElementById("stateAccepting").checked === true;
    let isRejectingState = document.getElementById("stateRejecting").checked === true;
    //catch accepting & rejecting case
    if(isAcceptingState && isRejectingState){
        alert("Ein Zustand kann nicht gleichzeitig akzeptierend und verwerfend sein");
        nodeModal.style.display = 'block';
        return;
    }
    //catch name already exists
    for(const state of turingMachine.states){
        if(state.name === stateName){
            alert(`state with Name ${state.name} already exists, please choose a unique name`);
            nodeModal.style.display = 'block';
            return;
        }
    }


    //// --- CORE --- ////
    //create cyto node
    cyCreateNode(nodeId, stateName, position.x, position.y, isStartingState, isAcceptingState, isRejectingState);
    
    //create node in Global TM
    //check if in root -> set global start/accept/reject state
    if(getRootTM() === getLocalTM()){
        turingMachine.createState(nodeId, stateName, isStartingState, isAcceptingState, isRejectingState);
    }
    else{
        turingMachine.createState(nodeId, stateName);
    }
    //create node in Local TM
    addStateLocalTM(nodeId, stateName, isStartingState, isAcceptingState, isRejectingState);
    //adjust nodeId
    nodeId++;

    ////logging
    console.log("-----NEW STATE CREATED-----");
    console.log("new State with id: ", nodeId-1);
    console.log("global tm now: ", turingMachine);
    console.log("local TM now: ", getLocalTM())

    //Grabify nodes
    cyGrabifyNodes();
}
//User presses cancel button in NodeModal -> hide nodeModal
document.getElementById("cancelButton").addEventListener('click', function(){
    nodeModal.style.display = 'none';
})



//Helper functions to adjust global variable nodeId (used in Presets.js & SaveLoad.js)
//increases nodeId
function nodePresetHelper(){
    nodeId = nodeId + 1;
    return nodeId;
}
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

let dragFromNode = null;
let dragToNode = null;
let waitForDragging = 0;
//get drag from node
cy.on('mousedown', 'node', (event) =>{
    dragFromNode = event.target;
    //start dragging timer
    waitForDragging = Date.now();
})

//click on cyto node (in edit mode) -> Create Edge from this node
//Opens Create Edge Modal
cy.on('mouseup', 'node', (event) =>{
    dragToNode = event.target;
    //stop dragging timer
    waitForDragging = Date.now() - waitForDragging;
    //trying to create loop edge?
    if(dragFromNode === dragToNode){
        //user held mouse button for at least 300ms
        if(waitForDragging > 300){
            dragCreateEdge(event);
        }
    }
    else{
        console.log(dragFromNode, " ", dragToNode);
        dragCreateEdge(event);
    }
});

function dragCreateEdge(event){
    if(inEditMode()){
        //save from node (TM) (to global var)
        fromNode = getLocalTM().getStatebyId(dragFromNode.id());
        dragToNode = event.target;

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

        ////Create Option to Change FromState (if not yet existing)
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
        document.getElementById("fromState").value = fromNode.name;

        ////Create Option to Change ToState
        createDropdownMenues(document.getElementById("toState"))
        var toNode = getLocalTM().getStatebyId(dragToNode.id());
        document.getElementById("toState").value = toNode.name;



        ////change button from "edit node" to "create node" (if necessary)
        var edgeEditButton = document.getElementById("edgeEditButton");
        var edgeButton = document.createElement("button");
        edgeButton.id = "edgeButton";
        edgeButton.innerText = "Create Edge";
        if(edgeEditButton){
            //replace if needed
            edgeEditButton.parentNode.replaceChild(edgeButton, edgeEditButton);
        }

        //user submit edge inputs (Event Listener)
        addEventListenerWithCheck(document.getElementById("edgeButton"), 'click', userEdgeInputHandler)

        //remove delete edge button (if exists)
        const deleteButton = document.getElementById("edgeDeleteButton");
        if(deleteButton){
            document.getElementById("deleteEdgeDiv").removeChild(deleteButton);
        }

        //display modal at click position
        edgeModal.style.paddingLeft = `${position.x + leftValue}px`
        let maxPaddingTop = Math.min(position.y + topValue, window.innerHeight-350);
        edgeModal.style.paddingTop = `${maxPaddingTop}px`;
        edgeModal.style.display = 'block';


        //slider input show symbol
        const slider = document.getElementById("tapeMovement");
        const sliderValue = document.getElementById("slider-value");
        const value = parseFloat(slider.value);
        sliderValue.textContent = value === -1 ? "⮜" : value === 0 ? "⯀" : "➤";
        sliderValue.className = value === -1 ? "left" : value === 0 ? "neutral" : "right";
        
        //create dropdown menu so user might still adjust from/to state

        //enter to confirm node creation (TO DO)
        /*
        document.addEventListener('keydown', function(event){
            enterToConfirm(event, 'edgeButton');
        });
        eventListenerActive = true;
        */
    }
}




/**
 * Reads user input from EdgeModal & creates Edge user requested (Cytoscape & TM object) & closes modal
 */
function userEdgeInputHandler(){
    //Close the modal
    edgeModal.style.display = 'none';

    //// read user input

    //fromNode
    let dropdownfrom = document.getElementById("fromState");
    let fromNode = getLocalTM().getStatebyName(dropdownfrom.options[dropdownfrom.selectedIndex].textContent);
    let fromNodeId = fromNode.id;


    //toNode 
    let dropdown = document.getElementById("toState")
    let toNode = getLocalTM().getStatebyName(dropdown.options[dropdown.selectedIndex].textContent);
    let toNodeId = toNode.id;

    //readLabel
    let readLabel = document.getElementById('readLabel').value;
    //Else label checked?
    if(document.getElementById("readLabelElse").checked){
        readLabel = 'else';
    }

    //tapeMovement
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

    //writeLabel
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

    //create Edge Cytoscape
    cyCreateEdge(`${fromNodeId}`, `${toNodeId}`, cyLabel, readLabel);

    //create edge in Global TM
    let fromState = turingMachine.getStatebyId(fromNodeId);
    if(fromState === undefined){
        //fromState is not in global TM = is a SuperState
        fromState = getAcceptSubTM(fromNodeId);
    }

    let toState = turingMachine.getStatebyId(toNodeId);
    if(toState === undefined){
        //toState is not in global TM = is a SuperState
        toState = getStartSubTM(toNodeId);
    }
    turingMachine.createTransition(fromState, readLabel, toState, writeLabel, tapeMovement);
    
    //create Edge in Local TM
    addEdgeLocalTM(fromNodeId, readLabel, toNodeId, writeLabel, tapeMovement);


    //// adjust Alphabets of TM if user enters new token (write)
    if(turingMachine.sigma.has(writeLabel)){
        //sigma already has Label, do nothing
    }
    else if(writeLabel !== undefined && writeLabel !== ""){
        turingMachine.sigma.add(writeLabel);
        turingMachine.gamma.add(writeLabel);
    }
    //adjust Alphabets of TM if user enters new token (read)
    if(turingMachine.sigma.has(readLabel)){
        //sigma already has Label, do nothing
    }
    else if(readLabel !== undefined && readLabel !== ""){
        turingMachine.sigma.add(readLabel);
        turingMachine.gamma.add(readLabel);
    }

    //logging
    console.log("-----NEW EDGE CREATED-----")
    console.log("Global TM now: ", turingMachine);
    console.log("Local TM now: ", getLocalTM())
}

//Cancel button (edge) pressed
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
        /*
        optionElement.text = option;
        */
        
        dropdown.appendChild(optionElement);
    }
    ////
}


/**
 * Helper: that disables sliders in CreateNode/EditNode Modal (avoids creating multiple starting, accepting, rejecting states)
 */
function disableSliders(){
    console.log("disable Sliders");
    //starting
    if(turingMachine.startstate !== null && turingMachine.startstate !== undefined){
        document.getElementById("stateStarting").disabled = true;
    }
    else{
        document.getElementById("stateStarting").disabled = false;
    }
    //accepting
    if(turingMachine.acceptstate !== null && turingMachine.acceptstate !== undefined){
        document.getElementById("stateAccepting").disabled = true;
    }
    else{
        document.getElementById("stateAccepting").disabled = false;
    }
    //rejecting
    if(turingMachine.rejectstate !== null && turingMachine.rejectstate !== undefined){
        document.getElementById("stateRejecting").disabled = true;
    }
    else{
        document.getElementById("stateRejecting").disabled = false;
    }
    
    document.getElementById("stateStarting").checked = false;
    document.getElementById("stateAccepting").checked = false;
    document.getElementById("stateRejecting").checked = false;
    
}


function inEditMode(){
    var button = document.querySelector('.toggle-button');
    // Check if the button is currently active
    var isActive = !button.classList.contains('active');
    return isActive;
}