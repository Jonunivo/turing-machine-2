import cytoscape from '../node_modules/cytoscape/dist/cytoscape.esm.min.js';
import {TuringMachine} from './TuringMachine.js';

//global variables
var nodeId = 0;
var startingStateExists = false;
var acceptingStateExists = false;
var rejectingStateExists = false;
//Turingmachine
var turingMachine = new TuringMachine(new Set(), new Set(), new Set(), new Map(), undefined, undefined, undefined, null, 0);


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
            'target-arrow-shape': 'triangle',
            'target-arrow-color': 'blue'
        }
    },
    {
        
        selector: 'edge',
        style: {
            'line-color': 'black',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': 'blue',
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
    let label = nodeName;
    console.log(nodeId);
    let id = nodeId;
    let color = 'lightgrey';
    //border
    let borderWidth = 0;
    let borderColor = 'white';
    if(isStarting){
        borderWidth = 2;
        borderColor = 'black';
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




//////////////////////////////////////////////////////////////
//// -------------------- User Input -------------------- ////
//////////////////////////////////////////////////////////////
//// ----------- Node Creation
//dblclick -> create node
 cy.on('dblclick', (event) => {
    const position = event.position;
    //open modal
    const nodeModal = document.getElementById('nodeModal');
    nodeModal.style.display = 'block';
    //cyCreateNode(0, position.x, position.y);
})

//user submit node inputs
document.getElementById('nodeButton').addEventListener('click', function(){
    userNodeInputHandler();
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
    //Form Validation
    if(isStartingState){
        startingStateExists = true;
        document.getElementById('stateStarting').disabled = true;
        document.getElementById('stateStarting').checked = false;
    }
    if(isAcceptingState){
        acceptingStateExists = true;
        document.getElementById('stateAccepting').disabled = true;
        document.getElementById('stateAccepting').checked = false;
    }
    if(isRejectingState){
        rejectingStateExists = true;
        document.getElementById('stateRejecting').disabled = true;
        document.getElementById('stateRejecting').checked = false;
    }
    
    //create node in TM
    turingMachine.createState(nodeId, isStartingState, isAcceptingState, isRejectingState);
    //adjust nodeId
    nodeId++;
}
//Cancel button pressed
document.getElementById("cancelButton").addEventListener('click', function(){
    nodeModal.style.display = 'none';
})

//// ----------- Edge Creation


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