//State Object
export class State{
    /**
     * Constructs a State object with the provided attributes.
     *
     * @param {number} id - The unique identifier of the state.
     * @param {number} name - The user defined name of the state.
     * @param {boolean} isStarting - Indicates whether the state is a starting state (true) or not (false).
     * @param {boolean} isAccepting - Indicates whether the state is a accepting state (true) or not (false).
     * @param {boolean} isRejecting - Indicates whether the state is a rejecting state (true) or not (false).
     */
    constructor(id, name, isStarting=false, isAccepting=false, isRejecting=false){
        this.id = id;
        this.name = name;
        this.isStarting = isStarting;
        this.isAccepting = isAccepting;
        this.isRejecting = isRejecting;
    }
}
