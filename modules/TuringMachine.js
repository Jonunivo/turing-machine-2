import {State} from './State.js';
export {turingMachine};

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
     * @param {Set<State>} rejectstate - The rejecting state of the Turing Machine.
     * @param {string[]} tape - The tape of the Turing Machine
     * @param {number} tapePosition - The position of the Lese/Schreibkopf
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
     * creates global default turingmachine object (also used to reset TM object)
     */
    createTuringMachineBasic(){
        turingMachine = new TuringMachine(new Set(), new Set(), new Set(""), new Map(), undefined, undefined, new Set(), null, 0);
        turingMachine.gamma.add("");
    }

    /**
     * 
     * Constructs state with given attributes & adds it to TM object.
     * Sets startstate, acceptstate, rejectstate if needed.
     * 
     * @param {number} id - ID of State
     * @param {string} name - Name of State
     * @param {boolean} isStarting - specifies if state is startstate
     * @param {boolean} isAccepting - specifies if state is accepttate
     * @param {boolean} isRejecting - specifies if state is rejecttate
     */
    createState(id, name = "", isStarting = false, isAccepting = false, isRejecting = false){
        //construct state
        let newState = new State(id, name, isStarting, isAccepting, isRejecting)
        //add to TM object
        this.states.add(newState);

        //set startstate, acceptstate, rejectstate if needed
        if(isStarting){
            this.startstate = newState
        }
        if(isAccepting){
            this.acceptstate = newState
        }
        if(isRejecting){
            console.log(this);
            this.rejectstate.add(newState);
        }
    }

    //adds transition to TM object
    /**
     * Adds Transition to TM object
     * 
     * @param {State} fromState - State Transition originates from
     * @param {char} label - Character that is read
     * @param {State} toState - State Transition points to
     * @param {char} writeLabel - Character to write on Tape ("" means don't write)
     * @param {char} tapeMovement - Tape Movement
     */
    createTransition(fromState, label, toState, writeLabel, tapeMovement){
        this.delta.set([fromState, label], [toState, writeLabel, tapeMovement]);
    }

    //////////////////////////////////////////////////////////////
    //// ------------------- Simulation -------------------- /////
    //////////////////////////////////////////////////////////////

    //runs TM simulation
    /**
     * Runs Simulation in TM object until acceptstate or rejectstate reached.
     * Called by fastsimulation
     * Calls simulationResult() at the end handle end of simulation
     */
    runSimulation(){
        //start at starting state
        console.log("currstate: ", currentState);


        while(currentState !== this.acceptstate && 
            !this.rejectstate.has(currentState))
            {
                currentState = this.simulationStep(currentState, this.readTape())
            }
    }

    /**
     * Runs single Simulation Step on TM object.
     * Catches no Transition for this state & charOnTape
     * Adjusts Tape if needed 
     * 
     * @param {State} state - State the simulation is at Start of step
     * @param {char} charOnTape - Char on Tape
     * @returns {State} nextState - Returns the next State of the Simulation
     */
    simulationStep(state, charOnTape){
        let deltaValue;
        //find corresponding transition in delta
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
                document.getElementById('runSimulationButton').disabled = true;
                document.getElementById('stepSimulationButton').disabled = true;
                document.getElementById('resetSimulationButton').disabled = false;
                document.getElementById('runSimulationButton').innerHTML = "Run Simulation";
                document.getElementById('move-tape-left').disabled = false;
                document.getElementById('move-tape-right').disabled = false;
                document.getElementById('tape-input').disabled = false;
                document.getElementById('fastSimulation').disabled = false;

                alert(`Keinen Übergang für Zustand ${state.name} & Input ${charOnTape}`)
                return null;
            }



        }
        ////logging
        console.log("//--------TM CORE-------------")
        console.log(`at State ${state.name} reading ${charOnTape}`);
        console.log(`Tape: ${this.tape}`);
        console.log(`next State: ${deltaValue[0].name}`);
        ////

        //write on tape if needed
        if(deltaValue[1] !== null && deltaValue[1] !== undefined && deltaValue[1] !== "nothing"){
            console.log(`write ${deltaValue[1]} at ${this.tapePosition}`);
            this.tape[this.tapePosition] = deltaValue[1];
        }
        //adjust tapePosition if needed
        switch(deltaValue[2]){
            case "L":
                console.log("Move Cursor Left");
                //expand tape to left if needed
                if(this.tapePosition === 0){
                    console.log("expanding tape to left");
                    this.tape.unshift("");
                    this.tapePosition++;
                }
                this.tapePosition--;
                break;
            case "R":
                console.log("Move Cursor Right");
                //expand tape to right if needed
                if(this.tapePosition === this.tape.length-1){
                    console.log("expanding tape to right");
                    this.tape.push("");
                }
                this.tapePosition++;
                break;
            case "N":
                console.log("Move Neutral");
                break;
            default:
                throw new Error("Could not interpret movement")
        }
        //if last state: run simulationResult (moved to animateSimulationStep)
        /*
        if(deltaValue[0].isAccepting || deltaValue[0].isRejecting){
            //this.simulationResult(deltaValue[0]);
        }
        */

        //return next state
        return deltaValue[0];
    }

    /**
     * Handles everything when Simulation reaches Accept or Rejectstate
     * 
     * @param {State} lastState - State Simulation finished on
     */
    //handles simulation result
    simulationResult(lastState){
        ////logging
        console.log("//-----------FINAL RESULT------------")
        console.log(`Tape: ${this.tape}`);
        ////
        if(lastState == this.acceptstate){
            console.log("Simulation finished: Input Accepted!")
            alert("Simulation finished: Input Accepted!")
        }
        else if(this.rejectstate.has(lastState)){
            console.log("Simulation finished: Input Rejected!");
            alert("Simulation finished: Input Rejected!")

        }
        else{
            throw new Error("invalid ending of simulation, check TM build")
        }
    }

    /**
     * Returns Character at tape[tapePosition] of TM object
     * 
     * @returns Character at tapePosition
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
     * Helper: Returns State with id @param id from turingMachine.states. Returns undefined if none found
     * 
     * @param {number} id - id of requested State
     * @returns {State} with given id
     */
    getStatebyId(id){
        for(const state of this.states){
            if(parseInt(state.id) === parseInt(id)){
                return state;
            }
        }
        console.log("getStatebyId unsuccessful");
        return undefined
    }

    /**
     * Helper: Returns State with id @param name from turingMachine.states
     * note: The program ensures users being unable to create multiple states with the same name.
     *          should this still happen however, the first state with this name is returned.
     * 
     * @param {number} name - name of requested State
     * @returns {State} with given id
     */
    getStatebyName(name){
        for(const state of this.states){
            if(state.name === name){
                return state;
            }
        }
        console.log("getStatebyName unsuccessful");
        return undefined
    }

    /**
     * !!use with caution
     * Helper: Add all info from other into this Turingmachine; start & accept state from "this"
     * note: Only states, alphabets and transitions are merged into "this", rest of
     *      "this" stays the same
     * 
     * @param {TuringMachine} other - 2nd TuringMachine
     */
    mergeInTuringMachine(other){
        //add states
        for(let state of other.states){
            this.createState(state.id, state.name, false, false, state.isRejecting)
        }
        //sigma & gamma union
        this.sigma = new Set([...this.sigma, ...other.sigma]);
        this.gamma = new Set([...this.gamma, ...other.gamma]);
        //add delta (removes starting/accepting properties)
        for(let [key, value] of other.delta){
            let fromState = this.getStatebyId(key[0].id);
            let toState = this.getStatebyId(value[0].id);
            this.createTransition(fromState, key[1], toState, value[1], value[2]);
        }
        //rest stays the same (is overwritten by "this")
    }

}

//global variable
    //Basic TuringMachine object used for Creation & Simulation (imported by many other modules!)
    var turingMachine = new TuringMachine(new Set(), new Set(), new Set(), new Map(), undefined, undefined, new Set(), null, 0);
    turingMachine.gamma.add("");
/*
//create a simple TM to test the code: binary increment
//Alphabets
let sigma = new Set();
sigma.add("0");
sigma.add("1");
let gamma = new Set(sigma);

//create States
let states = new Set();
//right
let right = new State(0, true)
states.add(right);
//carry
let carry = new State(1);
states.add(carry);
//done
let done = new State(2, false, true)
states.add(done);

//create Transitions
let delta = new Map();
//right
 //read 1
 delta.set([right, "1"], [right, null, "R"])
 //read 0
 delta.set([right, "0"], [right, null, "R"])
 //read blank
 delta.set([right, ""], [carry, null, "L"])
//carry
 //read 1
 delta.set([carry, "1"], [carry, "0", "L"])
 //read 0
 delta.set([carry, "0"], [done, "1", "L"])
 //read blank
 delta.set([carry, ""], [done, "1", "L"])
//done
 //no transitions needed -> accepting state

//tape
let tape = ["1", "1", "1", "1"];
let tapePosition = 0;
//create TM
let testtm = new TuringMachine(states, sigma, gamma, delta, right, done, undefined, tape, tapePosition);
testtm.runSimulation()
*/