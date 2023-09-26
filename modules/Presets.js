import { cyCreateNode, cyCreateEdge, nodePresetHelper } from "./Cytoscape.js";
import { turingMachine } from "./TuringMachine.js";

function loadPresetOne(){
    console.log("load preset 1 clicked");
    //reset
    //TO DO
    //Create States
    //right state
    cyCreateNode('right', undefined, undefined, true, false, false)
    turingMachine.createState(0, true, false, false);
    nodePresetHelper();
    //carry state
    cyCreateNode('carry', undefined, undefined, false, false, false)
    turingMachine.createState(1, false, false, false);
    nodePresetHelper();
    //done state
    cyCreateNode('done', undefined, undefined, false, true, false)
    turingMachine.createState(2, false, true, false);
    nodePresetHelper();

    //Create Transitions
    //// from right
    //0->0 & move left when reading 0
    let cyLabel = "R: " + '0' + " | " + "L";
    cyCreateEdge(0, 0, cyLabel);
    turingMachine.createTransition(turingMachine.getStatebyId(0), '0', turingMachine.getStatebyId(0), '', 'L')
    //0->0 & move left when reading 1
    cyLabel = "R: " + '1' + " | " + "L";
    cyCreateEdge(0, 0, cyLabel);
    turingMachine.createTransition(turingMachine.getStatebyId(0), '1', turingMachine.getStatebyId(0), '', 'L')
    //0->1 & move right when reading ""
    cyLabel = "R: " + '' + " | " + "R";
    cyCreateEdge(0, 1, cyLabel);
    turingMachine.createTransition(turingMachine.getStatebyId(0), '', turingMachine.getStatebyId(1), '', 'R')
    
    ////from carry
    //1 -> 0, R
    cyLabel = "R: " + '1' + " W: " + '0' + " | " + "R";
    cyCreateEdge(1, 1, cyLabel);
    turingMachine.createTransition(turingMachine.getStatebyId(1), '1', turingMachine.getStatebyId(1), '0', 'R')
    //0 -> 1, L
    cyLabel = "R: " + '0' + " W: " + '1' + " | " + "L";
    cyCreateEdge(1, 2, cyLabel);
    turingMachine.createTransition(turingMachine.getStatebyId(1), '0', turingMachine.getStatebyId(2), '1', 'L')
    //"" -> 1, L
    cyLabel = "R: " + '' + " W: " + '1' + " | " + "L";
    cyCreateEdge(1, 2, cyLabel);
    turingMachine.createTransition(turingMachine.getStatebyId(1), '', turingMachine.getStatebyId(2), '1', 'L')

}


//handle Dropdown menu & activate correct function when value changes
var presetSelect = document.getElementById("presetSelect");
    
presetSelect.addEventListener("change", function() {
        if (presetSelect.value === "empty") {
            //empty()
            console.log("empty clicked");
        }
        else if (presetSelect.value === "PresetOne") {
            loadPresetOne();
            console.log("PresetOne clicked");
        } 
        // Add more conditions for other options as needed
    });

