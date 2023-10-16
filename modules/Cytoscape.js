import cytoscape from '../node_modules/cytoscape/dist/cytoscape.esm.min.js';
import {turingMachine} from './TuringMachine.js';

export {cy, cyCreateNode, cyCreateEdge, cyClearCanvas, runLayout, addEventListenerWithCheck, disableSliders};


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
function cyCreateNode(nodeId, nodeName, xPos=200, yPos=200, isStarting, isAccepting, isRejecting){
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
            'width': `${label.length*10 + 10}px`

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

//////////////////////////////////////////////////////////////
//// --------------------- Helpers ---------------------- ////
//////////////////////////////////////////////////////////////

//Helper: create eventlistener if not yet existent (avoids duplication of eventlisteners)
function addEventListenerWithCheck(element, eventType, listener){
    const existingListeners = element.__eventListeners || {};
    if(!existingListeners[eventType]){
        element.addEventListener(eventType, listener);
        existingListeners[eventType] = listener;
    }
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
