import {cy} from './Cytoscape.js';
import {cyTape, cyWriteCurrentPos, cyMoveTapeLeft, cyMoveTapeRight, getMiddleNodeId} from './CytoscapeTape.js';
import { TuringMachine, turingMachine } from './TuringMachine.js';

//// Global Variables
let simIsRunning = false;
// saves state the Sim is currently at
let currentState = turingMachine.startstate;


//User Action: Run Simulation Button
document.getElementById('runSimulationButton').addEventListener('click', function(){
    simIsRunning = true;
    if(currentState === undefined){
        currentState = turingMachine.startstate;
    }
    animRunSimulation(turingMachine, currentState, turingMachine.readTape());
})

async function animRunSimulation(turingMachine, startState, startCharOnTape){
    currentState = startState;
    let charOnTape = startCharOnTape;
    let animationTime = 1000/document.getElementById('simulationSpeed').value;
    //run animation on initial node
    animateSimulationStep(turingMachine, currentState, charOnTape);
    //wait for simulation step to finish
    await new Promise(resolve => setTimeout(resolve, 9*animationTime+10));

    while(simIsRunning && 
        currentState !== turingMachine.acceptstate &&
        currentState !== turingMachine.rejectstate){

        //run Simulation in TuringMachine.js on turingMachine object to get next state
        currentState = turingMachine.simulationStep(currentState, charOnTape);
        charOnTape = turingMachine.readTape();

        ////logging
        console.log("----------ANIMATION------------")
        console.log(`at State ${currentState.id} reading ${charOnTape}`);
        ////
        
        //run Simulation Animation
        animateSimulationStep(turingMachine, currentState, charOnTape);
        //wait for simulation step to finish
        await new Promise(resolve => setTimeout(resolve, 9*(animationTime+10)));

    }
    turingMachine.simulationResult(currentState);
}

async function animateSimulationStep(turingMachine, tmState, charOnTape){
    //read animationTime
    let animationTime = 1000/document.getElementById('simulationSpeed').value;
    let deltaValue = null;
        
    //find corresponding transition in delta
    try{
        deltaValue = turingMachine.delta.get(turingMachine.getKeyByContent([tmState, charOnTape]))
    }
    catch(error){
        animateNode(tmState, animationTime);
        return;
    }
    
    //// animate node
    animateNode(tmState, animationTime);
    //wait for simulation step to finish
    await new Promise(resolve => setTimeout(resolve, 2*(animationTime+10)));


    //// animate tape read
    animateTapeRead(deltaValue, animationTime);
    //wait for simulation step to finish
    await new Promise(resolve => setTimeout(resolve, 2*(animationTime+10)));


    //// animate edge
    animateEdge(tmState, charOnTape, animationTime);
    //wait for simulation step to finish
    await new Promise(resolve => setTimeout(resolve, 2*(animationTime+10)));


    //// animate tape write
    animateTapeWrite(deltaValue[1], animationTime)
    //wait for simulation step to finish
    await new Promise(resolve => setTimeout(resolve, (animationTime+10)));

    //// animate tape movement
    animateTapeMovement(deltaValue[2], animationTime)
    //wait for simulation step to finish
    await new Promise(resolve => setTimeout(resolve, (animationTime+10)));

}

function animateNode(tmState, animationTime){
    //get cyto node
    let cyCurrentNode = cy.getElementById(tmState.id);
    //get node color
    let originalColor = cyCurrentNode.style("background-color");
    //animate (fade in)
    cyCurrentNode.animate({
        style: {
            "background-color": "red",
        },

    },
    {
        duration: animationTime,
        //fade out
        complete: function(){
            cyCurrentNode.animate(
                {
                    style: {
                    "background-color": `${originalColor}`,
                    },
                },
                {
                    duration: animationTime,
                }
            );
        }
    });
}

function animateTapeRead(deltaValue, animationTime){
    //blink center node
    //get center tape node
    let middleid = getMiddleNodeId()
    //get corresponding cyto node
    let currNode = cyTape.getElementById(middleid);
    let originalColor = currNode.style("background-color");
    //animate
    currNode.animate({
        style: {
            "background-color": "red",
        },

    },
    {
        duration: animationTime,
        //fade out
        complete: function(){
            currNode.animate(
                {
                    style: {
                    "background-color": `${originalColor}`,
                    },
                },
                {
                    duration: animationTime,
                }
            );
        }
    });
}

function animateEdge(tmState, charOnTape, animationTime){
    //get corresponding edge
    //ATTENTION: this method relies on the edge being labelled as "R: {charOnTape} [...]"
    //find corresponding edge
    let edgeToAnimate = null;
    let edgeFound = false;
    const outgoingEdges = cy.getElementById(tmState.id).outgoers('edge');
    outgoingEdges.forEach(edge => {
        if(edge.style('label').startsWith('R: ')){
            const readChar = edge.style('label').charAt(3);
            if(readChar === charOnTape){
                edgeToAnimate = edge;
                edgeFound = true;
            }
        }
    })
    //catch Write "" case
    if(!edgeFound){
        outgoingEdges.forEach(edge => {
            if(edge.style('label').startsWith('R: ')){
                const readChar = edge.style('label').charAt(3);
                if(readChar === 'W' || readChar === ' '){
                    edgeToAnimate = edge;
                }
            }
        })
    }

    //Animation
    //fade-in
    if(edgeToAnimate != null){
        let originalColor = edgeToAnimate.style("background-color");
        edgeToAnimate.animate( 
        {
        style: {
            "line-color": "red",
        },
        },
        {
        duration: animationTime,
        //fade-out
        complete: function(){
            edgeToAnimate.animate( 
                {
                style: {
                    "line-color": `${originalColor}`,
                },
            },
            {
                duration: animationTime,
                complete: function(){
                    console.log("edge animation complete")
                }
            }
            );
        }
        }
        );
        
    }

}

function animateTapeWrite(writeToken, animationTime){
    //only write when token isn't empty
    if(writeToken !== ""){
        cyWriteCurrentPos(writeToken, animationTime);
    }
}

function animateTapeMovement(move, animationTime){
    switch (move){
        case "L":
            cyMoveTapeLeft(animationTime);
            break;
        case "R":
            cyMoveTapeRight(animationTime);
            break;
        case "N":
            //no movement on neutral
    }
}