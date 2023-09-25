import {cy, turingMachine} from './Cytoscape.js';
import {cyTape, cyWriteOnTape, cyMoveTapeLeft, cyMoveTapeRight} from './CytoscapeTape.js';
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
    console.log("TM: ", turingMachine.tape);
    animRunSimulation(turingMachine, currentState, turingMachine.readTape());
})

function animRunSimulation(turingMachine, startState, startCharOnTape){
    currentState = startState;
    let charOnTape = startCharOnTape;
    //run animation on initial node
    animateSimulationStep(turingMachine, currentState, charOnTape);
    while(simIsRunning && 
        currentState !== turingMachine.acceptstate &&
        currentState !== turingMachine.rejectstate){


        //run Simulation in TuringMachine.js on turingMachine object to get next state
        console.log("HEHEH", turingMachine);
        currentState = turingMachine.simulationStep(currentState, charOnTape);
        charOnTape = turingMachine.readTape();

        ////logging
        console.log("----------ANIMATION------------")
        console.log(`at State ${currentState.id} reading ${charOnTape}`);
        ////
        
        //run Simulation Animation
        animateSimulationStep(turingMachine, currentState, charOnTape);
    }
}

function animateSimulationStep(turingMachine, tmState, charOnTape){
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
    
    //// animate tape read
    animateTapeRead(deltaValue, animationTime);

    //// animate edge
    animateEdge(tmState, charOnTape, animationTime);

    //// animate tape write
    animateTapeWrite(deltaValue[1], animationTime)

    //// animate tape movement
    animateTapeMovement(deltaValue[2], animationTime)

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
    cyWriteOnTape(writeToken);
}

function animateTapeMovement(move){
    switch (move){
        case "L":
            cyMoveTapeLeft();
            break;
        case "R":
            cyMoveTapeRight();
            break;
        case "N":
            //no movement on neutral
    }
}