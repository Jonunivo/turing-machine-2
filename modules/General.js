/*
  Author: Mauro Vogel
  Date: January 2024
  
  Description: 
    - Provides functions that allow users to use "Enter" and "Escape"
        to control Simulator

  Dependencies/Imports:
    none

  Exports:
    none
    
*/

/**
 * EventListener for user pressing "Enter" or "Escape"
 */
window.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        userPressEnter();
    }
    if (event.key === "Escape") {
        userPressEscape();
    }
})


/**
 * Simulates a user pressing the Enter key based on the current context, triggering relevant actions.
 * Checks for open modals and focused elements to determine the appropriate action.
 */
function userPressEnter(){
    const nodeModal = document.getElementById('nodeModal');
    const edgeModal = document.getElementById('edgeModal');
    const saveModal = document.getElementById('saveModal');
    //Node Create Modal open
    if(nodeModal.style.display === 'block' && !document.getElementById("nodeDeleteButton")){
        simulateButtonClick("nodeButton");
    }
    //Edge Create Modal open
    else if(edgeModal.style.display === 'block' && !document.getElementById("edgeDeleteButton")){
        simulateButtonClick("edgeButton");
    }
    //Node Edit Modal open
    else if(nodeModal.style.display === 'block'){
        simulateButtonClick("nodeEditButton");
    }
    //Edge Edit Modal open
    else if(edgeModal.style.display === 'block'){
        simulateButtonClick("edgeEditButton");
    }
    //Save/Load modal open
    else if(saveModal.style.display === "block"){
        simulateButtonClick("saveConfirm");
    }
    //SuperNode create modal open
    else if(superNodeModal.style.display === "block"){
        //not yet supported
    }

    //write tape field in focus
    else if(document.activeElement === document.getElementById("tapeInputField")){
        simulateButtonClick("tapeInput");
    }
    else{
        //else: play/pause simulation
        simulateButtonClick("runSimulationButton");
    }

}

/**
 * Simulates a user pressing the Escape key based on the current context, closing relevant modals.
 * Checks for open modals to determine the appropriate action for each scenario.
 */
function userPressEscape(){
    const nodeModal = document.getElementById('nodeModal');
    const edgeModal = document.getElementById('edgeModal');
    const saveModal = document.getElementById('saveModal');
    //Node Create/Edit Modal open, close it
    if(nodeModal.style.display === 'block'){
        simulateButtonClick("cancelButton");
    }
    //Edge Create/Edit Modal open, close it
    else if(edgeModal.style.display === 'block'){
        simulateButtonClick("cancelButton2");
    }
    //Save/Load modal open, close it
    else if(saveModal.style.display === "block"){
        simulateButtonClick("cancelButton3");
    }
}


/**
 * Simulates a button click event for the button with the id @param id.
 * Checks if the button is disabled before dispatching the click event.
 *
 * @param id The identifier of the button to be clicked.
 */
function simulateButtonClick(id){
    var button = document.getElementById(id);
    //catch button disabled
    if(button && button.disabled){
        //do nothing
    }
    else if (button) {
        var event = new MouseEvent('click', {
            view: window
        });
        // Dispatch the click event on the button
        button.dispatchEvent(event);
    } 
    else {
        //catch button not found
        console.error('Button not found with id:', id);
    }
}