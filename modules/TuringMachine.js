import {State} from './State.js';

class TuringMachine{
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
     * @param {State} rejectstate - The rejecting state of the Turing Machine.
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

    runSimulation(){
        //start at starting state
        let currentState = this.startstate;
        //terminate loop after 5 seconds
        let startTime = Date.now();
        let maxSimulationTime = 5000;

        while(currentState !== this.acceptstate && 
            currentState !== this.rejectstate)
            {
                currentState = this.simulationStep(currentState, this.readTape())

                if(Date.now() - startTime > maxSimulationTime){
                    console.log("infinite loop prevention triggered");
                    break;
                }
            }
        this.simulationResult(currentState);
    }

    simulationStep(state, charOnTape){

        //find corresponding transition in delta
        let deltaValue = this.delta.get(this.getKeyByContent([state, charOnTape]))
        
        ////logging
        console.log("-----------------------")
        console.log(`at State ${state.id} reading ${charOnTape}`);
        console.log(`Tape: ${this.tape}`);
        console.log("      " + "  ".repeat(this.tapePosition) + "#");
        console.log(`next State: ${deltaValue[0].id}`);
        ////

        //write on tape if needed
        if(deltaValue[1] !== null && deltaValue[1] !== undefined){
            console.log(`write ${deltaValue[1]}`);
            this.tape[this.tapePosition] = deltaValue[1];
        }
        //adjust tapePosition if needed
        switch(deltaValue[2]){
            case "L":
                console.log("Move Left");
                //expand tape to left if needed
                if(this.tapePosition === 0){
                    console.log("expanding tape to left");
                    this.tape = ["", this.tape];
                    this.tapePosition++;
                }
                this.tapePosition--;
                break;
            case "R":
                console.log("Move Right");
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
        //return next state

        return deltaValue[0];
    }

    //handles simulation result
    simulationResult(lastState){
        ////logging
        console.log("-----------------------")
        console.log("FINAL RESULT");
        console.log(`Tape: ${this.tape}`);
        ////
        if(lastState == this.acceptstate){
            console.log("accepting")
        }
        else if(lastState == this.rejectstate){
            console.log("rejecting");
        }
        else{
            throw new Error("invalid ending of simulation, check TM build")
        }
    }

    //reads the tape at the current position of the Lese-/Schreibkopf
    readTape(){
        return this.tape[this.tapePosition];
    }


    //helper
    getKeyByContent(content){
        for(const key of delta.keys()){
            if(JSON.stringify(key) === JSON.stringify(content)){
                return key;
            }
        }
        throw new Error("Key not found in Delta");
    }

}

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