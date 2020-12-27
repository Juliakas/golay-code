import Vector from "./vector.js";

export default class ImgUtils {

    static formatMap = {
        png: ImgUtils.splitPng,
        webp: ImgUtils.splitWebp,
        bmp: ImgUtils.splitBmp
    }

    /**
     * Splits image header and body data from rawBase64 string.
     * Data header is determined by inspecting dataURLHead.
     * @param {string} dataURLHead
     *      Image Data URL header used to determining image format (such as png, bmp..)
     * @param {string} rawBase64 
     *      Entire Base64 image string that will be decomposed into byte data with separated header
     * @returns {{header: string, data: Vector}}
     *      Image header preserved in string and remaining data converted to Vector
     */
    static splitHeader(dataURLHead, rawBase64) {
        let binaryData = atob(rawBase64),
            bytes = binaryData.split('').map(b => b.charCodeAt(0));
        for(let format in ImgUtils.formatMap) {
            if (dataURLHead.includes(format)) {
                return ImgUtils.formatMap[format](bytes);
            }
        }
        throw "Unsuported image format: " + dataURLHead;
    }

    /**
     * @private
     * @param {number[]} bytes 
     */
    static splitPng(bytes) {
        let bitVec = Vector.fromBytes(new Uint8Array(bytes.slice(2))),
            header = String.fromCharCode.apply(null, bytes.slice(0, 2));
        return {
            header: header,
            data: bitVec
        }
    }

    /**
     * @private
     * @param {number[]} bytes 
     */
    static splitWebp(bytes) {
        let bitVec = Vector.fromBytes(new Uint8Array(bytes.slice(3))),
            header = String.fromCharCode.apply(null, bytes.slice(0, 3));
        return {
            header: header,
            data: bitVec
        }
    }

    /**
     * @private
     * @param {number[]} bytes 
     */
    static splitBmp(bytes) {
        let bitVec = Vector.fromBytes(new Uint8Array(bytes.slice(138))),
            header = String.fromCharCode.apply(null, bytes.slice(0, 138));
        return {
            header: header,
            data: bitVec
        }
    }

}