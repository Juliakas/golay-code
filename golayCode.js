import { B, B11 } from "./constants.js";
import Matrix from "./matrix.js";
import Vector from "./vector.js";

export default class GolayCode {

    /**
     * 12-dim Identity matrix.
     * @type {Matrix}
     * @private
     */
    I

    /**
     * Golay code generator matrix.
     * @type {Matrix}
     * @private
     */
    G

    /**
     * Golay code parity check matrix.
     * @type {Matrix}
     * @private
     */
    H

    /**
     * Initializes golay code and compute internal matrices.
     */
    constructor() {
        this.I = Matrix.buildIdentityMatrix(12);
        this.G = this.I.join(B11);
        this.H = this.I.verticalJoin(B);
    }

    /**
     * Encodes a vector using golay code.
     * @param {Vector} vec
     *      Vector to be encoded.
     * @returns {Vector}
     *      Encoded vector.
     */
    encode(vec) {
        if (vec.length() != 12) {
            throw "Attempted encoding when vector length = " + vec.length();
        }
        return new Vector(new Matrix(vec).mul(this.G).getMatrix()[0]);
    }

    /**
     * Decodes a vector using golay code
     * @param {Vector} vec
     *      Vector to be decoded.
     * @returns {Vector}
     *      Decoded vector.
     */
    decode(vec, u) {
        if (vec.length() != 23) {
            throw "Attempted decoding when vector length = " + vec.length();
        }
        let vecArr = vec.getVec().slice();
        if (vec.weight() % 2 == 0) {
            vecArr.push(1);
        } else {
            vecArr.push(0);
        }
        vec = new Vector(vecArr);
        u = u || this.findErrorVector(vec);
        let corrected = vec.add(u);
        return new Vector(corrected.getVec().slice(0, 12));
    }

    /**
     * Decodes a vector without error correction.
     * @param {Vector} vec
     *      Vector to be decoded.
     * @returns {Vector}
     *      Decoded vector. 
     */
    decodeNoCorrection(vec) {
        return this.decode(vec, new Vector(new Array(24).fill(0)));
    }

    /**
     * Finds error vector that can be added with transmitted vector
     * where sum results in original vector if errors <= 3.
     * @private
     * @param {Vector} vec
     *      Odd weight transmitted vector with appended 0 or 1.
     * @returns {Vector}
     *      Error vector.
     */
    findErrorVector(vec) {
        let s = computeSyndrome(vec, this.H);
        if (s.weight() <= 3) {
            return new Vector(s.getVec().concat(new Array(12).fill(0)));
        }
        let { sum, i } = syndromeWithBRow(s) || {};
        if (sum) {
            let ei = new Array(12).fill(0);
            ei[i] = 1;
            return new Vector(sum.getVec().concat(ei));
        }

        let sB = computeSyndrome(s, B);
        if (sB.weight() <= 3) {
            return new Vector(new Array(12).fill(0).concat(s.getVec()));
        }

        ({ sum, i } = syndromeWithBRow(sB) || {});
        if (sum) {
            let ei = new Array(12).fill(0);
            ei[i] = 1;
            return new Vector(ei.concat(sum.getVec()));
        }

        throw "Error vector could not be determined";


        /**
         * Multiples w * M to computer syndrome.
         * @param {Vector} w
         *      Vector to be multipled by M.
         * @param {Matrix} M
         *      Matrix to be multiplied with w.
         * @returns
         *      Computed syndrome value.
         */
        function computeSyndrome(w, M) {
            return new Vector(new Matrix(w).mul(M).getMatrix()[0]);
        }

        /**
         * Enumerates rows of B matrix and adds each of them to s
         * until sum's weight <= 2.
         * @param {Vector} s
         *      Syndrome to be added to each B row.
         * @returns {{sum: Vector, i: number}}
         *      Sum vector (weight <= 2) and index of B row which is the summand.
         *      If no such sum is found, return null.
         */
        function syndromeWithBRow(s) {
            for (let [i, row] of B.getMatrix().entries()) {
                let sum = s.add(new Vector(row));
                let weight = sum.weight();
                if (weight <= 2) {
                    return {
                        sum: sum,
                        i: i
                    };
                }
            }
            return null;
        }
    }
}