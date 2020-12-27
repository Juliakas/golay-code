import * as BinaryField from "./binaryField.js";
import Vector from "./vector.js";

export default class Channel {
    /**
     * Channel's error probability value.
     * Value range [0, 1].
     * @type {number}
     * @private
     */
    errorProbability;

    /**
     * @param {number} errorProbability
     *      Channel's error probability value.
     *      Value range [0, 1].
     */
    constructor(errorProbability) {
        this.errorProbability = errorProbability;
    }

    /**
     * Sets internal this.errorProbability to the specified value.
     * @param {number} errorProbability 
     *      Specified value to set.
     */
    setErrProbability(errorProbability) {
        this.errorProbability = errorProbability;
    }

    /**
     * Transmit vector through channel and distort it depending on the value of errorProbability property.
     * @param {Vector} vector
     *      Vector to send through the channel.
     * @returns {Vector}
     *      Distorted vector on receiving end.
     */
    transmitVector(vector) {
        let vec = vector.getVec();
        let distorted = new Array(vec.length);
        for (let [index, bit] of vec.entries()) {
            let rn = Math.random();
            if (rn < this.errorProbability) {
                distorted[index] = BinaryField.add(bit, 1);
            } else {
                distorted[index] = bit;
            }
        }
        return new Vector(distorted);
    }
}