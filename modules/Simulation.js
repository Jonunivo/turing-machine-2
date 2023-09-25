import {cy} from './Cytoscape.js';
import {cyTape, cyWriteOnTape, cyMoveTapeLeft, cyMoveTapeRight} from './CytoscapeTape.js';
import { simulationStep } from './TuringMachine';

simIsRunning = false;
// TO DO: fetch animationTime from userinput
animationTime = 1000;

//User Action: Run Simulation Button
document.getElementById('runSimulationButton').addEventListener('click', function(){
    simIsRunning = true;
    runSimulation(/* TO DO */)
})

function runSimulation(startState, startCharOnTape){
    let currentState = startState;
    let charOnTape = startCharOnTape;
    //run animation on initial node
    animateSimulationStep(currentState, charOnTape);
    while(simIsRunning){
        //run Simulation in TuringMachine.js to get next state
        currentState = simulationStep(currentState, charOnTape);
        //TO DO - Get char on Tape!
        //run Simulation Animation
        animateSimulationStep(currentState, charOnTape);
        //TO DO - terminate when final state reached
    }
}

function animateSimulationStep(tmState, charOnTape){
    //find corresponding transition in delta
    let deltaValue = this.delta.get(this.getKeyByContent([tmState, charOnTape]))

    //// animate node
    animateNode(tmState);
    
    //// animate tape read
    animateTapeRead(deltaValue);

    //// animate edge
    animateEdge(tmState, charOnTape);

    //// animate tape write
    animateTapeWrite(deltaValue[1])

    //// animate tape movement
    animateTapeMovement(deltaValue[2])

}

function animateNode(tmState){
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

function animateTapeRead(deltaValue){
    //TO DO - find creative animation for TapeRead
}

function animateEdge(tmState, charOnTape){
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

function animateTapeWrite(writeToken){
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