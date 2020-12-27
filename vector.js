import * as BinaryField from "./binaryField.js";

export default class Vector {
    /**
     * Internal vector property as a number array.
     * @type {number[]}
     * @private
     */
    vec;

    /**
     * @param {number[]} vec A number array for setting this.vec property.
     */
    constructor(vec) {
        this.vec = vec;
    }

    /**
     * Performs addition of this instance and vec
     * @param {Vector} vec 
     *      Vector to be added to this.
     * @returns {Vector}
     *      New Vector instance of added vectors.
     */
    add(vec) {
        if (this.length() != vec.length()) {
            throw "Vector addition length mismatch: " + this.length() + " and " + vec.length();
        }
        let res = new Array(this.length());
        for (let i = 0; i < this.length(); i++) {
            res[i] = BinaryField.add(this.vec[i], vec.getVec()[i]);
        }
        return new Vector(res);
    }

    /**
     * Gets internal vector array.
     * @returns {number[]}
     *      Internal vector array.
     */
    getVec() {
        return this.vec;
    }

    /**
     * Gets vector length.
     * @returns {number}
     *      Vector length.
     */
    length() {
        return this.vec.length;
    }

    /**
     * Calculates weight (number of 1 bits) of this vector.
     * @returns {number}
     *      Weight.
     */
    weight() {
        return this.vec.filter(x => x === 1).length;
    }

    /**
     * Intializes vector from binary data.
     * @param {Uint8Array|string} bytes
     *      Binary data to be transformed into vector of bits.
     * @returns {Vector}
     *      Initialized vector.
     */
    static fromBytes(bytes) {
        /** @type {number[]} */
        let vec = new Array(bytes.length * 8);
        for (let [i, byte] of bytes.entries()) {
            for (let j = 0; j < 8; j++) {
                vec[i * 8 + j] = (byte >> 7 - j) & 1;
            }
        }
        return new Vector(vec);
    }
}