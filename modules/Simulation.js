/*
  Author: Mauro Vogel
  Date: January 2024
  
  Description: 
    - Reads user pressing Simulation control buttons & reacts to it accordingly
    - Defines & controls simulation without animation
    - Defines & controls simulation with animation
        - Defines cytoscape animations
        - controls disabling buttons during simulation

  Dependencies/Imports:
    - Cytoscape.js     | Cytoscape main window object & function to enable/disable moving nodes.
    - CytoscapeTape.js | functions that control & manipulate the Tape
    - SuperStates.js   | global variable currTreeNode, which returns the TreeNode the user is currently at.
    - TuringMachine.js | the global TM object (turingMachine) and the TuringMachine class

  Exports:
    - Function to reset Simulation back to start state
    - Function to reenable Buttons disabled during simulation
*/

import {cy, cyGrabifyNodes} from './Cytoscape.js';
import {cyTape, cyWriteCurrentPos, cyMoveTapeLeft, cyMoveTapeRight, getWriteNodeId, fixTapePosition, tmTapetoCyto} from './CytoscapeTape.js';
import { currTreeNode} from './SuperStates.js';
import {TuringMachine, turingMachine } from './TuringMachine.js';

export{simulationReset, enableButtons};

//// Global Variables
// used to run / pause simulation
let simIsRunning = false;
// saves state the Sim is currently at 
let currentState;
// original color of cyto elements (saved across fade-in & fade-out functions)
let originalColorNode;
let originalColorEdge;
//sets color of Animation (=blue)
let animationColor = "#5463ff";
//saves edge to be animated across fade-in & fade-out
let edgeToAnimate = null;

//////////////////////////////////////////////////////////////
//// -------------------- User Action ------------------- ////
//////////////////////////////////////////////////////////////

/**
 * EventListener for the 'runSimulationButton' element.
 * If Animation is turned off, it triggers the fastSimulation function.
 * If Animation is turned on, it starts or pauses the simulation&animation based on the current simulation state.
 * Checks for special conditions (e.g., no starting state defined or starting simulation on accept/reject state),
 * enables/disables relevant buttons accordingly.
 */
document.getElementById('runSimulationButton').addEventListener('click', function(){
    //Case 1: Animation off -> FastSimulation
    if(!document.getElementById('fastSimulation').checked){
        fastSimulation();
        return;
    }
    //Case 2.1: Animation on & simulation not running -> (Re-) run simulation
    if(!simIsRunning){
        simIsRunning = true;

        //catch first iteration
        if(currentState === undefined){
            currentState = turingMachine.startstate;
        }
        //catch no start state defined
        if(turingMachine.startstate === undefined){
            alert("Please create Starting State first");
            simIsRunning = false;
            return;
        }
        //catch starting simulation on accept/reject state
        if(currentState === turingMachine.acceptstate || 
            turingMachine.rejectstate.has(currentState)){
            //animate last state & call simulationResult
            animateNode(currentState, 2*1000/document.getElementById('simulationSpeed').value);
            turingMachine.simulationResult(currentState);
            
            //enable buttons
            enableButtons();
            document.getElementById('runSimulationButton').innerHTML = "Run Simulation"
            document.getElementById('runSimulationButton').disabled = true;
            document.getElementById('stepSimulationButton').disabled = true;
            return;
        }

        //Button manipulation
        document.getElementById('runSimulationButton').innerHTML = "Pause Simulation";
        document.getElementById("resetSimulationButton").disabled = true;

        //CORE
        animRunSimulation(turingMachine, currentState, turingMachine.readTape());
    }
    //Case 2.2: Animation runnning -> pause simulation
    else{
        simIsRunning = false;
        //disable runsimulation button until animation finished
        document.getElementById('runSimulationButton').disabled = true;
        document.getElementById('stepSimulationButton').disabled = true;
        document.getElementById('runSimulationButton').innerHTML = "Run Simulation";
    }

})

/**
 * EventListener for the 'stepSimulationButton'
 * If Animation is turned off, it triggers the fastSimulationStep function.
 * If Animation is turned on, it simulates&animates one simulation step.
 * Checks for special conditions (e.g., no starting state defined or starting simulation on accept/reject state),
 * enables/disables relevant buttons accordingly.
 */
document.getElementById('stepSimulationButton').addEventListener('click', function(){
    //Case 1: Animation off -> FastSimulation
    if(!document.getElementById('fastSimulation').checked){
            fastSimulationStep();
            return;
    }
    
    //Case 2: Animation on
    //catch first simulation step
    if(currentState === undefined){
        currentState = turingMachine.startstate;
    }
    //catch startstate not defined
    if(turingMachine.startstate === undefined){
        alert("Please create Starting State first");
        return;
    }
    //catch starting simulation on accept/reject state
    if(currentState === turingMachine.acceptstate || 
        turingMachine.rejectstate.has(currentState)){
        //animate last state & call simulationResult
        animateNode(currentState, 2*1000/document.getElementById('simulationSpeed').value);
        turingMachine.simulationResult(currentState);
        
        //enable buttons
        enableButtons();
        document.getElementById('runSimulationButton').innerHTML = "Run Simulation"
        document.getElementById('runSimulationButton').disabled = true;
        document.getElementById('stepSimulationButton').disabled = true;
        return;
    }

    //disable buttons during simulation
    disableButtons("all");

    //CORE
    animateSimulationStep(turingMachine, currentState, turingMachine.readTape());
    //run Simulation in TuringMachine.js on turingMachine object to get next state
    currentState = turingMachine.simulationStep(currentState, turingMachine.readTape());
})

/**
 * EventListener for 'resetSimulationButton'
 * resets currentState to turingMachine.startstate.
 * Animates a quick blink on the start state and re-enables buttons that might have been disabled at end of the simulation.
 */
document.getElementById('resetSimulationButton').addEventListener('click', function(){
    //set Simulation state to startstate
    currentState = turingMachine.startstate;
    //quickly blink start state
    animateNode(currentState, 200);
    //reenable buttons that might have been disabled at end of simulation
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
 * Aborts after 5 seconds telling the user that the TM might continue running forever
 * Runs Simulation fully within turingMachine object, adjusting cyTape accordingly at end of Simulation.
 */
function fastSimulation(){
    disableButtons();
    //run Simulation in TuringMachine.js on turingMachine object to get next state
    let charOnTape = turingMachine.readTape()

    //catch first iteration
    if(currentState === undefined){
        currentState = turingMachine.startstate;
    }
    //catch no startstate
    if(turingMachine.startstate === undefined){
        alert("Please create Starting State first");
        return;
    }

    //limit run time to 5 seconds
    const startTime = new Date().getTime();
    const timeLimit = 5000;
    while(
        currentState !== turingMachine.acceptstate &&
        !turingMachine.rejectstate.has(currentState) &&
        new Date().getTime() - startTime < timeLimit){
        
        //CORE
        currentState = turingMachine.simulationStep(currentState, charOnTape);
        charOnTape = turingMachine.readTape();
    }
    //simulation timeout
    if(new Date().getTime() - startTime >= timeLimit){
        tmTapetoCyto();
        enableButtons();
        alert("Simulation timed out after 5 seconds, maybe it would run forever");
    }

    else if(currentState == turingMachine.acceptstate ||
        turingMachine.rejectstate.has(currentState)){
            //simulation finished
            tmTapetoCyto();
            turingMachine.simulationResult(currentState);
            enableButtons();
            document.getElementById('runSimulationButton').disabled = true;
            document.getElementById('stepSimulationButton').disabled = true;
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
        alert("Please create Starting State first");
        return;
    }

    let charOnTape = turingMachine.readTape()
    //get next state
    currentState = turingMachine.simulationStep(currentState, charOnTape);
    //cyto
    tmTapetoCyto();

    //catch last state reached
    if(currentState === turingMachine.acceptstate || turingMachine.rejectstate.has(currentState)){
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
 * [Animation slider on] User Presses Simulation Button -> 
 *          animRunSimulation() -> [
 *          animateSimulationStep() [-> animateNode() -> animateTapeRead() -> animateEdge() ->
 *              animateTapeWrite() -> animateTapeMovement() -> fixTapePosition()]
 *          ]
 * repeats until user pauses simulation or simulation reaches Accept/Reject state
 * 
 * Simulation Step with Animation works as Follows:
 * [Animation slider on] User Presses Step Button ->
 *          animateSimulationStep() [-> animateNode() -> animateTapeRead() -> animateEdge() ->
 *              animateTapeWrite() -> animateTapeMovement() -> fixTapePosition()]
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
    //do until pausing & final state reached
    while(simIsRunning && 
        currentState !== turingMachine.acceptstate &&
        !turingMachine.rejectstate.has(currentState)){

        disableButtons();

        //run animation
        //recalculate animation time
        animationTime = 1000/document.getElementById('simulationSpeed').value;
        animateSimulationStep(turingMachine, currentState, charOnTape);
        //wait for animation step to finish
        await new Promise(resolve => setTimeout(resolve, 8*animationTime+350));
        //wait an additional 100ms (added to resolve problem of older cpus not fully completing animation)
        await new Promise(resolve => setTimeout(resolve, 100));

        //run Simulation in TuringMachine.js on turingMachine object to get next state
        currentState = turingMachine.simulationStep(currentState, charOnTape);
        if(currentState === null){
            //error occured in turingMachine.simulationStep, no transition found
            simIsRunning = false;
            break;
        }
        charOnTape = turingMachine.readTape();
    }
    if(simIsRunning){
        //accept or reject state reached, disable simIsRunning
        simIsRunning = false;
    }
}

/**
 * 
 * Core Function that handles single Simulation/Animation step by calling the responsible Animation Functions
 * 
 * @param {TuringMachine} turingMachine - TM object the simulator works with
 * @param {State} tmState - State the Simulation step starts on
 * @param {char} charOnTape - Char on tape at simulation start
 */
async function animateSimulationStep(turingMachine, tmState, charOnTape){
    //read animationTime
    let animationTime = 1000/document.getElementById('simulationSpeed').value;
    let deltaValue = null;

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

    //// animate node fade in
    animateNodeIn(tmState, animationTime);
    await new Promise(resolve => setTimeout(resolve, animationTime+10));

    //// animate tape read
    animateTapeRead(animationTime);
    await new Promise(resolve => setTimeout(resolve, 2*(animationTime+10)));

    //// animate edge fade in
    animateEdgeIn(tmState, charOnTape, animationTime);
    await new Promise(resolve => setTimeout(resolve, (animationTime+10)));

    //// animate tape write
    animateTapeWrite(deltaValue[1], animationTime)
    await new Promise(resolve => setTimeout(resolve, (animationTime+100)));

    //// animate tape movement
    animateTapeMovement(deltaValue[2], animationTime)
    await new Promise(resolve => setTimeout(resolve, (animationTime+100)));

    //// animate node fade out & edge fade out
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
        //animate last state & call simulationResult
        animateNode(deltaValue[0], 2*animationTime);
        await new Promise(resolve => setTimeout(resolve, 2*animationTime));
        turingMachine.simulationResult(deltaValue[0]);
        
        //enable buttons
        enableButtons();
        document.getElementById('runSimulationButton').innerHTML = "Run Simulation"
        document.getElementById('runSimulationButton').disabled = true;
        document.getElementById('stepSimulationButton').disabled = true;
    }
}

//reset simulation back to startstate. Used when loading new TM.
function simulationReset(){
    currentState = turingMachine.startstate;
}

//////////////////////////////////////////////////////////////
//// ----------------- Animation Steps ------------------ ////
//////////////////////////////////////////////////////////////
//These funcitons are all called by core function animateSimulationStep()

/**
 * 
 * Runs blinking Animation on cytoNode for @param animationTime ms
 * Replaced by animateNodeIn & animateNodeOut for animation during simulation
 * 
 * @param {State} tmState - Node to run animation on
 * @param {number} animationTime - The duration of the animation in milliseconds.
 */

function animateNode(tmState, animationTime){
    //get cyto node
    let cyCurrentNode = cy.getElementById(tmState.id);
    //get node color
    let originalColor = cyCurrentNode.style("background-color");
    //animate (fade in)
    cyCurrentNode.animate({
        style: {
            "background-color": `${animationColor}`,
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

/**
 * Animates fade in given by @param tmState.
 * 
 * @param {State} tmState - The Turing state for which the node should be animated.
 * @param {number} animationTime - The duration of the animation in milliseconds.
 */
function animateNodeIn(tmState, animationTime){
    //get cyto node
    let cyCurrentNode = cy.getElementById(tmState.id);
    //set node original color
    originalColorNode = cyCurrentNode.style("background-color");
    //animate (fade in)
    cyCurrentNode.animate({
        style: {
            "background-color": `${animationColor}`,
        },
    },
    {
        duration: animationTime,
    })
}
/**
 * Animates fade out of node given by tmState.
 * 
 * @param {State} tmState - The Turing state for which the node should be animated.
 * @param {number} animationTime - The duration of the animation in milliseconds.
 */
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
 * Runs blinking Animation on Tapeobject at cursor location for animationTime ms
 * 
 * @param {number} animationTime - The duration of the animation in milliseconds.
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
            "background-color": `${animationColor}`,
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
 * Runs blinking Animation on correcsponding Edge for animationTime ms
 * replaced by animateEdgeIn & animateEdgeOut, hence left unused
 * 
 * @param {State} tmState - State from which the edge originates
 * @param {char} charOnTape - charOnTape for this animation step
 * @param {number} animationTime - animationTime in ms
 */
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
            }
            );
        }
        }
        );
    }
}

/**
 * 
 * Runs fade-in Animation on corresponding Edge for animationTime ms
 * 
 * @param {State} tmState - State from which the edge originates
 * @param {char} charOnTape - charOnTape for this animation step
 * @param {number} animationTime - animationTime in ms
 */
function animateEdgeIn(tmState, charOnTape, animationTime){
    //find corresponding edge
    edgeToAnimate = null;
    let elseEdgeToAnimate = null;
    //helper that detects edges from superstate (return null if not found)
    edgeToAnimate = getLocalEdge(tmState, charOnTape);

    if(edgeToAnimate === null){
        //standard case
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
        if(edgeToAnimate === null && elseEdgeToAnimate !== null){
            edgeToAnimate = elseEdgeToAnimate;
        }
    }

    //Animation
    if(edgeToAnimate != null){
        originalColorEdge = edgeToAnimate.style("line-color");
        edgeToAnimate.animate({
            style: {
                "line-color": `${animationColor}`,
                "color": `${animationColor}`
            },
            },
            {
            duration: animationTime,
            })
    }
}

/**
 * 
 * Runs fade-out Animation on corresponding Edge for animationTime ms
 * 
 * @param {State} tmState - State from which the edge originates
 * @param {char} charOnTape - charOnTape for this animation step
 * @param {number} animationTime - animationTime in ms
 */
function animateEdgeOut(tmState, charOnTape, animationTime){
    //find corresponding edge
    //done in animateEdgeIn

    //Animation
    if(edgeToAnimate != null){
        edgeToAnimate.animate({
            style: {
                "line-color": `${originalColorEdge}`,
                "color": "black",
            },
            },
            {
            duration: animationTime,
            })
    }
}


/**
 * 
 * Animate Tape Write writing happened, just calls the cyWriteCurrentPos() from CytoscapeTape.js
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
 * Runs Move Tape animation (calls functions from CytoscapeTape.js)
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
 * detects and handles the special case of a local Edge being used for animation (= edge from super state)
 *
 */
function getLocalEdge(tmState, charOnTape){
    let elseEdgeToAnimate = null;
    let returnEdge = null;
    let delta;
    
    //get all children
    let childs = currTreeNode.children;
    //for all childs, 
    for(let i = 0; i<childs.length; i++){
        //check if current node = accept node of child
        if (childs[i].turingMachine.acceptstate.id === tmState.id){
            //TRUE! find corresponding edge (take both nodes into account!) & return it
            const outgoingEdges = cy.getElementById(childs[i].superNodeId).outgoers('edge');
            outgoingEdges.forEach(edge => {
                if(edge.data().readToken === charOnTape){
                    returnEdge = edge;
                }
                //catch else edge
                else if (edge.data().readToken === 'else'){
                    elseEdgeToAnimate = edge;
                }
            })
            //case else edge
            if(returnEdge === null && elseEdgeToAnimate !== null){
                returnEdge = elseEdgeToAnimate;
            }
            delta = childs[i].turingMachine.delta
            //catch edge within subTM preferred
            for(const [key, value] of delta){
                if (key[0].id === tmState.id && key[1] === charOnTape){
                    return null;
                }
            }
        }
    }
    return returnEdge;
}

/**
 * 
 * Helper: disables all buttons that shouldn't be accessed during simulation
 * switches to move mode during simulation to disable user editing TM during simulation
 * 
 * @param {string} mode - use "all" to also disable runSimulationButton
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
    //automatically switch to move mode to avoid editing during animation
    var button = document.querySelector('.toggle-button');
    if(!button.classList.contains('active')){
        button.classList.toggle('active');
    }
    cyGrabifyNodes();

}
/**
 * Helper: ree-enables Buttons after Simulation finished
 * switches back to edit mode
 */
function enableButtons(){
    document.getElementById('runSimulationButton').disabled = false;
    document.getElementById('stepSimulationButton').disabled = false;
    document.getElementById('resetSimulationButton').disabled = false;
    document.getElementById('move-tape-right').disabled = false;
    document.getElementById('move-tape-left').disabled = false;
    document.getElementById('tape-input').disabled = false;
    document.getElementById('fastSimulation').disabled = false;
    //switch to move mode off again
    var button = document.querySelector('.toggle-button');
    if(button.classList.contains('active')){
        button.classList.toggle('active');
    }
    cyGrabifyNodes();
}
