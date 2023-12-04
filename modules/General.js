//////////////////////////////////////////////////////////////
//// ------------- User Keyboard controls --------------- ////
//////////////////////////////////////////////////////////////

window.addEventListener("keydown", function(event) {
    // Check if the pressed key is Enter (key code 13)
    if (event.key === "Enter") {
        userPressEnter();
    }
    if (event.key === "Escape") {
        userPressEscape();
    }
})


/**
 * Helper function that lets user use "Enter" to confirm modals, write tape, or Run/Pause simulation
 */
function userPressEnter(){
    //decide on what to do when user presses enter
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
    //write tape field in focus
    else if(document.activeElement === document.getElementById("tape-input-field")){
        simulateButtonClick("tape-input");
    }
    else{
        //else: play/pause simulation
        simulateButtonClick("runSimulationButton");
    }

}

//User presses Escape
function userPressEscape(){
    //decide on what to do when user presses enter
    const nodeModal = document.getElementById('nodeModal');
    const edgeModal = document.getElementById('edgeModal');
    const saveModal = document.getElementById('saveModal');
    //Node Create/Edit Modal open
    if(nodeModal.style.display === 'block'){
        console.log("0");
        simulateButtonClick("cancelButton");
    }
    //Edge Create/Edit Modal open
    else if(edgeModal.style.display === 'block'){
        simulateButtonClick("cancelButton2");
    }
    //Save/Load modal open
    else if(saveModal.style.display === "block"){
        simulateButtonClick("cancelButton3");
    }
}


//simulate as if user pressed the button (leftclick)
function simulateButtonClick(id){
    var button = document.getElementById(id);
    //catch button disabled
    if(button && button.disabled){
        console.log('button disabled');
    }
    else if (button) {
        // Create a new MouseEvent
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