import {cy, turingMachine} from './Cytoscape.js';
import {cyTape, cyWriteCurrentPos, cyMoveTapeLeft, cyMoveTapeRight} from './CytoscapeTape.js';
import { TuringMachine } from './TuringMachine.js';

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
    console.log("Run Simulation Button pressed", turingMachine);
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
        console.log("animation finished");

    }
}

async function animateSimulationStep(turingMachine, tmState, charOnTape){
    ////logging
    console.log("--- animationStep ---")
    console.log(tmState);
    console.log(`at State ${tmState.id} reading ${charOnTape}`);

    //find corresponding transition in delta
    let deltaValue = turingMachine.delta.get(turingMachine.getKeyByContent([tmState, charOnTape]))
    //read animationTime
    let animationTime = 1000/document.getElementById('simulationSpeed').value;

    //// animate node
    animateNode(tmState, animationTime);
    //wait for simulation step to finish
    console.log("nodeAnimation start");
    await new Promise(resolve => setTimeout(resolve, 2*(animationTime+10)));
    console.log("nodeAnimation stop");

    //// animate tape read
    animateTapeRead(deltaValue, animationTime);
    //wait for simulation step to finish
    console.log("tapeReadAnimation start");
    await new Promise(resolve => setTimeout(resolve, 2*(animationTime+10)));
    console.log("tapeReadAnimation stop");

    //// animate edge
    animateEdge(tmState, charOnTape, animationTime);
    //wait for simulation step to finish
    console.log("edgeAnimation start");
    await new Promise(resolve => setTimeout(resolve, 2*(animationTime+10)));
    console.log("edgeAnimation stop");

    //// animate tape write
    console.log("TM delta: ", turingMachine.delta, " ",deltaValue[1]);
    animateTapeWrite(deltaValue[1], animationTime)
    //wait for simulation step to finish
    console.log("tapeWriteAnimation start");
    await new Promise(resolve => setTimeout(resolve, (animationTime+10)));
    console.log("tapeWriteAnimation stop");

    //// animate tape movement
    animateTapeMovement(deltaValue[2], animationTime)
    //wait for simulation step to finish
    console.log("tapeMoveAnimation start");
    await new Promise(resolve => setTimeout(resolve, (animationTime+10)));
    console.log("tapeMoveAnimation stop");

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
                    complete: function(){
                        console.log("nodeAnimation complete")
                    }
                }
            );
        }
    });
}

function animateTapeRead(deltaValue, animationTime){
    //TO DO - find creative animation for TapeRead
}

function animateEdge(tmState, charOnTape, animationTime){
    //get corresponding edge
    //TO DO
    /*
    edge = ...
    */
    /*
    //fade-in
    if(edge != null){
        let originalColor = edge.style("background-color");
        edge.animate( 
        {
        style: {
            "line-color": "red",
        },
        },
        {
        duration: animationTime,
        //fade-out
        complete: function(){
            edge.animate( 
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
    */
}

function animateTapeWrite(writeToken, animationTime){
    console.log("Tape Write: ", writeToken);
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