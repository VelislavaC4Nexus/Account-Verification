var Encoding = require('dw/crypto/Encoding');

function encode(password) {
    return Encoding.toBase64(new dw.util.Bytes(password, 'UTF-8'));
}

function decode(password) {
    return new dw.util.Bytes(Encoding.fromBase64(password)).toString();
}

module.exports = {
    encode: encode,
    decode: decode
}