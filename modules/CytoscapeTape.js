/*
  Author: Mauro Vogel
  Date: January 2024
  
  Description: 
    - Defines cytoscape Tape object cyTape (used for tape representation)
    - Provides functionality to manipulate, control & animate cyTape & change turingMachine.tape with it 
    - Ensure pseudoinifinte behaviour of Tape
    - Event Listeners for buttons manipulating the tape

  Dependencies/Imports:
    - cytoscape Library
    - global Turing Machine object

  Exports:
    - Shared variable cyTape
    - Functions to manipulate visible tape
*/

import cytoscape from '../node_modules/cytoscape/dist/cytoscape.esm.min.js';
import { turingMachine } from './TuringMachine.js';

export {cyTape, cyWriteCurrentPos, cyMoveTapeLeft, cyMoveTapeRight, getWriteNodeId, cyTapeClear, cyWriteOnTape, fixTapePosition, tmTapetoCyto};

//------ global variables ------//
//width & height of tape cell
const width = 40;
const height = 40;
//overflow strings to save tape content not visible
let rightOverflow = '';
let leftOverflow = '';
//declares on certain parts if function is used in simulation mode or manually
let simulation = true;
//which node (counted from the left) is under the tape head
let nodeAtHead = 8;

//////////////////////////////////////////////////////////////
//// ----------------- cyTape object -------------------- ////
//////////////////////////////////////////////////////////////

/**
 * Cytoscape Global Configuration Object
 *
 * cyTape is initializes by Cytoscape instance with specified container, style, and interaction settings.
 * Global style properties are set here
*/
var cyTape = cytoscape({
    container: document.getElementById('cytoscape-tape'),
    style: [
    {
        selector: 'nodes',
        style: {
            shape: 'rectangle',
            'background-color': 'darkgrey',
            'width': `${width}px`,
            'height': `${height}px`,
            'border-width': `1px`, // Set the border width for the nodes
            'border-color': `black`,
        }
    },
],
    // disable panning & zooming
    zoomingEnabled: false,
    userPanningEnabled: false,
});

//////////////////////////////////////////////////////////////
//// ----------------- Tape creation -------------------- ////
//////////////////////////////////////////////////////////////

/**
 * Creates/Resets Tape (with 41 elements [fullscreen 1080p]) all empty & darkgrey
 * sideffect: Initializes turingMachine.tape to array of length 41 filled with ""
 */
function cyCreateTape(){
    let numElements = 41

    rightOverflow = "";
    leftOverflow = "";
    for(let i = 0; i<numElements; i++){
        cyTape.add({
            group: 'nodes',
            data: {id: i},
            position: { x: i*width, y: height/2+10 },
            style: {
                'label': "",
                'text-valign': "center",
                'text-halign': "center",
            }
            
        });
    }
    //lock node movement
    cyTape.nodes().lock();
    //initialize TM Array to all empty strings
    turingMachine.tape = Array.from({ length: 41 }, () => "");
}
//call at module load to initialize Tape when loading webpage
cyCreateTape();


//////////////////////////////////////////////////////////////
//// ----------------- Tape movement -------------------- ////
//////////////////////////////////////////////////////////////

/**
 * 
 * Handles Tape Movement Left (=tape head right), covers:
 *  - Handle LeftOverflow / RightOverflow strings
 *  - Adds node to right end of tape & removes leftmost element
 *  - Move Nodes animation
 *  - adjusts turingMachine.tape (if global variable simulation=false)
 * 
 * @param {number} animationTime - Animation Time in ms
 */
function cyMoveTapeLeft(animationTime){
    //Part 1: initial calculations
    //get coordinates & cyto node id dynamically
    let minxcoor = Number.POSITIVE_INFINITY;
    let lowestXElement = null;
    let xcoor = 0;
    let ycoor = 0;
    let id = 0;
    cyTape.nodes().forEach(element => {
        //get y coor
        ycoor = element.position().y;
        //get highest x coor
        let xpos = element.position().x;
        if(xpos > xcoor){
            xcoor = xpos;
        }
        //get lowest x coor & element
        if(xpos < minxcoor){
            minxcoor = xpos;
            lowestXElement = element;
        }
        //get highest element id
        if(parseInt(element.id()) > id){
            id = element.id();
        }
    })
    id = parseInt(id)+1;

    //Part 2: write from&to LeftOverflow / RightOverflow if necessary
    //read from rightOverflow
    let readToken;
    if(rightOverflow.length !== 0){
        readToken = rightOverflow[rightOverflow.length-1];
        rightOverflow = rightOverflow.substring(0, rightOverflow.length-1)
    }
    else{
        readToken = '';
    }
    //write to leftOverflow
    if(lowestXElement.style('label') !== ''){
        leftOverflow += lowestXElement.style('label');
    }
    else{
        leftOverflow += " ";
    }

    //determine color of new node
    let color;
    if(readToken === " " || readToken === ""){
        readToken = "";
        color = "darkgrey";
    }
    else{
        color = "lightgrey";
    }

    //Part 3: add node to right end
    cyTape.add({
        group: 'nodes',
        data: { id: id },
        position: { x: Math.floor(xcoor + width), y: ycoor },
        style:{
            'label': `${readToken}`,
            'text-valign': "center",
            'text-halign': "center",
            'background-color': `${color}`
        }
    });
    
    //Part 4: move nodes animation (&remove node after animation)
    cyTape.nodes().unlock();
    var nodesToMove = cyTape.nodes();
    nodesToMove.forEach(element => {
        var newPosition = {x: Math.floor(element.position().x-width), y: element.position().y}
        element.animate({
            position: newPosition,
            duration: animationTime,
            easing: 'ease-in-out'
        },
        {
            complete: function(){
                //remove node from left end
                lowestXElement.remove()
                cyTape.nodes().lock();
            }
        
        })
    });

    
    //Part 5: adjust turingMachine tape (if not in simulation mode)
    if(!simulation){
        if(turingMachine.tapePosition === turingMachine.tape.length-1){
            turingMachine.tape.push("");
        }
        turingMachine.tapePosition++;
    }
}
//Event Listener for Button manually moving tape to left
document.getElementById("move-tape-left").addEventListener("click", function(){
    simulation = false;
    let animationTime = 1000/document.getElementById('simulationSpeed').value;
    cyMoveTapeLeft(animationTime)
    deactivateMoveButtons(animationTime);
    simulation = true;
});



/**
 * 
 * Handles Tape Movement Right (=tape head left), covers:
 *  - Handle LeftOverflow / RightOverflow strings
 *  - Adds node to left end of tape & removes rightmost element
 *  - Move Nodes animation
 *  - adjusts turingMachine.tape (if global variable simulation=false)
 * 
 * @param {number} animationTime - Animation Time in ms
 */
function cyMoveTapeRight(animationTime){
    //Part 1: initial calculations
    //get coordinates & cyto node id dynamically
    let maxxcoor = 0;
    let highestXElement = null;
    let xcoor = Number.POSITIVE_INFINITY;
    let ycoor = 0;
    let id = Number.POSITIVE_INFINITY;
    cyTape.nodes().forEach(element => {
        //get y coor
        ycoor = element.position().y;
        //get lowest x coor
        let xpos = element.position().x;
        if(xpos < xcoor){
            xcoor = xpos;
        }
        //get highest x coor & element
        if(xpos > maxxcoor){
            maxxcoor = xpos;
            highestXElement = element;
        }
        //get lowest element id
        if(parseInt(element.id()) < id){
            id = element.id();
        }
    })
    id = parseInt(id) - 1;

    //Part 2: write from&to LeftOverflow / RightOverflow if necessary
    //read from leftOverflow
    let readToken;
    if(leftOverflow.length !== 0){
        readToken = leftOverflow[leftOverflow.length-1];
        leftOverflow = leftOverflow.substring(0, leftOverflow.length-1)
    }
    else{
        readToken = '';
    }
    //write to rightOverflow
    if(highestXElement.style('label') !== ''){
        rightOverflow += highestXElement.style('label');
    }
    else{
        rightOverflow += " ";
    }

    //determine color of node
    let color;
    if(readToken === " " || readToken == ""){
        readToken = "";
        color = "darkgrey";
    }
    else{
        color = "lightgrey";
    }

    //Part 3: add node to left end
    cyTape.add({
        group: 'nodes',
        data: { id: id },
        position: { x: Math.ceil(xcoor - width), y: ycoor },
        style:{
            'label': `${readToken}`,
            'text-valign': "center",
            'text-halign': "center",
            'background-color': `${color}`
        }
    });

    //Part 4: move nodes animation (&remove node after animation)
    cyTape.nodes().unlock();
    var nodesToMove = cyTape.nodes();
    nodesToMove.forEach(element => {
        var newPosition = {x: Math.ceil(element.position().x+width), y: element.position().y}
        element.animate({
            position: newPosition,
            duration: animationTime,
            easing: 'ease-in-out'
        },
        {
            complete: function(){
                //remove node from left end
                highestXElement.remove()
                cyTape.nodes().lock();
            }
        
        })
    });

    //Part 5: adjust turingMachine tape (if not in simulation mode)
    if(!simulation){
        if(turingMachine.tapePosition === 0){
            turingMachine.tape.unshift("");
            turingMachine.tapePosition++;
        }
        turingMachine.tapePosition--;
    }
}
//Event Listener for Button manually moving tape to right
document.getElementById("move-tape-right").addEventListener("click", function(){
    simulation = false;
    let animationTime = 1000/document.getElementById('simulationSpeed').value;
    cyMoveTapeRight(animationTime)
    deactivateMoveButtons(animationTime);
    simulation = true;
});


//////////////////////////////////////////////////////////////
//// --------------- manipulate Tape -------------------- ////
//////////////////////////////////////////////////////////////

/**
 * 
 * does the following things:
 *  - clear tape
 *  - write input letter by letter onto tape starting from position nodeAtHead(or to RightOverflow for longer input)
 *  - adjusts turingMachine.tape accordingly
 * 
 * @param {string} input - input that is written on tape
 * @param {number} animationTime - animation Time in ms
 */
function cyWriteOnTape(input, animationTime){
    //clear tape
    cyTape.nodes().remove();
    cyCreateTape();
    //write on visible tape starting from position nodeAtHead (cursor position)
    //get id of position nodeAtHead object
    let maxid = Number.NEGATIVE_INFINITY;
    let minid = Number.POSITIVE_INFINITY;
    cyTape.nodes().forEach(element => {
        let currid = parseInt(element.id());
        if(minid > currid){
            minid = currid;
        }
        if(maxid < currid){
            maxid = currid;
        }
    })
    let writeid = minid + nodeAtHead;

    //write on tape until maxid
    let currid = writeid;
    let i = 0;
    while((currid <= maxid) && ((input.length - 1) >= i)){
        let currToken = input[i];
        let currNode = cyTape.getElementById(currid);
        let currNodeId = currNode.id();
        let currNodeX = currNode.position().x;
        let currNodeY = currNode.position().y;
        //delete old node
        currNode.remove();
        //create new node (with fade in animation)
        let color = 'lightgrey';
        if(currToken === " "){
            currToken = "";
            color = 'darkgrey';
        }
        cyTape.add({
            group: 'nodes',
            data: { id: currNodeId },
            position: { x: currNodeX, y: currNodeY-10},
            style:{
                'background-color': `${color}`,
                'label': `${currToken}`,
                'text-valign': "center",
                'text-halign': "center",
                'opacity': 0,
            }
        }).animate({
            position: { x: currNodeX, y: currNodeY}, 
            style: {opacity: 1},
            duration: animationTime,               
            easing: 'ease-in-out'         
          },
          {
            complete: function(){
                cyTape.nodes().lock();
            }
        });

        //add to turingMachine tape object
        turingMachine.tape[currid] = currToken;
        //update iterator
        i++;
        currid++;
    }
    //safe rest of string to rightOverflow
    while(input.length - 1 >= i){
        rightOverflow = input[i] + rightOverflow;
        //expand turingMachine tape object
        turingMachine.tape.push(input[i]);
        i++;
    }
    //set cursor of turingMachine object accordingly
    turingMachine.tapePosition = writeid;
}
//Event Listener for "Write on Tape" button
document.getElementById("tape-input").addEventListener("click", function(){
    cyWriteOnTape(document.getElementById("tape-input-field").value, 
                    1000/document.getElementById('simulationSpeed').value
                );
});

/**
 * 
 * Writes token on Tape at cursor position (position nodeAtHead), 
 * used during Simulation.
 * 
 * @param {char} inputToken - token to be written on cursorposition
 * @param {number} animationTime - animation Time in ms
 */
function cyWriteCurrentPos(inputToken, animationTime){
    cyTape.nodes().lock();
    //get id of middle object
    let middleid = getWriteNodeId();

    ////animate writing node
    let currNode = cyTape.getElementById(middleid);
    let currNodeId = currNode.id();
    let currNodeX = currNode.position().x;
    let currNodeY = currNode.position().y;
    //remove old node
    currNode.remove();
    //create new node (animate fade in)
    let color = 'lightgrey'
    if(inputToken === ""){
        color = 'darkgrey';
    }
    cyTape.add({
        group: 'nodes',
        data: { id: currNodeId },
        position: { x: currNodeX, y: currNodeY-10},
        style:{
            'background-color': `${color}`,
            'label': `${inputToken}`,
            'text-valign': "center",
            'text-halign': "center",
            'opacity': 0,
        }
    }).animate({
        position: { x: currNodeX, y: currNodeY}, 
        style: {opacity: 1},
        duration: animationTime,               
        easing: 'ease-in-out'         
        },
        {
        complete: function(){
            cyTape.nodes().lock();
        }
    });

}

/**
 * Writes turingMachine.tape to Cytoscape Tape, also handles left & right overflow,
 * used in FastSimulation
 * side effect: manipulates turingMachine.tape & turingMachine.tapePosition, but without changing the tape
 */
function tmTapetoCyto(){
    let numElements = 41
    rightOverflow = "";
    leftOverflow = "";
    let shift = 0;

    ////ensure tapePosition nodeAtHead
    //expand tm array to left if necessary
    while(turingMachine.tapePosition < nodeAtHead){
        turingMachine.tape.unshift("");
        turingMachine.tapePosition++;
    }
    //shift left if possible
    while(turingMachine.tapePosition > nodeAtHead && turingMachine.tape[0] === ""){
        turingMachine.tape.shift();
        turingMachine.tape.push("");
        turingMachine.tapePosition--;
    }
    //account for leftoverflow:
    if(turingMachine.tapePosition > nodeAtHead){
        //add to leftoverflow
        shift = turingMachine.tapePosition-nodeAtHead
        for(let k = 0; k<shift; k++){
            leftOverflow += turingMachine.tape[k];
        }
    }

    //// create cyto tape
    cyTape.nodes().remove();
    let color;
    for(let i = 0+shift; i<numElements+shift; i++){
        if(turingMachine.tape[i] === ""){
            color = "darkgrey";
        }
        else{
            color = "lightgrey";
        }
        //catch index out of bounds (create empty nodes)
        if(i >= turingMachine.tape.length){
            cyTape.add({
                group: 'nodes',
                data: {id: i},
                position: { x: (i-shift)*width, y: height/2+10 },
                style: {
                    'label': "",
                    'text-valign': "center",
                    'text-halign': "center",
                    'background-color': `darkgrey`,
                }
                
            });
            
        }
        else{
            //normal (create nodes with label)
            cyTape.add({
                group: 'nodes',
                data: {id: i},
                position: { x: (i-shift)*width, y: height/2+10 },
                style: {
                    'label': `${turingMachine.tape[i]}`,
                    'text-valign': "center",
                    'text-halign': "center",
                    'background-color': `${color}`,
                }
                
            });
        }
    }

    //add remaining nodes to rightOverflow
    let j = numElements + shift;
    while(j < turingMachine.tape.length){
        rightOverflow += turingMachine.tape[j];
        j++;
    }
    //lock node movement
    cyTape.nodes().lock();
}

//////////////////////////////////////////////////////////////
//// ---------------- misc / helpers -------------------- ////
//////////////////////////////////////////////////////////////

/**
 * 
 * Helper: that gets cyto NodeID of node at cursor position (nodeAtHead)
 * 
 * @returns - cyTape Node ID of node being at position nodeAtHead (write position)
 */
function getWriteNodeId(){
    let minid = Number.POSITIVE_INFINITY;
    cyTape.nodes().forEach(element => {
        let currid = parseInt(element.id());
        if(minid > currid){
            minid = currid;
        }

    })
    let writeid = minid+nodeAtHead;
    return writeid;
}

/**
 * Helper: that clears Tape (delete & rebuild)
 */
function cyTapeClear(){
    cyTape.nodes().remove();
    cyCreateTape();
}

/**
 * 
 * Deactivates MoveTapeLeft & MoveTapeRight buttons during Tape movement animation,
 * used when manually moving tape
 * 
 * @param {number} time - how long the buttons should be deactivated
 */
async function deactivateMoveButtons(time){
    document.getElementById("move-tape-left").disabled = true;
    document.getElementById("move-tape-right").disabled = true;

    await new Promise(resolve => setTimeout(resolve, time+10));

    document.getElementById("move-tape-left").disabled = false;
    document.getElementById("move-tape-right").disabled = false;
}


/**
 * Fixes (rebuilds) cytoscape Tape if Tape movement animation didn't work properly
 * called after every Animation step.
 */
function fixTapePosition(){
    let cursorid = getWriteNodeId();
    //recreate tape if node too far out of position
    if(Math.abs(cyTape.getElementById(cursorid).position().x - 320) > 5){
        console.log("FIX TAPE triggered")
        let minid = Number.POSITIVE_INFINITY;
        let maxid = Number.NEGATIVE_INFINITY;
        let tapeContent = [];
        //get minid & maxid
        cyTape.nodes().forEach(element =>{
            let id = parseInt(element.id());
            if(id > maxid){
                maxid = id;
            }
            if(id < minid){
                minid = id;
            }
        })
        for(let i = minid; i<=maxid; i++){
            tapeContent.push(cyTape.getElementById(i).style("label"));
        }

        //create new tape
        cyTape.nodes().remove();
        let color;

        let j = 0;
        for(let i = minid; i<=maxid; i++){
            //coloring
            if(tapeContent[j] !== ""){
                color = "lightgrey"
            }
            else{
                color = "darkgrey"
            }
            cyTape.add({
                group: 'nodes',
                data: {id: i},
                position: { x: j*width, y: height/2+10 },
                style: {
                    'label': `${tapeContent[j]}`,
                    'text-valign': "center",
                    'text-halign': "center",
                    'background-color': `${color}`,
                }
                
            });
            j++;
        }
        cyTape.nodes().lock();
    }

}


