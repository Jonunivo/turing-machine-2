import {cy} from './Cytoscape.js';
import {cyTape, cyWriteCurrentPos, cyMoveTapeLeft, cyMoveTapeRight, getWriteNodeId, fixTapePosition, tmTapetoCyto} from './CytoscapeTape.js';
import {TuringMachine, turingMachine } from './TuringMachine.js';

export{simulationReset, enableButtons};

//// Global Variables
// used to run / pause simulation
let simIsRunning = false;
// saves state the Sim is currently at 
let currentState;
// wait-notify
let isReady = false;
// original color
let originalColorNode = "grey";
let originalColorEdge = "grey";

//find corresponding edge
let edgeToAnimate = null;

//////////////////////////////////////////////////////////////
//// -------------------- User Action ------------------- ////
//////////////////////////////////////////////////////////////

//Event Listener: Run Simulation / Pause Simulation Button pressed
document.getElementById('runSimulationButton').addEventListener('click', function(){
    //Animation off -> FastSimulation
    if(!document.getElementById('fastSimulation').checked){
        fastSimulation();
        console.log("fast simulation");
        return;
    }
    //(Re-) run simulation
    if(!simIsRunning){
        simIsRunning = true;

        //catch first iteration
        if(currentState === undefined){
            currentState = turingMachine.startstate;
        }
        //catch no start state defined
        if(turingMachine.startstate === undefined){
            alert("Please create Start State first");
            simIsRunning = false;
            return;
        }

        //Button manipulation
        document.getElementById('runSimulationButton').innerHTML = "Pause Simulation";
        document.getElementById("resetSimulationButton").disabled = true;

        //CORE
        animRunSimulation(turingMachine, currentState, turingMachine.readTape());
    }
    //Pause simulation
    else{
        simIsRunning = false;
        //disable runsimulation button until animation finished
        document.getElementById('runSimulationButton').disabled = true;
        document.getElementById('stepSimulationButton').disabled = true;
        document.getElementById('runSimulationButton').innerHTML = "Run Simulation";
    }

})

//Event Listener: Run Single Step of Animation
document.getElementById('stepSimulationButton').addEventListener('click', function(){
    //catch first simulation step
    if(currentState === undefined){
        currentState = turingMachine.startstate;
    }
    //catch startstate not defined
    if(turingMachine.startstate === undefined){
        alert("Please create Start State first");
        return;
    }
    //Fast Simulation if Animation is set to off
    if(!document.getElementById('fastSimulation').checked){
        console.log("fast simulation step");
        fastSimulationStep();
        return;
    }
    //disable buttons during simulation
    disableButtons("all");

    //CORE
    animateSimulationStep(turingMachine, currentState, turingMachine.readTape());
    //run Simulation in TuringMachine.js on turingMachine object to get next state
    currentState = turingMachine.simulationStep(currentState, turingMachine.readTape());
})

//Event Listener: Go back to start state (Reset Simulation)
document.getElementById('resetSimulationButton').addEventListener('click', function(){
    //set Simulation state to startstate
    currentState = turingMachine.startstate;
    //quickly blink start state
    animateNode(currentState, 200);
    //reenable buttons that might have been disabled
    document.getElementById("runSimulationButton").disabled = false;
    document.getElementById("stepSimulationButton").disabled = false;
})


//////////////////////////////////////////////////////////////
//// ---------------- Fast Simulation ------------------- ////
//////////////////////////////////////////////////////////////
/**
 * Fast Simulation works as follows:
 * [Animation slider off] User presses Run Simulation -> fastSimulation()
 * 
 * Fast Simulation step works as follows:
 * [Animation slider off] User presses Step -> fastSimulationStep()
 */


/**
 * Executes TM Simulation until Accept or Reject state reached, without Animation
 * Aborts after 5 seconds telling the user that the TM might be running forever
 * Runs Simulation fully within turingMachine object, adjusting cyTape accordingly at end of Simulation.
 * resets back to StartState after end of Simulation, allowing to directly rerun simulation on new tape state.
 */
function fastSimulation(){
    //run Simulation in TuringMachine.js on turingMachine object to get next state
    let charOnTape = turingMachine.readTape()

    //catch first iteration
    if(currentState === undefined){
        currentState = turingMachine.startstate;
    }
    //catch no startstate
    if(turingMachine.startstate === undefined){
        alert("Please create Start State first");
        return;
    }

    //limit run time to 5 seconds
    const startTime = new Date().getTime();
    const timeLimit = 5000; // 5 seconds in milliseconds
    while(
        currentState !== turingMachine.acceptstate &&
        currentState !== turingMachine.rejectstate &&
        new Date().getTime() - startTime < timeLimit){
        
        //CORE
        currentState = turingMachine.simulationStep(currentState, charOnTape);
        charOnTape = turingMachine.readTape();

    }
    //simulation timeout
    if(new Date().getTime() - startTime >= timeLimit){
        tmTapetoCyto();
        alert("Simulation timed out after 5 seconds, maybe it would run forever");
    }

    else if(currentState == turingMachine.acceptstate ||
        currentState == turingMachine.rejectstate){
            //simulation finished
            tmTapetoCyto();
            turingMachine.simulationResult(currentState);
        }


}

/**
 * Handles single step of Simulation without animation.
 * Works simmilarly as simulationStep()
 * 
 */
function fastSimulationStep(){

    //catch no startstate
    if(turingMachine.startstate === undefined){
        alert("Please create Start State first");
        return;
    }

    let charOnTape = turingMachine.readTape()
    console.log(currentState + " " + charOnTape);
    //get next state
    currentState = turingMachine.simulationStep(currentState, charOnTape);
    //cyto
    console.log("here1");
    tmTapetoCyto();
    console.log("here2");


    //last state reached
    if(currentState === turingMachine.acceptstate || currentState === turingMachine.rejectstate){
        turingMachine.simulationResult(currentState);
        //disable buttons
        document.getElementById('runSimulationButton').innerHTML = "Run Simulation"
        document.getElementById('runSimulationButton').disabled = true;
        document.getElementById('stepSimulationButton').disabled = true;
    }



}


//////////////////////////////////////////////////////////////
//// ----------- Simulation/Animation Core -------------- ////
//////////////////////////////////////////////////////////////

/**
 * Simulation with Animation works as Follows:
 * [Animation slider on] User Presses Simulation Button -> animRunSimulation() -> [
 *          animateSimulationStep() [-> animateNode() -> animateTapeRead() -> animateEdge() ->
 *          animateTapeWrite() -> animateTapeMovement() -> fixTapePosition()]]
 * repeats until user pauses simulation or simulation reaches Accept/Reject state
 * 
 * Simulation Step with Animation works as Follows:
 * [Animation slider on] User Presses Step Button ->
 *          animateSimulationStep() [-> animateNode() -> animateTapeRead() -> animateEdge() ->
 *          animateTapeWrite() -> animateTapeMovement() -> fixTapePosition()]
 */


/**
 * Core Function that runs Animation&Simulation until user presses Pause or TM reaches final state.
 * calls animateSimulationStep() for each simulation step,
 * calls TuringMachine result handler if TM reached final state
 * 
 * 
 * @param {TuringMachine} turingMachine - TM object the simulator works with
 * @param {State} startState - State the simulator start on
 * @param {char} startCharOnTape - Char on tape at simulation start
 */
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
        disableButtons();

        //run animation
        //recalculate animation time
        animationTime = 1000/document.getElementById('simulationSpeed').value;
        animateSimulationStep(turingMachine, currentState, charOnTape);
        //wait for simulation step to finish
        await new Promise(resolve => setTimeout(resolve, 8*animationTime+350));
        //wait an additional 100ms (test to fix animation not looking correct)
        await new Promise(resolve => setTimeout(resolve, 100));


        //run Simulation in TuringMachine.js on turingMachine object to get next state

        currentState = turingMachine.simulationStep(currentState, charOnTape);
        if(currentState === null){
            //error occured in turingMachine.simulationStep
            console.log("error occured");
            simIsRunning = false;
            break;
        }
        charOnTape = turingMachine.readTape();

        ////logging
        console.log("----------ANIMATION------------")
        console.log(`at State ${currentState.name} reading ${charOnTape}`);
        ////

    }
    if(simIsRunning){
        //handle simulation result when accept or reject state reached
        //moved to animateSimulationStep
        simIsRunning = false;
    }
}

/**
 * 
 * Core Function that handles single Simulation/Animation step by calling the responsible AnimationFunctions
 * 
 * @param {TuringMachine} turingMachine - TM object the simulator works with
 * @param {State} tmState - State the Simulation step starts on
 * @param {char} charOnTape - Char on tape at simulation start
 */
async function animateSimulationStep(turingMachine, tmState, charOnTape){
    //read animationTime
    let animationTime = 1000/document.getElementById('simulationSpeed').value;
    let deltaValue = null;

    console.log("TM!: ", turingMachine);

       
    //find corresponding transition in delta
    try{
        deltaValue = turingMachine.delta.get(turingMachine.getKeyByContent([tmState, charOnTape]))
    }
    catch(error){
        try{
            //Else edge
            deltaValue = turingMachine.delta.get(turingMachine.getKeyByContent([tmState, 'else']))

        }
        catch(error){
            //no next node found: animate final node
            animateNode(tmState, animationTime);
            return;
        }

    }

    
    //// animate node IN
    //animateNode(tmState, animationTime);
    animateNodeIn(tmState, animationTime);
    //wait for simulation step to finish
    await new Promise(resolve => setTimeout(resolve, animationTime+10));


    //// animate tape read
    animateTapeRead(animationTime);
    //wait for simulation step to finish
    await new Promise(resolve => setTimeout(resolve, 2*(animationTime+10)));


    //// animate edge IN
   // animateEdge(tmState, charOnTape, animationTime);
   // animateEdge(tmState, charOnTape, animationTime);
    animateEdgeIn(tmState, charOnTape, animationTime);

    //wait for simulation step to finish
    await new Promise(resolve => setTimeout(resolve, (animationTime+10)));


    //// animate tape write
    animateTapeWrite(deltaValue[1], animationTime)
    //wait for simulation step to finish
    await new Promise(resolve => setTimeout(resolve, (animationTime+100)));

    //// animate tape movement
    animateTapeMovement(deltaValue[2], animationTime)
    //wait for simulation step to finish
    await new Promise(resolve => setTimeout(resolve, (animationTime+100)));


    //// animate node OUT & edge OUT
    animateNodeOut(tmState, animationTime);
    animateEdgeOut(tmState, charOnTape, animationTime);
    await new Promise(resolve => setTimeout(resolve, (2*animationTime+100)));


    //fix tape position if animation (for some reason) didnt work correctly
    fixTapePosition();


    //re-enable run simulation buttons after simulation step finished (for single step)
    if(!simIsRunning && !deltaValue[0].isAccepting && !deltaValue[0].isRejecting){
        enableButtons();
    }
    else if(deltaValue[0].isAccepting || deltaValue[0].isRejecting){
        //final state reached
        // !(TO DO) deltaValue is edited 1 step before actually reaching accept/reject state
        console.log(deltaValue[0]);

        //animate last state & call simulationResult
        animateNode(currentState, 2*animationTime);
        await new Promise(resolve => setTimeout(resolve, 2*animationTime));
        turingMachine.simulationResult(deltaValue[0]);
        
        //enable buttons
        enableButtons();
        document.getElementById('runSimulationButton').innerHTML = "Run Simulation"
        document.getElementById('runSimulationButton').disabled = true;
        document.getElementById('stepSimulationButton').disabled = true;

    }
}

//reset simulation back to startstate. Used when loading new TM/editing TM
function simulationReset(){
    currentState = turingMachine.startstate;
}

//////////////////////////////////////////////////////////////
//// ----------------- Animation Steps ------------------ ////
//////////////////////////////////////////////////////////////
//These funcitons are all called by core function animateSimulationStep()

/**
 * 
 * Runs red blinking Animation on cytoNode for @param animationTime ms
 * 
 * @param {State} tmState - Node to run animation on
 * @param {number} animationTime - animationTime in ms
 */

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
                        //notify();
                    }
                }
            );
        }
    });
}


function animateNodeIn(tmState, animationTime){

    //get cyto node
    let cyCurrentNode = cy.getElementById(tmState.id);
    //get node origianl color
    originalColorNode = cyCurrentNode.style("background-color");
    //animate (fade in)
    cyCurrentNode.animate({
        style: {
            "background-color": "red",
        },

    },
    {
        duration: animationTime,
    })
}

function animateNodeOut(tmState, animationTime){
    //get cyto node
    let cyCurrentNode = cy.getElementById(tmState.id);

    cyCurrentNode.animate(
        {
            style: {
            "background-color": `${originalColorNode}`,
            },
        },
        {
            duration: animationTime,

        }
    );
}

/**
 * 
 * Runs red blinking Animation on Tapeobject at cursor location for @param animationTime ms
 * 
 * @param {number} animationTime - animationTime in ms
 */
function animateTapeRead(animationTime){
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

/**
 * 
 * Runs red blinking Animation on correcsponding Edge for @param animationTime ms
 * 
 * @param {State} tmState - State from which the edge originates
 * @param {char} charOnTape - charOnTape for this animation step
 * @param {number} animationTime - animationTime in ms
 */
//replaced by animateEdgeIn & animateEdgeOut
/*
function animateEdge(tmState, charOnTape, animationTime){
    //find corresponding edge
    let edgeToAnimate = null;
    const outgoingEdges = cy.getElementById(tmState.id).outgoers('edge');
    outgoingEdges.forEach(edge => {
        if(edge.data().readToken === charOnTape){
            edgeToAnimate = edge;
        }
        else if (edge.data().readToken === 'else'){
            edgeToAnimate = edge;
        }
    })

    //Animation
    //fade-in
    if(edgeToAnimate != null){
        let originalColor = edgeToAnimate.style("line-color");
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
                    //console.log("edge animation complete")
                }
            }
            );
        }
        }
        );
        
    }

}
*/

function animateEdgeIn(tmState, charOnTape, animationTime){
    //find corresponding edge
    edgeToAnimate = null;
    let elseEdgeToAnimate = null;
    const outgoingEdges = cy.getElementById(tmState.id).outgoers('edge');
    outgoingEdges.forEach(edge => {
        if(edge.data().readToken === charOnTape){
            edgeToAnimate = edge;
        }
        //catch else edge
        else if (edge.data().readToken === 'else'){
            elseEdgeToAnimate = edge;
        }
    })
    //case else edge
    if(edgeToAnimate === null && elseEdgeToAnimate != null){
        edgeToAnimate = elseEdgeToAnimate;
    }

    //Animation
    //fade-in
    if(edgeToAnimate != null){
        originalColorEdge = edgeToAnimate.style("line-color");
        edgeToAnimate.animate({
            style: {
                "line-color": "red",
            },
            },
            {
            duration: animationTime,
            })
    }
}

function animateEdgeOut(tmState, charOnTape, animationTime){
    //find corresponding edge
    //done in animateEdgeIn

    //Animation
    //fade-out
    if(edgeToAnimate != null){
        edgeToAnimate.animate({
            style: {
                "line-color": `${originalColorEdge}`,
            },
            },
            {
            duration: animationTime,
            })
    }
}


/**
 * 
 * Animate Tape Write for @param animationTime ms, just calls the cyWriteCurrentPos() from CytoscapeTape.js
 * 
 * @param {char} writeToken - token to be written on Tape
 * @param {number} animationTime - animationTime in ms
 */
function animateTapeWrite(writeToken, animationTime){
    //only write when token isn't "nothing"
    if(writeToken !== undefined && writeToken !== 'nothing'){
        cyWriteCurrentPos(writeToken, animationTime);
    }
}

/**
 * 
 * Runs Move Tape for @param animationTime ms (calls functions from CytoscapeTape.js)
 * 
 * @param {char} move - specifies Movement direction {"L", "N", "R"}
 * @param {number} animationTime - animationTime in ms
 */
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
//// --------------------- Helpers ---------------------- ////
//////////////////////////////////////////////////////////////


/**
 * 
 * Helper: disables all buttons that shouldn't be accessed during simulation
 * 
 * @param {string} mode - mode of function, allows for use in multiple scenarios
 */
function disableButtons(mode){
    document.getElementById('stepSimulationButton').disabled = true;
    document.getElementById('resetSimulationButton').disabled = true;
    document.getElementById('move-tape-right').disabled = true;
    document.getElementById('move-tape-left').disabled = true;
    document.getElementById('tape-input').disabled = true;
    document.getElementById('fastSimulation').disabled = true;
    if(mode === "all"){
        document.getElementById('runSimulationButton').disabled = true;
    }
}
/**
 * Helper: ree-enables Buttons after Simulation finished
 */
function enableButtons(){
    document.getElementById('runSimulationButton').disabled = false;
    document.getElementById('stepSimulationButton').disabled = false;
    document.getElementById('resetSimulationButton').disabled = false;
    document.getElementById('move-tape-right').disabled = false;
    document.getElementById('move-tape-left').disabled = false;
    document.getElementById('tape-input').disabled = false;
    document.getElementById('fastSimulation').disabled = false;

}

//////////////////////////////////////////////////////////////
//// ------------------- wait/notify -------------------- ////
//////////////////////////////////////////////////////////////

//tried to do simulation with wait/notify, not yet working, not yet used

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