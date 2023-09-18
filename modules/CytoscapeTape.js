import cytoscape from '../node_modules/cytoscape/dist/cytoscape.esm.min.js';

//Tape object
//Globals
const width = 40;
const height = 40;
const animationTime = 50;

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

//create tape (17 Elements)
function cyCreateTape(){
    for(let i = 0; i<17; i++){
        cyTape.add({
            group: 'nodes',
            data: { id: i+10000 },
            position: { x: width/2 + i*width, y: height/2 },
            style: {
                'label': `${i}`,
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

    //add node
    cyTape.add({
        group: 'nodes',
        data: { id: id },
        position: { x: Math.floor(xcoor + width), y: ycoor },
        style:{
            'background-color': `grey`,
            'label': `${id-10000}`,
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
    //add node
    cyTape.add({
        group: 'nodes',
        data: { id: id },
        position: { x: Math.ceil(xcoor - width), y: ycoor },
        style:{
            'background-color': `grey`,
            'label': `${id-10000}`,
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

}
document.getElementById("move-tape-right").addEventListener("click", cyMoveTapeRight);
