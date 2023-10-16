import {cy} from './Cytoscape.js';
import {cyTape, cyWriteCurrentPos, cyMoveTapeLeft, cyMoveTapeRight, getWriteNodeId, fixTapePosition, tmTapetoCyto} from './CytoscapeTape.js';
import { TuringMachine, turingMachine } from './TuringMachine.js';

//// Global Variables
// used to run / pause simulation
let simIsRunning = false;
// saves state the Sim is currently at 
let currentState;
// wait-notify
let isReady = false;

//////////////////////////////////////////////////////////////
//// -------------------- User Action ------------------- ////
//////////////////////////////////////////////////////////////

//Run Simulation Button
document.getElementById('runSimulationButton').addEventListener('click', function(){
    if(!document.getElementById('fastSimulation').checked){
        fastSimulation();
        console.log("fast simulation");
        return;
    }
    if(!simIsRunning){
        //(re-) run simulation
        //Button manipulation
        document.getElementById('runSimulationButton').innerHTML = "Pause Simulation";
        document.getElementById("resetSimulationButton").disabled = true;

        simIsRunning = true;
        if(currentState === undefined){
            currentState = turingMachine.startstate;
        }
        animRunSimulation(turingMachine, currentState, turingMachine.readTape());
    }
    else{
        //pause simulation
        //disable runsimulation button until animation finished
        document.getElementById('runSimulationButton').disabled = true;
        document.getElementById('stepSimulationButton').disabled = true;
        document.getElementById('runSimulationButton').innerHTML = "Run Simulation";
        simIsRunning = false;
    }

})

//Run Single Step of Animation
document.getElementById('stepSimulationButton').addEventListener('click', function(){
    //catch undefined case
    if(currentState === undefined){
        currentState = turingMachine.startstate;
    }
    ////disable buttons
    document.getElementById('stepSimulationButton').disabled = true;
    document.getElementById('resetSimulationButton').disabled = true;
    document.getElementById('runSimulationButton').disabled = true;
    document.getElementById('move-tape-right').disabled = true;
    document.getElementById('move-tape-left').disabled = true;
    document.getElementById('tape-input').disabled = true;


    console.log("readTape: ", turingMachine.readTape());

    animateSimulationStep(turingMachine, currentState, turingMachine.readTape());
    //run Simulation in TuringMachine.js on turingMachine object to get next state
    currentState = turingMachine.simulationStep(currentState, turingMachine.readTape());
})

//Go back to start state (Reset Simulation)
document.getElementById('resetSimulationButton').addEventListener('click', function(){
    currentState = turingMachine.startstate;
    //quickly blink start state
    animateNode(currentState, 200);

    document.getElementById("runSimulationButton").disabled = false;
    document.getElementById("stepSimulationButton").disabled = false;
})

//////////////////////////////////////////////////////////////
//// ---------------- Fast Simulation ------------------- ////
//////////////////////////////////////////////////////////////
function fastSimulation(){
    //run Simulation in TuringMachine.js on turingMachine object to get next state
    let charOnTape = turingMachine.readTape()
    currentState = turingMachine.startstate;
    while(
        currentState !== turingMachine.acceptstate &&
        currentState !== turingMachine.rejectstate){
        
        console.log(currentState + " " + charOnTape);

        currentState = turingMachine.simulationStep(currentState, charOnTape);
        charOnTape = turingMachine.readTape();

    }
    //simulation finished
    console.log(turingMachine.tape);
    tmTapetoCyto();

}


//////////////////////////////////////////////////////////////
//// ----------- Simulation/Animation Core -------------- ////
//////////////////////////////////////////////////////////////

async function animRunSimulation(turingMachine, startState, startCharOnTape){
    //initial values
    currentState = startState;
    let charOnTape = startCharOnTape;
    let animationTime = 1000/document.getElementById('simulationSpeed').value;
    //loop
    while(simIsRunning && 
        currentState !== turingMachine.acceptstate &&
        currentState !== turingMachine.rejectstate){

        //disable things that shouldn't be accessed during simulation
        document.getElementById('stepSimulationButton').disabled = true;
        document.getElementById('resetSimulationButton').disabled = true;
        document.getElementById('move-tape-right').disabled = true;
        document.getElementById('move-tape-left').disabled = true;
        document.getElementById('tape-input').disabled = true;



        //run animation
        //recalculate animation time
        animationTime = 1000/document.getElementById('simulationSpeed').value;
        animateSimulationStep(turingMachine, currentState, charOnTape);
        //wait for simulation step to finish
        await new Promise(resolve => setTimeout(resolve, 9*animationTime+10));

        //run Simulation in TuringMachine.js on turingMachine object to get next state

        currentState = turingMachine.simulationStep(currentState, charOnTape);
        if(currentState === null){
            //error occured in turingMachine.simulationStep
            simIsRunning = false;
            break;
        }
        charOnTape = turingMachine.readTape();



        ////logging
        console.log("----------ANIMATION------------")
        console.log(`at State ${currentState.id} reading ${charOnTape}`);
        ////

    }
    if(simIsRunning){
        //handle simulation result when accept or reject state reached
        //button manipulation
        document.getElementById('runSimulationButton').innerHTML = "Run Simulation"
        document.getElementById('runSimulationButton').disabled = true;
        document.getElementById("resetSimulationButton").disabled = false;
        document.getElementById('move-tape-left').disabled = false;
        document.getElementById('move-tape-right').disabled = false;
        document.getElementById('tape-input').disabled = false;



        simIsRunning = false;

        //turingMachine Resulthandler
        turingMachine.simulationResult(currentState);
    }
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
        //animtate final node
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
    //fix tape position if animation (for some reason) didnt work correctly
    fixTapePosition();

    //re-enable run simulation button after simulation step finished (for single step)
    if(!simIsRunning){
        document.getElementById('runSimulationButton').disabled = false;
        document.getElementById('stepSimulationButton').disabled = false;
        document.getElementById('resetSimulationButton').disabled = false;
        document.getElementById('move-tape-right').disabled = false;
        document.getElementById('move-tape-left').disabled = false;
        document.getElementById('tape-input').disabled = false;
    }




}

//////////////////////////////////////////////////////////////
//// ----------------- Animation Steps ------------------ ////
//////////////////////////////////////////////////////////////

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
                        console.log("here");
                        notify();
                    }
                }
            );
        }
    });
}

function animateTapeRead(deltaValue, animationTime){
    //blink center node
    //get center tape node
    let middleid = getWriteNodeId()
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
    //find corresponding edge
    let edgeToAnimate = null;
    const outgoingEdges = cy.getElementById(tmState.id).outgoers('edge');
    outgoingEdges.forEach(edge => {
        if(edge.data().readToken === charOnTape){
            edgeToAnimate = edge;
        }
    })

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
            cyMoveTapeRight(animationTime);
            break;
        case "R":
            cyMoveTapeLeft(animationTime);
            break;
        case "N":
            //no movement on neutral
    }
}

//////////////////////////////////////////////////////////////
//// ------------------- wait/notify -------------------- ////
//////////////////////////////////////////////////////////////

//tried to do simulation with wait/notify, not yet working

function waitFor(ms){
    return new Promise((resolve) => {setTimeout(resolve, ms);
    })
}

function notify(){
    console.log("notify");
    isReady = true;
}

async function waitUntilReady(){
    while(!isReady){
        console.log("waiting");
        await waitFor(100);
    }
}