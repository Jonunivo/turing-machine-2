import { cy, cyClearCanvas, cyCreateEdge, cyCreateNode } from "./Cytoscape.js";
import { cyWriteOnTape } from "./CytoscapeTape.js";
import { turingMachine } from "./TuringMachine.js"
import {nodePresetHelper, nodePresetReset} from "./UserInput.js";

//global Variables
//Array of TM properties to be saved
let tmProperties = []

//////////////////////////////////////////////////////////////
//// --------------------- Saving ----------------------- ////
//////////////////////////////////////////////////////////////
/**
 * Saving works as follows:
 * User presses SaveButton -> saveTuringMachine() -> Modal open
 * -> User makes Modal input
 * (1) presses Save in Modal -> saveFile() & close Modal
 * (2) User presses Cancel -> close Modal
 */

/**
 * Puts States & Transitions of TM into imProperties array & opens SaveModal
 * called when user presses "Save TM"
 */
function saveTuringMachine(){
    tmProperties = [];
    //convert states to JSON
    for(const state of turingMachine.states){
        tmProperties.push(JSON.stringify(state));
        //state positioning (cyto)
        tmProperties.push(cy.$(`#${state.id}`).position().x);
        tmProperties.push(cy.$(`#${state.id}`).position().y);
    }

    //line break
    tmProperties.push('\n');

    //convert transitions to JSON
    for(const [key, value] of turingMachine.delta){
        //[fromState{properties(5)}, readChar, toState{properties(5)}, writeChar, move]
        tmProperties.push([key[0].id, key[0].name, key[0].isStarting, key[0].isAccepting, key[0].isRejecting, 
            key[1], value[0].id, value[0].name, value[0].isStarting, value[0].isAccepting, value[0].isRejecting,
            value[1], value[2]]);
    }

    tmProperties.push("\n");
    
    //Open Save File Modal
    document.getElementById("saveModal").style.display = "block";
}
//EventListener for SaveButton
document.getElementById("saveButton").addEventListener("click", saveTuringMachine);


/**
 * 
 * Reads User Modal input & saves Tape if requested
 * Handles all the file creation & download part
 * 
 * @returns - aborts when user doesn't provide a filename (cancelled saving file prompt);
 *              otherwise returns nothing.
 */
function saveFile(){

    //close the modal
    document.getElementById("saveModal").style.display = "none";
    //get user input
    const filename = document.getElementById("filenameInput").value;
    if(!filename){
        //user cancelled prompt
        return;
    }

    if(document.getElementById("saveTape").checked){
        //also save tape content
        tmProperties.push(turingMachine.tape);
    }
    tmProperties.push("\n");

    //convert data to string
    const tmPropString = tmProperties.join('\n');

    // Create a Blob containing the serialized data
    const blob = new Blob([tmPropString], { type: 'application/json' });

    // Create a downloadable link
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);

    // Set suggested filename for the downloaded file
    downloadLink.download = filename;

    // Append the link to the DOM (optional)
    document.body.appendChild(downloadLink);

    // Programmatically trigger the download
    downloadLink.click();

    // Clean up the object URL
    URL.revokeObjectURL(downloadLink.href);
}
document.getElementById("saveConfirm").addEventListener("click", saveFile);
//Cancel button pressed
document.getElementById("cancelButton3").addEventListener('click', function(){
    document.getElementById("saveModal").style.display = "none";
})


//////////////////////////////////////////////////////////////
//// -------------------- Loading ----------------------- ////
//////////////////////////////////////////////////////////////

/**
 * Handles the whole loading process from Prompting the user to submit file until creating all the
 * necessary cytoscape objects & handle turingMachine object specifically:
 *  - Prompt User to input file
 *  - Resets TM & canvas
 *  - Load States & Transitions at position specified in savefile
 *  - load Tape content (if provided)
 */
document.getElementById('fileInput').addEventListener('change', (event) => {
    const fileList = event.target.files;
    if(fileList.length != 1){
        //not 1 file selected
        return;
    }
    //load file
    const file = fileList[0];
    const reader = new FileReader();
    reader.readAsText(file);

    ////read file content
    reader.onload = (event) => {
        const fileContent = event.target.result;
        //split into lines
        const lines = fileContent.split('\n');

        //// core 
        //reset TM & canvas
        turingMachine.createTuringMachineBasic();
        cyClearCanvas();
        nodePresetReset();

        //
        //load states
        //
        let i = 0;
        while(true){
            const currentLine = lines[i];
            //check if at finish
            if(currentLine == "" || currentLine == undefined){
                break;
            }
            //load line
            try{
                const parsedData = JSON.parse(currentLine);
                const id = parsedData.id;
                const name = parsedData.name;
                const isStarting = parsedData.isStarting;
                const isAccepting = parsedData.isAccepting;
                const isRejecting = parsedData.isRejecting;
                turingMachine.createState(id, name, isStarting, isAccepting, isRejecting);
                cyCreateNode(nodePresetHelper()-1, name, lines[i+1], lines[i+2], isStarting, isAccepting, isRejecting);
            } catch(error){
                console.log('Error parsing JSON:', error.message);
                alert("Failed to load .json file, try again");
                location.reload();
                return;
            }
            i+=3;
        }
        i+=2;

        //
        //load Transitions
        //
        while(true){
            const currentLine = lines[i];
            if(currentLine == "" || currentLine == undefined){
                break;
            }
            //load line
            try{
                //get properties
                var edgeProperties = currentLine.split(',');
                const fromState = turingMachine.getStatebyId(edgeProperties[0]);
                const readChar = edgeProperties[5];
                const toState = turingMachine.getStatebyId(edgeProperties[6]);
                const writeChar = edgeProperties[11];
                const move = edgeProperties[12];
                //construct TM
                turingMachine.createTransition(fromState, readChar, toState, writeChar, move);
                //cyto
                    //determine label
                    let cyLabel = "";
                    if(writeChar !== ''){
                        cyLabel = "R: " + readChar + " W: " + writeChar + " | " + move;
                    }
                    else{
                        cyLabel = "R: " + readChar + " | " + move;
                    }
                cyCreateEdge(edgeProperties[0], edgeProperties[6], cyLabel, readChar);
            }
            catch(error){
                console.log('Error parsing JSON:', error.message);
                alert("Failed to load .json file, try again");
                location.reload();
                return;
            }
            i++;
        }
        i+=2;

        //
        //load Tape
        //
        const tapeString = lines[i];
        console.log("Tape: ",tapeString);
        if(tapeString !== "" && tapeString !== undefined){
            //convert to string[]
            const tape = tapeString.split(",");
            //add to TM object
            turingMachine.tape = tape;
            //cyto
            cyWriteOnTape(tapeString.replace(/,/g, ''));
            i++;
        }
        else{
            //reset tape to empty
            cyWriteOnTape("");
        }
    }
});

