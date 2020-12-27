import Vector from "./vector.js";
import * as BinaryField from "./binaryField.js";

export default class Matrix {
    /**
     * Internal matrix property as a 2-dim number array.
     * @type {number[][]}
     * @private
     */
    matrix;

    /**
     * @param {number[][]|Vector} matrix
     *      A 2-dimensional array for initializing Matrix.
     *      If matrix is Vector, initialize as single row matrix.
     */
    constructor(matrix) {
        if (matrix instanceof Vector) {
            return new Matrix(new Array(matrix.getVec()));
        }

        this.matrix = matrix;
    }

    /**
     * Performs matrix addition (this + matrix).
     * @param {Matrix|Vector} matrix 
     *      Another matrix to be added. If matrix is of
     *      Vector type, it is converted to single row matrix.
     * @returns {Matrix}
     *      A newly created sum result matrix.
     */
    add(matrix) {
        if (matrix instanceof Vector) {
            this.add(new Matrix(matrix));
        }
        if (this.rowCount() != matrix.rowCount() || this.colCount() != matrix.colCount()) {
            throw "Invalid matrix addition: " + this.rowCount() + " x " + this.colCount()
            + " + " + matrix.rowCount() + " x " + matrix.colCount();
        }
        let res = new Array(this.rowCount());

        for (let i = 0; i < this.rowCount(); i++) {
            res[i] = new Array(this.colCount());
            for (let j = 0; j < this.colCount(); j++) {
                res[i][j] = BinaryField.add(this.matrix[i][j], matrix.getMatrix()[i][j]);
            }
        }
        return new Matrix(res);

    }

    /**
     * Performs matrix multiplication (this * matrix).
     * @param {Matrix|Vector} matrix 
     *      matrix that will be added to this. matrix is of Vector type,
     *      it is converted to single row Matrix.
     * @returns {Matrix}
     *      A newly created multiplication result matrix.
     */
    mul(matrix) {
        if (matrix instanceof Vector) {
            this.mul(new Matrix(matrix));
        }
        if (this.colCount() != matrix.rowCount()) {
            throw "Invalid matrix multiplication: " + this.rowCount() + " x " + this.colCount()
            + " * " + matrix.rowCount() + " x " + matrix.colCount();
        }

        let res = new Array(this.rowCount());
        for (let i = 0; i < this.rowCount(); i++) {
            res[i] = new Array(matrix.colCount());
            for (let j = 0; j < matrix.colCount(); j++) {
                res[i][j] = 0;
                for (let k = 0; k < this.colCount(); k++) { // this.colCount() == matrix.rowCount();
                    res[i][j] = BinaryField.add(res[i][j], BinaryField.mul(this.matrix[i][k], matrix.getMatrix()[k][j]));
                }
            }
        }
        return new Matrix(res);
    }

    /**
     * Gets the number of rows in matrix.
     * @returns {number}
     *      number of rows.
     */
    rowCount() {
        return this.matrix.length;
    }

    /**
     * Gets the number of columns in matrix.
     * @returns {number}
     *      number of columns.
     */
    colCount() {
        if (this.matrix.length > 0) {
            return this.matrix[0].length;
        }
        return 0;
    }

    /**
     * Gets internal matrix array.
     * @return {number[][]}
     *      Internal matrix array.
     */
    getMatrix() {
        return this.matrix;
    }

    /**
     * Constructs a new identity matrix of dim size.
     * @param {number} dim 
     *      Identity matrix dimensions (row and column count).
     * @returns {Matrix} 
     *      Identity matrix.
     */
    static buildIdentityMatrix(dim) {
        let res = new Array(dim);
        for (let i = 0; i < dim; i++) {
            res[i] = new Array(dim);
            for (let j = 0; j < dim; j++) {
                if (i === j) {
                    res[i][j] = 1;
                } else {
                    res[i][j] = 0;
                }
            }
        }
        return new Matrix(res);
    }

    /**
     * Joins (concatenates) matrix to this instance side by side [this, matrix].
     * Example: [[1,1][0,1]] join [[0,0][1,1]] = [[1,1,0,0][0,1,1,1]].
     * @param {Matrix} matrix
     *      matrix that will be concatenated to this. matrix will be on the right.
     * @returns {Matrix}
     *      New instance of joined matrices.
     */
    join(matrix) {
        if (matrix.rowCount() != this.rowCount()) {
            throw "Invalid matrix join operation: " + this.rowCount() + " and " + matrix.rowCount() + " rows.";
        }
        let res = new Array(this.rowCount());
        for (let [index, row] of this.getMatrix().entries()) {
            res[index] = row.concat(matrix.getMatrix()[index]);
        }
        return new Matrix(res);
    }

    /**
     * Vertically join matrices, similar to horizontal join {@link Matrix#join}.
     * This instance matrix goes on top.
     * @param {Matrix} matrix matrix that will be joined to the bottom of this.
     */
    verticalJoin(matrix) {
        if (matrix.colCount() != this.colCount()) {
            throw "Invalid matrix vertical join operation: " + this.colCount() + " and " + matrix.colCount() + " columns.";
        }
        let res = this.matrix.slice();
        for (let row of matrix.getMatrix()) {
            res.push(row);
        }
        return new Matrix(res);
    }
}