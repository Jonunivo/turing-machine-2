import { cy, cyCreateNode, cyCreateEdge, addEventListenerWithCheck, disableSliders } from "./Cytoscape.js";
import { turingMachine } from "./TuringMachine.js";

export {createDropdownMenues, nodePresetHelper, nodePresetReset };


//////////////////////////////////////////////////////////////
//// ------------------ User Creation ------------------- ////
//////////////////////////////////////////////////////////////

//globals
//Id for node creation (cyto id & turingmaschine id)
var nodeId = 0;
//fromNode at Edge Creation (used to safe on which node the user clicked)
var fromNode;
//createNOde POsition
var position;



//// ----------- Node Creation
//dblclick -> create node
cy.on('dblclick', (event) => {
    //get doubleclick position
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

    //create cyto node
    cyCreateNode(nodeId, stateName, position.x, position.y, isStartingState, isAcceptingState, isRejectingState);
    
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
    return nodeId;
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
    let dropdown = document.getElementById("toState")
    let toNode = turingMachine.getStatebyName(dropdown.value);
    let toNodeId = toNode.id;

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




