/*
  Author: Mauro Vogel
  Date: January 2024
  
  Description: 
    - Defines the TuringMachine class.
    - Provides functionality to manipulate TuringMachine object
    - Provides getters for other classes utilising the TuringMachine object
    - Generates the global turingMachine at page load time


  Dependencies/Imports:
    - State.js | State object

  Exports:
    - TuringMachine class
    - Variable turingMachine used as global TuringMachine object
*/

//note: Global/shared variable turingMachine is found below definition of TuringMachine class


import {State} from './State.js';
export {turingMachine, resetGlobalTuringMachine};

export class TuringMachine{
    /**
     * Constructs a TuringMachine object with the provided attributes.
     *
     * @param {Set<State>} states - The set of states in the Turing Machine.
     * @param {Set<string>} sigma - The input alphabet (a set of characters).
     * @param {Set<string>} gamma - The working alphabet (a set of characters).
     * @param {Map<[State, string], [State, string, string]>} delta - The transition function mapping 
     *          [state, read char] to [state, write char, move]
     * @param {State} startstate - The starting state of the Turing Machine.
     * @param {State} acceptstate - The accepting state of the Turing Machine.
     * @param {Set<State>} rejectstate - The set of rejecting states of the Turing Machine.
     * @param {string[]} tape - The tape of the Turing Machine
     * @param {number} tapePosition - The position of the tape head
     */
    constructor(states, sigma, gamma, delta, startstate, acceptstate, rejectstate, tape, tapePosition){
        this.states = states;
        this.sigma = sigma;
        this.gamma = gamma;
        this.delta = delta;
        this.startstate = startstate;
        this.acceptstate = acceptstate;
        this.rejectstate = rejectstate;
        this.tape = tape;
        this.tapePosition = tapePosition;
    }

    //////////////////////////////////////////////////////////////
    //// -------------------- Creation --------------------- /////
    //////////////////////////////////////////////////////////////

    /**
     * 
     * Constructs state with given attributes & adds it to TM object.
     * Adjusts startstate, acceptstate, rejectstate of TM object if needed.
     * 
     * @param {number} id - ID of State
     * @param {string} name - Name of State
     * @param {boolean} isStarting - specifies if state is startstate
     * @param {boolean} isAccepting - specifies if state is accepttate
     * @param {boolean} isRejecting - specifies if state is rejecttate
     */
    createState(id, name = "", isStarting = false, isAccepting = false, isRejecting = false){
        //construct & add to TM
        let newState = new State(id, name, isStarting, isAccepting, isRejecting)
        this.states.add(newState);

        //adjust startstate, acceptstate, rejectstate if needed
        if(isStarting){
            this.startstate = newState
        }
        if(isAccepting){
            this.acceptstate = newState
        }
        if(isRejecting){
            this.rejectstate.add(newState);
        }
    }

    /**
     * Adds Transition to TM object
     * 
     * @param {State} fromState - State Transition originates from
     * @param {char} label - Character that is read, 'else' used for else-transition
     * @param {State} toState - State Transition points to
     * @param {char} writeLabel - Character to write on Tape, 'nothing' means don't write
     * @param {char} tapeMovement - Tape Movement
     */
    createTransition(fromState, label, toState, writeLabel, tapeMovement){
        this.delta.set([fromState, label], [toState, writeLabel, tapeMovement]);
    }

    //////////////////////////////////////////////////////////////
    //// ------------------- Simulation -------------------- /////
    //////////////////////////////////////////////////////////////

    /**
     * Runs single Simulation Step on TM object
     * Adjusts tape & tapePosition of caller TM if tape movement involved
     * Catches no Transition for this state & charOnTape
     * 
     * @param {State} state - State to step from
     * @param {char} charOnTape - Char on Tape being read
     * @returns {State}  - Returns State we end upon
     * @throws {error} - if no valid transition found, disable simulation

     */
    simulationStep(state, charOnTape){
        //find corresponding transition in delta
        let deltaValue;
        try{
            //normal Transition?
            deltaValue = this.delta.get(this.getKeyByContent([state, charOnTape]))
        }
        catch(error){
            //"else" Transition?
            try{
                deltaValue = this.delta.get(this.getKeyByContent([state, 'else']))
            }
            catch(error){
                //no valid transition found, disable simulation
                //cannot import enableButtons() (dependencies)
                document.getElementById('runSimulationButton').disabled = true;
                document.getElementById('stepSimulationButton').disabled = true;
                document.getElementById('resetSimulationButton').disabled = false;
                document.getElementById('runSimulationButton').innerHTML = "Run Simulation";
                document.getElementById('moveTapeLeft').disabled = false;
                document.getElementById('moveTapeRight').disabled = false;
                document.getElementById('tapeInput').disabled = false;
                document.getElementById('fastSimulation').disabled = false;
                //switch to move mode off again
                var button = document.querySelector('.toggle-button');
                if(button.classList.contains('active')){
                    button.classList.toggle('active');
                }
                //alert User
                alert(`Simulation finished: Input Rejected \n\nReason: No Transition for State ${state.name} & Input ${charOnTape} \nConsider creating an else-transition to catch all cases`)
                return null;
            }
        }

        //manipulate tape & tapePosition if needed
        //write tape
        if(deltaValue[1] !== null && deltaValue[1] !== undefined && deltaValue[1] !== "nothing"){
            this.tape[this.tapePosition] = deltaValue[1];
        }
        //adjust tapePosition
        switch(deltaValue[2]){
            case "L":
                //expand tape to left if needed
                if(this.tapePosition === 0){
                    this.tape.unshift("");
                    this.tapePosition++;
                }
                this.tapePosition--;
                break;
            case "R":
                //expand tape to left if needed
                if(this.tapePosition === this.tape.length-1){
                    this.tape.push("");
                }
                this.tapePosition++;
                break;
            case "N":
                //no movement
                break;
            default:
                throw new Error("Could not interpret movement")
        }

        ////logging
        console.log("//--------TM SIMULATION STEP-------------")
        console.log(`at State ${state.name} reading ${charOnTape}`);
        console.log(`next State: ${deltaValue[0].name}`);
        ////

        //return next state
        return deltaValue[0];
    }

    /**
     * Alerts user about Simulation ending on accept or reject state
     * 
     * @param {State} lastState - State Simulation finished on
     */
    simulationResult(lastState){
        if(lastState == this.acceptstate){
            console.log("Simulation finished: Input Accepted!")
            alert("Simulation finished: Input Accepted! \n\nReason: Accepting State reached")
        }
        else if(this.rejectstate.has(lastState)){
            console.log("Simulation finished: Input Rejected!");
            alert("Simulation finished: Input Rejected!  \n\nReason: Rejecting State reached")
        }
        else{
            throw new Error("invalid ending of simulation, check TM build")
        }
    }

    /**
     * Getter that returns Character the tape head is currently at.
     * 
     * @returns Character at tape[tapePosition]
     */
    readTape(){
        return this.tape[this.tapePosition];
    }

    //////////////////////////////////////////////////////////////
    //// -------------------- Helpers ---------------------- /////
    //////////////////////////////////////////////////////////////

    /**
     * Helper: Returns key of delta when specified key is entered as "[state, charOnTape]"
     * 
     * @param {string} content - The Array that is to be recognized as a Key
     * @returns key of this.delta.keys with [state, charOnTape]
     */
    getKeyByContent(content){
        for(const key of this.delta.keys()){
            if(JSON.stringify(key) === JSON.stringify(content)){
                return key;
            }
        }
        throw new Error("Key not found in Delta", "Json: ", JSON.stringify(content));
    }

    /**
     * Helper: Returns State with id @param id from turingMachine.states. 
     * Returns undefined if not found
     * 
     * @param {number} id - id of requested State
     * @returns {State} with given id
     */
    getStateById(id){
        for(const state of this.states){
            if(parseInt(state.id) === parseInt(id)){
                return state;
            }
        }
        return undefined
    }

    /**
     * Helper: Returns State with name @param name from turingMachine.states
     * note: This function should only be used on local Turing machine objects, 
     *          since they are guaranteed to have unique names for each state.
     * !Returns any state found with name @param name.
     * Returns undefined if not found
     * 
     * @param {number} name - name of requested State
     * @returns {State} with given name
     */
    getStateByName(name){
        for(const state of this.states){
            if(state.name === name){
                return state;
            }
        }
        console.log("getStateByName unsuccessful");
        return undefined
    }

    /**
     * TO DO: maybe replace/remove this function as it is only used in one specific case
     * !!use with caution
     * Helper: Add all info from @param other into caller Turingmachine object; start & accept state from "this"
     * note: Only states and transitions are merged into "this", rest of
     *      "this" stays the same
     * 
     * 
     * @param {TuringMachine} other - 2nd TuringMachine
     */
    mergeInTuringMachine(other){
        //add states
        for(let state of other.states){
            this.createState(state.id, state.name, false, false, state.isRejecting)
        }
        //add delta
        for(let [key, value] of other.delta){
            let fromState = this.getStateById(key[0].id);
            let toState = this.getStateById(value[0].id);
            this.createTransition(fromState, key[1], toState, value[1], value[2]);
        }
    }

}

////global/shared variable
//Global TuringMachine object used for Simulation (shared by many other modules!)
var turingMachine = new TuringMachine(new Set(), new Set(), new Set(), new Map(), undefined, undefined, new Set(), null, 0);

/**
 * resets global turingMachine object
 */
function resetGlobalTuringMachine(){
    turingMachine = new TuringMachine(new Set(), new Set(), new Set(), new Map(), undefined, undefined, new Set(), null, 0);
}