import cytoscape from '../node_modules/cytoscape/dist/cytoscape.esm.min.js';
import {TuringMachine, turingMachine} from './TuringMachine.js';

export {cy, cyCreateNode, cyCreateEdge, nodePresetHelper, nodePresetReset, cyClearCanvas};

//------ global variables ------//
//Id for node creation (cyto id & turingmaschine id)
var nodeId = 0;
//fromNode at Edge Creation (used to safe on which node the user clicked)
var fromNode;


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
function cyCreateEdge(fromNode, toNode, label){
    console.log("cyCreateEdge " + fromNode + " | " + toNode + " | " + label);

    //core
    cy.add({ 
        group: 'edges', 
        data: { 
            source: `${fromNode}`, 
            target: `${toNode}` 
        },
        style: {
            'label': `${label}`,
            'font-size': '12px',
            "text-margin-y": "-5px",

          }
        }
    );
}

//// ----------- Clear Canvas
function cyClearCanvas(){
    var cyNodes = cy.nodes();
    cyNodes.remove();
}



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
        document.getElementById('stateStarting').disabled = true;
        document.getElementById('stateStarting').checked = false;
    }
    if(isAcceptingState){
        document.getElementById('stateAccepting').disabled = true;
        document.getElementById('stateAccepting').checked = false;
    }
    if(isRejectingState){
        document.getElementById('stateRejecting').disabled = true;
        document.getElementById('stateRejecting').checked = false;
    }
    
    //create node in TM
    turingMachine.createState(nodeId, isStartingState, isAcceptingState, isRejectingState);
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
    const node = event.target;
    fromNode = turingMachine.getStatebyId(node.id());
    //open modal
    const edgeModal = document.getElementById('edgeModal');
    edgeModal.style.display = 'block';
});

document.getElementById('edgeButton').addEventListener('click', function(){
    userEdgeInputHandler();
})
//user submit edge inputs
function userEdgeInputHandler(){
    //Close the modal
    edgeModal.style.display = 'none';

    //read user input
    //toNode
    let toNodeId = parseInt(document.getElementById('toState').value);
    let toNode = turingMachine.getStatebyId(toNodeId);
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
    cyCreateEdge(`${fromNode.id}`, `${toNodeId}`, cyLabel);

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