import cytoscape from '../node_modules/cytoscape/dist/cytoscape.esm.min.js';

//Tape object
//Globals
const width = 40;
const height = 40;
const animationTime = 50;
let rightOverflow = '';
let leftOverflow = '';

//cytoscape object
var cyTape = cytoscape({
    container: document.getElementById('cytoscape-tape'),
    style: [
    {
        selector: 'nodes',
        style: {
            shape: 'rectangle',
            'background-color': 'lightgrey',
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
    rightOverflow = "";
    leftOverflow = "";
    for(let i = 0; i<17; i++){
        cyTape.add({
            group: 'nodes',
            data: {id: i},
            position: { x: width/2 + i*width, y: height/2+10 },
            style: {
                'label': "",
                'text-valign': "center",
                'text-halign': "center",
            }
            
        });
    }
    //lock node movement
    cyTape.nodes().lock();
}
cyCreateTape();

//moves tape to left (adds & removes nodes & does animation)
function cyMoveTapeLeft(){
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

    //add node
    cyTape.add({
        group: 'nodes',
        data: { id: id },
        position: { x: Math.floor(xcoor + width), y: ycoor },
        style:{
            'background-color': `grey`,
            'label': `${readToken}`,
            'text-valign': "center",
            'text-halign': "center",
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

    ////Logging
    console.log("moved left: new node: ", "xcoor:", Math.floor(xcoor+width), "ycoor: ", ycoor, "id: ", id);
    console.log("LOF:", leftOverflow, "ROF:", rightOverflow);
}
document.getElementById("move-tape-left").addEventListener("click", cyMoveTapeLeft);


//moves tape to right (adds & removes nodes & does animation)
function cyMoveTapeRight(){
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

    
    //add node
    cyTape.add({
        group: 'nodes',
        data: { id: id },
        position: { x: Math.ceil(xcoor - width), y: ycoor },
        style:{
            'background-color': `grey`,
            'label': `${readToken}`,
            'text-valign': "center",
            'text-halign': "center",
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

    ////Logging
    console.log("moved right: new node: ", "xcoor:", Math.ceil(xcoor - width), "ycoor: ", ycoor, "id: ", id);
    console.log("LOF:", leftOverflow, "ROF:", rightOverflow);
}
document.getElementById("move-tape-right").addEventListener("click", cyMoveTapeRight);

function cyWriteOnTape(input){
    //clear tape
    cyTape.nodes().remove();
    cyCreateTape();
    //write on visible tape starting from middle
        //get id of middle object
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
    let middleid = (maxid+minid)/2;
    console.log("minid", minid, "middleid", middleid, "maxid", maxid);
        //write on tape until maxid
    let currid = middleid;
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
                'background-color': `grey`,
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

        //update iterator
        i++;
        currid++;
    }
    //safe rest of string to residual
    while(input.length - 1 >= i){
        rightOverflow = input[i] + rightOverflow;
        i++;
    }
}
document.getElementById("tape-input").addEventListener("click", function(){
    cyWriteOnTape(document.getElementById("tape-input-field").value);
});