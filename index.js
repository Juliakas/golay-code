import * as BinaryField from "./binaryField.js";
import Vector from "./vector.js";
import Matrix from "./matrix.js";
import { B, B11 } from "./constants.js";
import GolayCode from "./golayCode.js";
import Channel from "./channel.js";
import ImgUtils from "./imgUtils.js"

let globalState = {
    channel: new Channel(Number($("#errProbabilityField").val())),
    code: new GolayCode()
}

initUI();

/**
 * Initializes all UI components
 */
function initUI() {

    initErrProbUI();
    initVecEncUI();
    initTextEncUI();
    initImgEncUI();

    setInputFilter($('#originalVectorField')[0], val => /^[0-1]*$/.test(val));
    setInputFilter($('#transmittedVecField')[0], val => /^[0-1]*$/.test(val));


    /**
     * Initializes error probability slider UI part
     */
    function initErrProbUI() {
        $("#errProbabilitySlider").on("input", function () {
            $("#errProbabilityField").val($(this).val());
            globalState.channel.setErrProbability($(this).val());
        });

        $("#errProbabilityField").on("input", function () {
            let val = $(this).val();
            if (!isNaN(val) && val != "0." && val >= 0 && val <= 1) {
                $("#errProbabilitySlider").val(val);
                globalState.channel.setErrProbability(val);
            }
        });
    }

    /**
     * Initializes single vector encoding UI part.
     */
    function initVecEncUI() {
        let state = {
            encoded: undefined,
            transmitted: undefined,
            previousTransmittedVec: undefined
        }

        $("#modifyVecCheck").on("input", function () {
            if ($(this).prop("checked")) {
                $(".readonly-transmitted-vec").css("display", "none");
                $(".transmitted-vec").css("display", "block");
                state.previousTransmittedVec = state.transmitted;
            } else {
                $(".readonly-transmitted-vec").css("display", "block");
                $(".transmitted-vec").css("display", "none");
                if (state.transmitted && (state.transmitted.length() != 23 || state.transmitted.getVec().some(bit => bit != 0 && bit != 1))) {
                    setStateTransmitted(state.previousTransmittedVec || new Vector([]));
                }
            }
        });

        $('#originalVectorField').on("input", function () {
            let vecStr = $(this).val()
            if (vecStr.length === 12) {
                let encoded = globalState.code.encode(new Vector(Array.from(vecStr, Number)));
                state.encoded = encoded;
                $('#encodedVecField').val(encoded.getVec().join(''));
            }
        });

        $("#sendEncodedVectorBtn").on("click", function () {
            if (!state.encoded) { return; }
            let encoded = state.encoded,
                transmitted = globalState.channel.transmitVector(encoded),
                diff = transmitted.add(encoded);
            setStateTransmitted(transmitted);

            let addedChars = 0;
            for (let i = 0; i < diff.length() + addedChars; i++) {
                if (diff.getVec()[i] == 1) {
                    $("#transmittedVecFieldReadonly").children().eq(i).addClass('red-color');
                }
            }
        });

        $("#transmittedVecField").on("input", function () {
            let updatedTransmitted = new Vector(Array.from($(this).val(), Number));
            setStateTransmitted(updatedTransmitted);
        });

        $("#decodeVecButton").on("click", function () {
            let decoded = globalState.code.decode(state.transmitted);
            $("#decodedVecField").val(decoded.getVec().join(''));
        })

        /**
         * Updates state value of transmitted vector including UI components.
         * @param {Vector} transmitted 
         */
        function setStateTransmitted(transmitted) {
            state.transmitted = transmitted;
            let transmittedStr = transmitted.getVec().join('');
            $("#transmittedVecField").val(transmittedStr);
            $("#transmittedVecFieldReadonly").html("");
            for (let bit of transmittedStr) {
                $("#transmittedVecFieldReadonly").append("<span>" + bit + "</span>");
            }
        }
    }

    /**
     * Initializes text encoding UI part.
     */
    function initTextEncUI() {
        $("#sendTextButton").on("click", function () {
            let text = $("#textInputArea").val(),
                encoder = new TextEncoder(),
                decoder = new TextDecoder(),
                bytes = encoder.encode(text),
                bitVec = Vector.fromBytes(bytes),
                leftoverBits = (12 - bitVec.length() % 12) % 12,
                chunkCount = Math.floor(bitVec.length() / 12);
            /** @type {Vector[]} */
            let splitVectors = new Array(chunkCount),
                i;
            for (i = 0; i < chunkCount; i++) {
                splitVectors[i] = new Vector(bitVec.getVec().slice(12 * i, 12 * i + 12));
            }
            if (leftoverBits != 0) {
                splitVectors.push(new Vector(bitVec.getVec().slice(12 * i, 12 * i + 12 - leftoverBits)));
                splitVectors[splitVectors.length - 1].getVec().push(...new Array(leftoverBits).fill(0));
            }

            let decodedUnchangedBytes = processPartitionedBits(
                splitVectors,
                leftoverBits,
                vec => globalState.code.decodeNoCorrection(vec)
            );

            let correctedBytes = processPartitionedBits(
                splitVectors,
                leftoverBits,
                vec => globalState.code.decode(vec)
            )

            $("#textUnchangedArea").val(decoder.decode(new Uint8Array(decodedUnchangedBytes)));
            $("#textCorrectedArea").val(decoder.decode(new Uint8Array(correctedBytes)));
        });
    }

    /**
     * Initializes image encoding UI part.
     */
    function initImgEncUI() {
        $('#imgFile').on("input", function (evt) {
            let file = evt.target.files[0];
            let fr = new FileReader();
            fr.onload = function () {
                $('#uploadedImg')[0].src = fr.result;
                $('#uploadedImg').css('border', 'none');
            }
            fr.readAsDataURL(file);
        });

        $("#sendPictureBtn").on("click", function () {
            toDataURL($('#uploadedImg')[0].src, function (dataURL) {
                let [dataURLHead, rawBase64] = dataURL.split(','),
                    {header: imgHeader, data: bitVec} = ImgUtils.splitHeader(dataURLHead, rawBase64),
                    leftoverBits = (12 - bitVec.length() % 12) % 12,
                    chunkCount = Math.floor(bitVec.length() / 12);
                /** @type {Vector[]} */
                let splitVectors = new Array(chunkCount),
                    i;
                for (i = 0; i < chunkCount; i++) {
                    splitVectors[i] = new Vector(bitVec.getVec().slice(12 * i, 12 * i + 12));
                }
                if (leftoverBits != 0) {
                    splitVectors.push(new Vector(bitVec.getVec().slice(12 * i, 12 * i + 12 - leftoverBits)));
                    splitVectors[splitVectors.length - 1].getVec().push(...new Array(leftoverBits).fill(0));
                }

                let decodedUnchangedBytes = processPartitionedBits(
                    splitVectors,
                    leftoverBits,
                    vec => globalState.code.decodeNoCorrection(vec)
                );

                $("#unchangedImg").attr("src", dataURLHead + ','
                    + btoa(imgHeader + decodedUnchangedBytes.reduce(
                        (acum, byte) => acum + String.fromCharCode(byte), ""))
                    );
                $("#unchangedImg").css('border', 'none');
                let correctedBytes = processPartitionedBits(
                    splitVectors,
                    leftoverBits,
                    vec => globalState.code.decode(vec)
                )

                $("#correctedImg").attr("src", dataURLHead + ','
                    + btoa(imgHeader + correctedBytes.reduce(
                        (acum, byte) => acum + String.fromCharCode(byte), ""))
                    );
                $("#correctedImg").css('border', 'none');

            });
        });
    }
}

/**
 * Processes partitioned vector of bits, performs encoding, transmitting through
 * channel and decoding of each vector in bits array. Finally, convert results back to bytes.
 * @param {Vector[]} bits 
 *      Partitioned bit vector to be processed.
 * @param {number} leftoverBits
 *      number of leftover bits that should be discarded in the end.
 * @param {function(Vector): Vector} decoder
 *      A decoder function used internally to decode each vector of bits.
 * @returns {number[]}
 *      Array of bytes converted from processed bits.
 */
function processPartitionedBits(bits, leftoverBits, decoder) {
    let bitBuffer = [],
        result = [];
    for (let vec of bits) {
        let encodedVec = globalState.code.encode(vec),
            transmittedVec = globalState.channel.transmitVector(encodedVec),
            decodedVec = decoder(transmittedVec);
        let bytesCount = Math.floor((decodedVec.length() + bitBuffer.length) / 8);
        while (decodedVec.length() > 0) {
            bitBuffer.push(decodedVec.getVec().shift())
        }
        for (let i = 0; i < bytesCount; i++) {
            let byte = 0;
            for (let j = 0; j < 8; j++) {
                byte = byte | (bitBuffer.shift() << 7 - j);
            }
            result.push(byte);
        }
    }
    if (leftoverBits >= 8) result.pop();
    return result;
}

/**
 * Adds filters for textbox specified as a predicate callback inputFilter
 * @param {HTMLElement} textbox 
 *      HTML input element to have filters applied.
 * @param {function(string): boolean} inputFilter
 *      Input filter predicate that is called with textbox value string for validation.
 */
function setInputFilter(textbox, inputFilter) {
    ["input", "keydown", "keyup", "mousedown", "mouseup", "select", "contextmenu", "drop"].forEach(function (event) {
        textbox.addEventListener(event, function () {
            if (inputFilter(this.value)) {
                this.oldValue = this.value;
                this.oldSelectionStart = this.selectionStart;
                this.oldSelectionEnd = this.selectionEnd;
            } else if (this.hasOwnProperty("oldValue")) {
                this.value = this.oldValue;
                this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
            } else {
                this.value = "";
            }
        });
    });
}

/**
 * Picks image from specified url and reads it as ArrayBuffer.
 * Result is transferred as parameter to callback function.
 * @param {string} url 
 * @param {function(string|ArrayBuffer)} callback 
 */
function toDataURL(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('get', url);
    xhr.responseType = 'blob';
    xhr.onload = function () {
        var fr = new FileReader();

        fr.onload = function () {
            callback(this.result);
        };

        fr.readAsDataURL(xhr.response); // async call
    };

    xhr.send();
}

/**
 * Function to generate random vectors to test encoding and decoding algorithm.
 * Encoded vector always has 3 bits distorted before decoding.
 * @param {number} times
 *      number of times to generate.
 */
function testRandomVectors(times) {
    let code = new GolayCode();
    for (let i = 0; i < times; i++) {
        let original = Array.from({ length: 12 }, () => Math.floor(Math.random() * 2)),
            arr = code.encode(new Vector(original)).getVec(),
            n = 3,
            len = arr.length,
            taken = new Array(len);
        while (n--) {
            let x = Math.floor(Math.random() * len);
            let index = x in taken ? taken[x] : x
            arr[index] = arr[index] == 0 ? 1 : 0;
            taken[x] = --len in taken ? taken[len] : len;
        }

        let decoded = code.decode(new Vector(arr)).getVec();

        if (JSON.stringify(original) !== JSON.stringify(decoded)) {
            throw "Test case failed";
        }
    }
}

function testEfficienty(errProb) {
    let code = new GolayCode();
    let channel = new Channel(errProb);
    let times = 10000;
    let countCorrect = 0;
    for (let i = 0; i < times; i++) {
        let original = Array.from({ length: 12 }, () => Math.floor(Math.random() * 2)),
            arr = code.encode(new Vector(original)),
            sent = channel.transmitVector(arr),
            decoded = code.decode(sent).getVec();
        if (JSON.stringify(original) === JSON.stringify(decoded)) {
            countCorrect++;
        }
    }
    return countCorrect / times;
}