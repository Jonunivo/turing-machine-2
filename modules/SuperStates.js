import { Tree, TreeNode } from "../datastructures/Tree.js";
import { TuringMachine, turingMachine} from "./TuringMachine.js";
import { State } from "./State.js";

import { cy, cyClearCanvas, cyCreateEdge, cyCreateNode, generateNodePosMap, addEventListenerWithCheck } from "./Cytoscape.js";
import { nodePresetHelper, inEditMode } from "./UserInput.js";

export{addStateLocalTM, addEdgeLocalTM, editNodeLocalTM, editEdgeLocalTM, getLocalTM, getRootTM, getAcceptSubTM, getStartSubTM};

//Global Variables

//current TreeNode (initialized to empty TM = local TM of root)
var currTreeNode = new TreeNode(new TuringMachine(new Set(), new Set(), new Set(), new Map(), undefined, undefined, undefined, null, 0));
// Tree of TMs
var tmTree = new Tree(currTreeNode);
//createNode Position
var position;

//!should be called before entering new window!
function addTuringmaschine(turingMachine, positionMap = new Map(), superNodeId){
    //add new TM to tree
    let newNode = new TreeNode(turingMachine, positionMap, currTreeNode, superNodeId)
    currTreeNode.children.push(newNode);
    newNode.parent = currTreeNode;


}

//////////////////////////////////////////////////////////////
//// ------------------ User Creation ------------------- ////
//////////////////////////////////////////////////////////////

//rightclick on canvas: create superState
cy.on('cxttap', (event) => {
    //only allow in editMode (& click on canvas)
    if(inEditMode() && event.target === cy){
        position = event.position;

        //
        const superNodeModal = document.getElementById('superNodeModal');
        const modal = document.querySelector('.modal-content');
        //get cytoscape window position
        const cytoWindow = document.querySelector('#cytoscape');
        const leftValue = parseInt(window.getComputedStyle(cytoWindow).getPropertyValue('left'), 10);
        const topValue = parseInt(window.getComputedStyle(cytoWindow).getPropertyValue('top'), 10);

        addEventListenerWithCheck(document.getElementById('superNodeButton'), 'click', userSuperNodeInputHandler)

        //display modal at doubleclick position
        superNodeModal.style.paddingLeft = `${position.x + leftValue}px`
        let maxPaddingTop = Math.min(position.y + topValue, window.innerHeight-350);
        superNodeModal.style.paddingTop = `${maxPaddingTop}px`;
        superNodeModal.style.display = 'block';
    }
});

function userSuperNodeInputHandler(){
    //Close the modal
    superNodeModal.style.display = 'none';
    //Read user input
    let stateName = document.getElementById('superStateName').value;
    //catch name already exists in current TreeNode
    for(const state of currTreeNode.turingMachine.states){
        if(state.name === stateName){
            alert(`state with Name ${state.name} already exists, please choose a unique name`);
            superNodeModal.style.display = 'block';
            return;
        }
    }
    
    //create cyto node
    let superStateId = nodePresetHelper();
    cyCreateNode(superStateId, stateName, position.x, position.y, false, false, false);

    //// Create SubTM & add to TreeStructure (child)
    //Create Start & End Node
    let id1 = nodePresetHelper();
    let id2 = nodePresetHelper();
    let startState = new State(id1, "start", true, false, false);
    let endState = new State(id2, "end", false, true, false);
    //Add default transition between start & end node
    let delta = new Map();
    delta.set([startState, "else"], [endState, "nothing", "N"]);
    //tape (from parent)
    let tape = currTreeNode.turingMachine.tape;
    let tapePosition = currTreeNode.turingMachine.tapePosition;
    //Create TM Object 
    let subTuringMachine = new TuringMachine(new Set(), new Set(), new Set(), delta, startState, endState, undefined, tape, tapePosition);
    subTuringMachine.states.add(startState);
    subTuringMachine.states.add(endState);

    //add TM Object to tree 
    //add positionmap (default)
    let positionMap = new Map();
    //set position of start & end state of subTM
    positionMap.set(id1, [100, 200])
    positionMap.set(id2, [500, 200])
    //add TM to tree
    addTuringmaschine(subTuringMachine, positionMap, superStateId);

    //merge into main TM (adds start & stop state to globalTM)
    turingMachine.mergeInTuringMachine(subTuringMachine);

    //add SuperState to local TM (parent)
    let superState = new State(superStateId, stateName)
    currTreeNode.turingMachine.states.add(superState);

    //increase ID
    nodePresetHelper();

}   

//////////////////////////////////////////////////////////////
//// ------------------ Enter/Leave state --------------- ////
//////////////////////////////////////////////////////////////

//enter superstate
cy.on('cxttap', 'node', function(event){
    //Save old Canvas Positions
    currTreeNode.nodePositions = generateNodePosMap();

    //find parent with superStateId == target node id
    let childrenArr = currTreeNode.children
    let found = false;
    for(let i = 0; i<childrenArr.length; i++){
        if(childrenArr[i].superNodeId === parseInt(event.target.id())){
            currTreeNode = childrenArr[i];
            found = true;
        }
    }
    if(!found){
        //Node is Not a Super Node, ignore rightclick
        console.log("Right Click not on super node");
        return;
    }

    ////Create Nodes & Edges according to TM object that is being entered
    createCytoWindow();

});

//leave superstate (to parent)
function leaveSuperState(){
    //Save old Canvas Positions
    currTreeNode.nodePositions = generateNodePosMap();

    if(currTreeNode.parent === null || currTreeNode.parent === undefined){
        //in root, cannot "leave superstate"
        return;
    }
    currTreeNode = currTreeNode.parent;

    ////Create Nodes & Edges according to TM object that is being entered
    createCytoWindow();
}
document.getElementById("leaveSuperState").addEventListener("click", leaveSuperState);


//Helper: creates cytowindow according to TreeNode description (currTreeNode)
function createCytoWindow(){
    //Clear Canvas
    cyClearCanvas();
    //Create Nodes
    for(let state of currTreeNode.turingMachine.states){
        let nodePositionX = currTreeNode.nodePositions.get(parseInt(state.id))[0];
        let nodePositionY = currTreeNode.nodePositions.get(state.id)[1];
        //cyto create node
        cyCreateNode(state.id, state.name, nodePositionX, nodePositionY, state.isStarting, state.isAccepting, state.isRejecting);
    }
    //Create Edges
    for(let [key, value] of currTreeNode.turingMachine.delta){
        console.log(key, " ", value);
        let fromNode = key[0].id;
        let toNode = value[0].id;
        //determine label
        let cyLabel = "";
        let labelMove = "⯀";
        if(value[2] === "L"){
            labelMove = "⮜";
        }
        if(value[2] === "R"){
            labelMove = "➤"
        }

        if(value[1] !== 'nothing'){
            cyLabel = "🔍 " + key[1] + "  | ✎ " + value[1] + " | " + labelMove;
        }
        else{
            cyLabel = "🔍 " + key[1] + " | " + labelMove;
        }
        //cyto create Edge
        cyCreateEdge(fromNode, toNode, cyLabel, key[1]);
    }
    console.log("LOCAL TM: ", currTreeNode.turingMachine);
    console.log("GLOBAL TM: ", turingMachine);
}

//////////////////////////////////////////////////////////////
//// ---------------- Create/Edit Local TM -------------- ////
//////////////////////////////////////////////////////////////
function addStateLocalTM(id, name, isStarting, isAccepting, isRejecting){
    let localTM = currTreeNode.turingMachine;
    localTM.createState(id, name, isStarting, isAccepting, isRejecting);
}

function addEdgeLocalTM(fromStateId, readLabel, toStateId, writeLabel, tapeMovement){
    let localTM = currTreeNode.turingMachine;
    let fromState = localTM.getStatebyId(fromStateId);
    let toState = localTM.getStatebyId(toStateId);
    localTM.createTransition(fromState, readLabel, toState, writeLabel, tapeMovement);
}

//adjust local TM when node edit (borrow from global tm)
function editNodeLocalTM(editNode){
    //find state in local TM with corresponding id
    let editNodeLocal = currTreeNode.turingMachine.getStatebyId(editNode.id);

    //copy properties
    editNodeLocal.name = editNode.name;
    editNodeLocal.isStarting = editNode.isStarting;
    editNodeLocal.isAccepting = editNode.isAccepting;
    editNodeLocal.isRejecting = editNode.isRejecting;

    currTreeNode.turingMachine.startstate = turingMachine.startstate;
    currTreeNode.turingMachine.acceptstate = turingMachine.acceptstate;
    currTreeNode.turingMachine.rejectstate = turingMachine.rejectstate;
}

//adjust local TM when edge Edit (borrow from global tm) !!TO DO: fix this!
function editEdgeLocalTM(newfromNode, readToken, newtoNode, writeToken, tapeMovement, editEdgeKey){
    //find corresponding edge
    
    //borrow from other edge

    let localTM = currTreeNode.turingMachine;
    //remove old

    let localTMeditEdgeKey = [editEdgeKey[0], editEdgeKey[1]];
    console.log(localTMeditEdgeKey);
    console.log("LOCAL TM editedgeKey", localTMeditEdgeKey);
    console.log("LOCAL TM Delta", localTM.delta);
    localTM.delta.delete(localTMeditEdgeKey);
    //create new
    const newEdgeKey = [newfromNode, readToken];
    const newEdgeValue = [newtoNode, writeToken, tapeMovement];
    localTM.delta.set(newEdgeKey, newEdgeValue);

    console.log("LOCAL TM Delta", localTM.delta)
}

function getLocalTM(){
    return currTreeNode.turingMachine;
}

function getRootTM(){
    return tmTree.root.turingMachine;
}

function getStartSubTM(superstateId){
    //find requested node in local TM & get childTM
    let childrenArr = currTreeNode.children
    let childTreeNode;

    for(let i = 0; i<childrenArr.length; i++){
        console.log('sni ', childrenArr[i].superNodeId, ' | ', parseInt(superstateId));
        if(childrenArr[i].superNodeId === parseInt(superstateId)){
            childTreeNode = childrenArr[i];
            break;
        }
    }
    //return start state of childTM
    return childTreeNode.turingMachine.startstate
}

function getAcceptSubTM(superstateId){

    //find requested node in local TM & get childTM
    let childrenArr = currTreeNode.children
    let childTreeNode;

    for(let i = 0; i<childrenArr.length; i++){
        if(childrenArr[i].superNodeId === parseInt(superstateId)){
            childTreeNode = childrenArr[i];
            break;
        }
    }
    //return accept state of childTM
    return childTreeNode.turingMachine.acceptstate
    
}
