import { Tree, TreeNode } from "../datastructures/Tree.js";
import { TuringMachine, turingMachine} from "./TuringMachine.js";
import { State } from "./State.js";

import { cy, cyClearCanvas, cyCreateEdge, cyCreateNode, generateNodePosMap } from "./Cytoscape.js";
//Global Variables

//current TreeNode
var currTreeNode = new TreeNode(turingMachine);
// Tree of TMs
var tmTree = new Tree(currTreeNode);

//!should be called before entering new window!
function addTuringmaschine(turingMachine, positionMap = new Map()){
    //add new TM to tree
    let newNode = new TreeNode(turingMachine, positionMap, currTreeNode)
    currTreeNode.children.push(newNode);
    newNode.parent = currTreeNode;


}


function createSuperState(){
    //Create Cyto State (TO DO: create superstate by doubleclick & modal)
    cy.add({
        group: 'nodes',
        style: {
            'background-color': `yellow`,
            'border-width': `2px`,
            'border-color': `black`,
            'label': `super`,
            "text-valign": "center",
            "text-halign": "center",
            'width': `50px`
        },
        position: { x: 100, y: 100},
    });

    //// Create SubTM & add to TreeStructure
    //Create Start & End (!TO DO: ID SETTING (align with UserInput))
    let startState = new State(10000, "start", true, false, false);
    let endState = new State(10001, "end", false, true, false);
    //add positionmap (default)
    let positionMap = new Map();
    positionMap.set(10000, [100, 200])
    positionMap.set(10001, [500, 200])

    let delta = new Map();
    //add default transition
    delta.set([startState, "else"], [endState, "nothing", "N"]);
    //tape
    let tape = currTreeNode.turingMaschine.tape;
    let tapePosition = currTreeNode.turingMaschine.tapePosition;
    let subTuringMaschine = new TuringMachine([startState, endState], new Set(), new Set(), delta, startState, endState, undefined, tape, tapePosition);

    //add TM to tree 
    addTuringmaschine(subTuringMaschine, positionMap);

    //merge into main TM
    turingMachine.mergeInTuringMachine(subTuringMaschine);

    //logging
    console.log(turingMachine);
    console.log(subTuringMaschine);
}
document.getElementById("createSuperState").addEventListener('click', createSuperState);

//TO DO: ONLY TRIGGER ON DOUBLECLICK ON SUPERNODE, not on any node
cy.on('cxttap', 'node', function(event){
    console.log("here");
    //enter Super State
    //Save old Canvas Positions
    currTreeNode.nodePositions = generateNodePosMap();
    //go into node (TO DO: GET CORRECT CHILD)
    currTreeNode = currTreeNode.children[0];
    //Clear Canvas
    cyClearCanvas();

    ////Create Nodes & Edges according to TM object that is being entered
    //Create Nodes
    for(let state of currTreeNode.turingMaschine.states){
        let nodePositionX = currTreeNode.nodePositions.get(state.id)[0];
        let nodePositionY = currTreeNode.nodePositions.get(state.id)[1];
        //cyto create node
        cyCreateNode(state.id, state.name, nodePositionX, nodePositionY, state.isStarting, state.isAccepting, state.isRejecting);
    }
    //Create Edges
    for(let [key, value] of currTreeNode.turingMaschine.delta){
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
});

