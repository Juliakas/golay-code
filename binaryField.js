/**
 * Adds 2 binary field numbers in modulus 2 arithmetic.
 * @param {number} a 
 *      First number.
 * @param {number} b 
 *      Second number.
 * @returns {number}
 *      Addition result.
 */
export function add(a, b) {
    if(a > 1 || b > 1) {
        throw "Attempted to add " + a + " + " + b + " in mod 2 arithmetic";
    }
    return (a + b) % 2;
}

/**
 * Multiples 2 binary field numbers in modulus 2 arithmetic.
 * @param {number} a 
 *      First number.
 * @param {number} b 
 *      Second number.
 * @returns {number}
 *      Multiplication result.
 */
export function mul(a, b) {
    if(a > 1 || b > 1) {
        throw "Attempted to multiply " + a + " + " + b + " in mod 2 arithmetic";
    }
    return (a * b) % 2;
}