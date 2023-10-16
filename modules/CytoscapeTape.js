import cytoscape from '../node_modules/cytoscape/dist/cytoscape.esm.min.js';
import { turingMachine } from './TuringMachine.js';

export {cyTape, cyWriteCurrentPos, cyMoveTapeLeft, cyMoveTapeRight, getWriteNodeId, cyTapeClear, cyWriteOnTape, fixTapePosition, tmTapetoCyto};

//------ global variables ------//
//width & height of tape cell
const width = 40;
const height = 40;
//overflow to save tape content not visible
let rightOverflow = '';
let leftOverflow = '';
//declares on certain parts if function is used in simulation mode or manually
let simulation = true;

//cytoscape object
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
    {
        selector: 'edge',
        style: {
            //add global edge styling here
        }
        
    }],

    // disable panning & zooming
    zoomingEnabled: false,
    userPanningEnabled: false,
});

//create tape (17 Elements) (reset tape)
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
cyCreateTape();

//moves tape to left (adds & removes nodes & does animation)
function cyMoveTapeLeft(animationTime){
    //add node to right end
    //get coordinates & id dynamically
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

    //write from&to residual if necessary
    //write from rightresidual if any value
    let readToken;
    if(rightOverflow.length !== 0){
        readToken = rightOverflow[rightOverflow.length-1];
        rightOverflow = rightOverflow.substring(0, rightOverflow.length-1)
    }
    else{
        readToken = '';
    }
    //write to rightresidual if any value (if not, write blank to residual)
    if(lowestXElement.style('label') !== ''){
        leftOverflow += lowestXElement.style('label');
    }
    else{
        leftOverflow += " ";
    }

    let color;

    if(readToken === " "){
        readToken = "";
        color = "darkgrey";
    }
    else{
        color = "lightgrey";
    }

    //add node
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
    
    //move nodes animation (&remove node after animation)
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

    
    //adjust TMobject tape (if not in simulation mode)
    if(!simulation){
        if(turingMachine.tapePosition === turingMachine.tape.length-1){
            console.log("expanding tape to right");
            turingMachine.tape.push("");
        }
        turingMachine.tapePosition++;
        console.log("Tape: " + turingMachine.tape + " " + turingMachine.tapePosition);
    }

    ////Logging
    console.log("moved left: new node: ", "xcoor:", Math.floor(xcoor+width), "ycoor: ", ycoor, "id: ", id);
    console.log("LOF:", leftOverflow, "ROF:", rightOverflow);
}
document.getElementById("move-tape-left").addEventListener("click", function(){
    simulation = false;
    let animationTime = 1000/document.getElementById('simulationSpeed').value;
    cyMoveTapeLeft(animationTime)
    deactivateButtons(animationTime);
    simulation = true;
});



//moves tape to right (adds & removes nodes & does animation)
function cyMoveTapeRight(animationTime){
    //get coordinates & id dynamically
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

    //write from&to residual if necessary
    //write from leftresidual if any value
    let readToken;
    if(leftOverflow.length !== 0){
        readToken = leftOverflow[leftOverflow.length-1];
        leftOverflow = leftOverflow.substring(0, leftOverflow.length-1)
    }
    else{
        readToken = '';
    }
    //write to rightresidual if any value
    if(highestXElement.style('label') !== ''){
        rightOverflow += highestXElement.style('label');
    }
    else{
        rightOverflow += " ";
    }

    let color;

    if(readToken === " " || readToken == ""){
        readToken = "";
        color = "darkgrey";
    }
    else{
        color = "lightgrey";
    }

    
    //add node
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
    //move nodes animation (&remove node after animation)
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

    //adjust TM tape (if not in simulation mode)
    if(!simulation){
        if(turingMachine.tapePosition === 0){
            console.log("expanding tape to left");
            turingMachine.tape.unshift("");
            turingMachine.tapePosition++;
        }
        turingMachine.tapePosition--;
        console.log("Tape: " + turingMachine.tape + " " + turingMachine.tapePosition);
    }


    ////Logging
    console.log("moved right: new node: ", "xcoor:", Math.ceil(xcoor - width), "ycoor: ", ycoor, "id: ", id);
    console.log("LOF:", leftOverflow, "ROF:", rightOverflow);
}
document.getElementById("move-tape-right").addEventListener("click", function(){
    simulation = false;
    let animationTime = 1000/document.getElementById('simulationSpeed').value;
    cyMoveTapeRight(animationTime)
    deactivateButtons(animationTime);
    simulation = true;
});

//animate write on tape & handles turingMachine object
function cyWriteOnTape(input, animationTime){
    //clear tape
    cyTape.nodes().remove();
    cyCreateTape();
    //write on visible tape starting from position 8
    //get id of position 8 object
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
    let writeid = minid + 8;
    console.log("minid", minid, "writeid", writeid, "maxid", maxid);
    //write on tape until maxid
    let currid = writeid;
    let i = 0;
    while((currid <= maxid) && ((input.length - 1) >= i)){
        //get token
        let currToken = input[i];
        //variables
        let currNode = cyTape.getElementById(currid);
        let currNodeId = currNode.id();
        let currNodeX = currNode.position().x;
        let currNodeY = currNode.position().y;
        //delete old node
        // -- TO DO -- remove animation
        currNode.remove();
        //create new node (animate fade in)
        cyTape.add({
            group: 'nodes',
            data: { id: currNodeId },
            position: { x: currNodeX, y: currNodeY-10},
            style:{
                'background-color': 'lightgrey',
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
    //safe rest of string to residual
    while(input.length - 1 >= i){
        rightOverflow = input[i] + rightOverflow;
        //expand turingMachine tape object
        turingMachine.tape.push(input[i]);
        i++;


    }
    //set cursor of turingMachine object accordingly
    turingMachine.tapePosition = writeid;

    ////logging
    console.log("TM tape now: ", turingMachine.tape);
    console.log("TM tapePosition: ", turingMachine.tapePosition, "char: ", turingMachine.readTape());

}
document.getElementById("tape-input").addEventListener("click", function(){
    cyWriteOnTape(document.getElementById("tape-input-field").value, 
                    1000/document.getElementById('simulationSpeed').value
                );
});


function cyWriteCurrentPos(inputToken, animationTime){
    cyTape.nodes().lock();
    //get id of middle object
    let middleid = getWriteNodeId();

    //animate writing node
    let currNode = cyTape.getElementById(middleid);
    let currNodeId = currNode.id();
    let currNodeX = currNode.position().x;
    let currNodeY = currNode.position().y;
    //remove old node
    currNode.remove();
    //create new node (animate fade in)
    cyTape.add({
        group: 'nodes',
        data: { id: currNodeId },
        position: { x: currNodeX, y: currNodeY-10},
        style:{
            'background-color': 'lightgrey',
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

//fixes tape position (if animation didnt work correctly)
function fixTapePosition(){
    //get 8th elements position
    let cursorid = getWriteNodeId();
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
        console.log(minid, " ", cursorid, " ", maxid);
        console.log(tapeContent);

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

//write turingMachine.tape to Cytoscape Tape (also handles left & right overflow)
function tmTapetoCyto(){
    let numElements = 41
    console.log("TAPEPOS:", turingMachine.tapePosition);
    console.log("Tape A:", turingMachine.tape);

    rightOverflow = "";
    leftOverflow = "";

    let shift = 0;

    ////ensure tape position 8
    //expand tm array to left if necessary
    while(turingMachine.tapePosition < 8){
        turingMachine.tape.unshift("");
        turingMachine.tapePosition++;

    }
    //shift left if possible
    let j = 0;
    while(turingMachine.tapePosition > 8 && turingMachine.tape[0] === ""){
        turingMachine.tape.shift();
        turingMachine.tape.push("");
        turingMachine.tapePosition--;
    }
    //account for leftoverflow:
    if(turingMachine.tapePosition > 8){
        //add to leftoverflow
        shift = turingMachine.tapePosition-8
        for(let k = 0; k<shift; k++){
            leftOverflow += turingMachine.tape[k];
        }
    }

    console.log("Tape B:", turingMachine.tape);
    console.log("TAPEPOS:", turingMachine.tapePosition);


    cyTape.nodes().remove();

    let color;
    console.log("SHIFT: ", shift);
    for(let i = 0+shift; i<numElements+shift; i++){
        if(turingMachine.tape[i] === ""){
            color = "darkgrey";
        }
        else{
            color = "lightgrey";
        }
        //catch index out of bounds
        if(i >= turingMachine.tape.length){
            cyTape.add({
                group: 'nodes',
                data: {id: i},
                position: { x: (i-shift)*width, y: height/2+10 },
                style: {
                    'label': `""`,
                    'text-valign': "center",
                    'text-halign': "center",
                    'background-color': `darkgrey`,
                }
                
            });
            
        }
        else{
            //normal
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

        j++;
    }
    //add remaining nodes to rightOverflow
    while(j < turingMachine.tape.length){
        rightOverflow += turingMachine.tape[j];
        j++;
    }
    //lock node movement
    cyTape.nodes().lock();
}



//Helper to get id of middle node
function getWriteNodeId(){
    let minid = Number.POSITIVE_INFINITY;
    cyTape.nodes().forEach(element => {
        let currid = parseInt(element.id());
        if(minid > currid){
            minid = currid;
        }

    })
    let writeid = minid+8;
    return writeid;
}

//Helper to clear canvas (used in Presets.js)
function cyTapeClear(){
    cyTape.nodes().remove();
    cyCreateTape();
}

//Helper: disables MoveTapeRigth & MoveTapeLeft buttons until animation complete
//user in manual moving of tape
async function deactivateButtons(time){
    document.getElementById("move-tape-left").disabled = true;
    document.getElementById("move-tape-right").disabled = true;

    await new Promise(resolve => setTimeout(resolve, time+10));

    document.getElementById("move-tape-left").disabled = false;
    document.getElementById("move-tape-right").disabled = false;
}