// http://erlang.org/doc/apps/erts/erl_ext_dist.html
var TERM = {
    NEW_FLOAT          : {value:70,     name: "NEW_FLOAT_EXT",        code:"NFE"},
    BIT_BINARY         : {value:77,     name: "BIT_BINARY_EXT",       code:"BBE"},
    ZIP                : {value:80,     name: "ZIP_EXT",              code:"ACR"},
    ATOM_CACHE_REF     : {value:82,     name: "ATOM_CACHE_REF",       code:"ACR"},
    SMALL_INTEGER      : {value:97,     name: "SMALL_INTEGER_EXT",    code:"SIE"},
    INTEGER            : {value:98,     name: "INTEGER_EXT",          code:"IEX"},
    FLOAT              : {value:99,     name: "FLOAT_EXT",            code:"FEX"},
    ATOM               : {value:100,    name: "ATOM_EXT",             code:"ATM"},
    REFERENCE          : {value:101,    name: "REFERENCE_EXT",        code:"REF"},
    PORT               : {value:102,    name: "PORT_EXT",             code:"PRT"},
    PID                : {value:103,    name: "PID_EXT",              code:"PID"},
    SMALL_TUPLE        : {value:104,    name: "SMALL_TUPLE_EXT",      code:"STE"},
    LARGE_TUPLE        : {value:105,    name: "LARGE_TUPLE_EXT",      code:"LTE"},
    NIL                : {value:106,    name: "NIL_EXT",              code:"NEX"},
    STRING             : {value:107,    name: "STRING_EXT",           code:"STR"},
    LIST               : {value:108,    name: "LIST_EXT",             code:"LST"},
    BINARY             : {value:109,    name: "BINARY_EXT",           code:"BIN"},
    SMALL_BIG          : {value:110,    name: "SMALL_BIG_EXT",        code:"SBN"},
    LARGE_BIG          : {value:111,    name: "LARGE_BIG_EXT",        code:"LBN"},
    NEW_FUN            : {value:112,    name: "NEW_FUN_EXT",          code:"NFN"},
    EXPORT             : {value:113,    name: "EXPORT_EXT",           code:"EXP"},
    NEW_REFERENCE      : {value:114,    name: "NEW_REFERENCE_EXT",    code:"NRF"},
    SMALL_ATOM         : {value:115,    name: "SMALL_ATOM_EXT",       code:"SAT"},
    FUN                : {value:117,    name: "FUN_EXT",              code:"FUN"},
    ATOM_UTF8          : {value:118,    name: "ATOM_UTF8_EXT",        code:"AT8"},
    SMALL_ATOM_UTF8    : {value:119,    name: "SMALL_ATOM_UTF8_EXT",  code:"SA8"},
};

function decode_r(buf)
{
    switch(buf[0]) {
        case TERM.ZIP.value:
            console.debug(TERM.ZIP.name);
            if(buf.length < 5)
                throw("insufficient buf length for compressed erlang binary term "+buf.length);
            // In bigendian byte order
            var uzlen = new Uint32Array((new Uint8Array([buf[4], buf[3], buf[2], buf[1]])).buffer)[0];
            var unzipped = (new Zlib.Inflate(buf.subarray(5, buf.length))).decompress();
            if (unzipped == undefined || unzipped.length != uzlen)
                throw('binary term unzip length missmatch; expected '+uzlen+' got '+unzipped.length);
            console.debug('Unzipped ' + unzipped.length+' bytes');
            return {zipped: decode_r(unzipped)};
            break;
        case TERM.NEW_FLOAT.value:
            console.debug(TERM.NEW_FLOAT.name);
            break;
        case TERM.BIT_BINARY.value:
            console.debug(TERM.BIT_BINARY.name);
            break;
        case TERM.ATOM_CACHE_REF.value:
            console.debug(TERM.ATOM_CACHE_REF.name);
            break;
        case TERM.SMALL_INTEGER.value:
            console.debug(TERM.SMALL_INTEGER.name);
            return {int: {
                tlen    : 2,
                val     : buf[1]
            }};
            break;
        case TERM.INTEGER.value:
            console.debug(TERM.INTEGER.name);
            return {int: {
                tlen    : 5,
                val     : new Int32Array((new Uint8Array([buf[4], buf[3], buf[2], buf[1]])).buffer)[0]
            }};
            break;
        case TERM.FLOAT.value:
            console.debug(TERM.FLOAT.name);
            if(buf.length < 32)
                throw("insufficient buf length for erlang float "+buf.length);
            var floatStr = String.fromCharCode.apply(null, buf.subarray(1, 32));
            return { float : {
                tlen        : 32,
                floatstr    : floatStr,
                val         : parseFloat(floatStr)
            }};
            break;
        case TERM.ATOM.value:
            console.debug(TERM.ATOM.name);
            if(buf.length < 3)
                throw("insufficient buf length for erlang atom "+buf.length);
            // In bigendian byte order
            var atomlen = new Uint16Array((new Uint8Array([buf[2], buf[1]])).buffer)[0];
            if(buf.length < 3+atomlen)
                throw('buf size missmatch for erlang atom got '+buf.length+' needed '+(3+atomlen));
            var data = String.fromCharCode.apply(null, buf.subarray(3, 3 + atomlen));
            console.debug(data);
            return {atom: {
                tlen    : 3+atomlen,
                val     : data
            }};
            break;
        case TERM.REFERENCE.value:
            console.debug(TERM.REFERENCE.name);
            var term = decode_r(buf.subarray(1));
            if(buf.length < term.atom.tlen+4+1)
                throw('buf size missmatch for erlang ref got '+buf.length+' needed '+(term.atom.tlen+4+1));
            console.debug(term.atom.data);
            return {pid : {
                tlen        : term.atom.tlen+4+1,
                node        : term.atom.val,
                id          : toArray(buf.subarray(term.atom.tlen, term.atom.tlen+4)),
                creation    : buf[term.atom.tlen+4]
            }};
            break;                                   
        case TERM.PORT.value:
            console.debug(TERM.PORT.name);
            var term = decode_r(buf.subarray(1));
            if(buf.length < term.atom.tlen+4+1)
                throw('buf size missmatch for erlang port got '+buf.length+' needed '+(term.atom.tlen+4+1));
            console.debug(term.atom.data);
            return {port : {
                tlen        : 1+term.atom.tlen+4+1,
                node        : term.atom.val,
                id          : toArray(buf.subarray(1+term.atom.tlen, 1+term.atom.tlen+4)),
                creation    : buf[1+term.atom.tlen+4]
            }};
            break;
        case TERM.PID.value:
            console.debug(TERM.PID.name);
            var term = decode_r(buf.subarray(1));
            if(buf.length < term.atom.tlen+4+4+1)
                throw('buf size missmatch for erlang pid got '+buf.length+' needed '+(term.atom.tlen+4+4+1));
            console.debug(term.atom.data);
            return {pid : {
                tlen        : 1+term.atom.tlen+4+4+1,
                node        : term.atom.val,
                id          : toArray(buf.subarray(1+term.atom.tlen, 1+term.atom.tlen+4)),
                serial      : toArray(buf.subarray(1+term.atom.tlen+4, 1+term.atom.tlen+8)),
                creation    : buf[1+term.atom.tlen+8]
            }};
            break;
        case TERM.SMALL_TUPLE.value:
            console.debug(TERM.SMALL_TUPLE.name);
            if(buf.length < 2)
                throw('buf size missmatch for erlang tuple got '+buf.length+' needed 2');
            var arity = buf[1];
            if(arity > 0 && buf.length < 3)
                throw('buf size missmatch for nonempty erlang tuple got '+buf.length+' needed > 3');

            var tlen = 2;
            var term = {tlen:0};
            var val = new Array();
            for(var i=0; i < arity; ++i) {
                tlen += get_tlen(term);
                term = decode_r(buf.subarray(tlen));
                val[val.length] = term;
            }
            if(val.length > 1)
                tlen += get_tlen(val[val.length-1]);
            return {tuple : {
                tlen    : tlen,
                arity   : arity,
                val     : val
            }};
            break;
        case TERM.LARGE_TUPLE.value:
            console.debug(TERM.LARGE_TUPLE.name);
            break;
        case TERM.NIL.value:
            console.debug(TERM.NIL.name);
            return {nil: {
                    tlen    : 1
                }};
            break;
        case TERM.STRING.value:
            console.debug(TERM.STRING.name);
            if(buf.length < 3)
                throw("insufficient buf length for erlang string "+buf.length);
            // In bigendian byte order
            var stringlen = new Uint16Array((new Uint8Array([buf[2], buf[1]])).buffer)[0];
            if(buf.length < 3+stringlen)
                throw('buf size missmatch for erlang string got '+buf.length+' needed '+(3+stringlen));
            var data = String.fromCharCode.apply(null, buf.subarray(3, 3 + stringlen));
            console.debug(data);
            return {string: {
                tlen    : 3+stringlen,
                val     : data
            }};            
            break;
        case TERM.LIST.value:
            console.debug(TERM.LIST.name);
            if(buf.length < 5)
                throw('buf size missmatch for erlang tuple got '+buf.length+' needed 5');
            var length = new Uint32Array((new Uint8Array([buf[4], buf[3], buf[2], buf[1]])).buffer)[0];
            if(length > 0 && buf.length < 6)
                throw('buf size missmatch for nonempty erlang list got '+buf.length+' needed > 6');

            var tlen = 5;
            var term = {tlen:0};
            var val = new Array();
            for(var i=0; i < length; ++i) {
                tlen += get_tlen(term);
                term = decode_r(buf.subarray(tlen));
                val[val.length] = term;
            }
            tlen += get_tlen(val[val.length-1]);
            var tail = decode_r(buf.subarray(tlen));
            tlen += get_tlen(tail);
            return {list : {
                tlen    : tlen,
                length  : length,
                val     : val,
                tail    : tail
            }};
            break;
        case TERM.BINARY.value:
            console.debug(TERM.BINARY.name);
            if(buf.length < 5)
                throw("insufficient buf length for erlang term binary "+buf.length);
            // In bigendian byte order
            var binlen = new Uint32Array((new Uint8Array([buf[4], buf[3], buf[2], buf[1]])).buffer)[0];
            if(buf.length < 5+binlen)
                throw('buf size missmatch for erlang term binary got '+buf.length+' needed '+(5+binlen));
            var data = buf.subarray(5);
            console.debug(data);
            return {binary: {
                tlen    : 1+4+binlen,
                val     : data
            }};
            break;
        case TERM.SMALL_BIG.value:
            console.debug(TERM.SMALL_BIG.name);
            if(buf.length < 3)
                throw("insufficient buf length for erlang small_big "+buf.length);
            var digit_count = parseInt(buf[1]);
            var sign = parseInt(buf[2]);
            if(buf.length < 3+digit_count)
                throw("insufficient buf length for erlang small_big digits "+buf.length+" required "+(3+digit_count));
            var digits = toArray(buf.subarray(3));
            var val = 0;
            for(var n = 0; n < digit_count; ++n)
                val += (digits[n]*Math.pow(256,n));
            val = (sign > 0 ? -val: val);
            return { int: { 
                tlen    : 3+digit_count,
                n       : digit_count,
                sign    : sign,
                digits  : digits,
                val     : val
            }};
            break;
        case TERM.LARGE_BIG.value:
            console.debug(TERM.LARGE_BIG.name);
            if(buf.length < 6)
                throw("insufficient buf length for erlang small_big "+buf.length);
            var digit_count = new Uint32Array((new Uint8Array([buf[4], buf[3], buf[2], buf[1]])).buffer)[0];
            var sign = parseInt(buf[2]);
            if(buf.length < 3+digit_count)
                throw("insufficient buf length for erlang small_big digits "+buf.length+" required "+(3+digit_count));
            var digits = toArray(buf.subarray(6));
            var val = 0;
            for(var n = 0; n < digit_count; ++n)
                val += (digits[n]*Math.pow(256,n));
            val = (sign > 0 ? -val: val);
            return { int: {
                tlen    : 6+digit_count,
                n       : digit_count,
                sign    : sign,
                digits  : digits,
                val     : val
            }};
            break;
        case TERM.NEW_FUN.value:
            console.debug(TERM.NEW_FUN.name);
            break;
        case TERM.EXPORT.value:
            console.debug(TERM.EXPORT.name);
            break;
        case TERM.NEW_REFERENCE.value:
            console.debug(TERM.NEW_REFERENCE.name);
            var reflen = new Uint16Array((new Uint8Array([buf[2], buf[1]])).buffer)[0];
            console.debug(reflen);
            var term = decode_r(buf.subarray(3));
            var totreflen = 3+term.atom.tlen+1+reflen*4;
            if(buf.length < totreflen)
                throw('buf size missmatch for erlang new reference got '+buf.length+' needed '+totreflen);
            console.debug(term.atom.val);
            return {ref : {
                tlen        : totreflen,
                len         : reflen,
                node        : term.atom.val,
                creation    : buf.subarray(3+term.atom.tlen, 3+term.atom.tlen+1)[0],
                ids         : toArray(buf.subarray(3+term.atom.tlen+1))
            }};
            break;                                   
        case TERM.SMALL_ATOM.value:
            console.debug(TERM.SMALL_ATOM.name);
            break;
        case TERM.FUN.value:
            console.debug(TERM.FUN.name);
            break;
        case TERM.ATOM_UTF8.value:
            console.debug(TERM.ATOM_UTF8.name);
            break;
        default:
            throw('Unknown term type '+buf[0]);
            break;
    }
}

function get_tlen(term)
{
    if(term.hasOwnProperty('tlen'))
        return term.tlen;
    else {
        for(var prop in term)
            if(term.hasOwnProperty(prop) && term[prop].hasOwnProperty('tlen'))
                return term[prop].tlen;
    }
}

function toArray(arr)
{
    var array = new Array();
    for(var i = 0; i < arr.length; ++i)
        array[array.length] = arr[i];
    return array;
}

function decode(buf)
{
    if(buf.length < 2)
        throw("insufficient buf length for valid erlang binary term "+buf.length);
    
    if(buf[0] != 131)
        throw("erlang term version not supported");

    // Dropping the version for recursion index uniformity
    // Now the first byte is always tag
    return decode_r(buf.subarray(1,buf.length));
}

function encode(term)
{
    if(buf.length < 2)
        throw("insufficient buf length for valid erlang binary term "+buf.length);
    
    if(buf[0] != 131)
        throw("erlang term version not supported");

    // Dropping the version for recursion index uniformity
    // Now the first byte is always tag
    return decode_r(buf.subarray(1,buf.length));
}

// io:format("~p~n",[term_to_binary(list_to_binary([I rem 255 || I <- lists:seq(1,300)]), [compressed])])
var test_zip_bin = [
  131,80,0,0,1,49,120,156,203,101,96,96,212,97,100,98,102,97,101,99,231,224,
  228,226,230,225,229,227,23,16,20,18,22,17,21,19,151,144,148,146,150,145,149,
  147,87,80,84,82,86,81,85,83,215,208,212,210,214,209,213,211,55,48,52,50,54,
  49,53,51,183,176,180,178,182,177,181,179,119,112,116,114,118,113,117,115,247,
  240,244,242,246,241,245,243,15,8,12,10,14,9,13,11,143,136,140,138,142,137,
  141,139,79,72,76,74,78,73,77,75,207,200,204,202,206,201,205,203,47,40,44,42,
  46,41,45,43,175,168,172,170,174,169,173,171,111,104,108,106,110,105,109,107,
  239,232,236,234,238,233,237,235,159,48,113,210,228,41,83,167,77,159,49,115,
  214,236,57,115,231,205,95,176,112,209,226,37,75,151,45,95,177,114,213,234,53,
  107,215,173,223,176,113,211,230,45,91,183,109,223,177,115,215,238,61,123,247,
  237,63,112,240,208,225,35,71,143,29,63,113,242,212,233,51,103,207,157,191,
  112,241,210,229,43,87,175,93,191,113,243,214,237,59,119,239,221,127,240,240,
  209,227,39,79,159,61,127,241,242,213,235,55,111,223,189,255,240,241,211,231,
  47,95,191,125,255,241,243,215,239,63,127,255,49,144,228,125,0,225,76,131,39
];

// term_to_binary(hello). 
var test_atom_bin = [
131,100,0,5,104,101,108,108,111
];

$(document).ready( function() {
    $('#decode').click(function() {
        var intstrs = $('#binary').val().split(',');
        var ints = new Array();
        for(var i=0; i < intstrs.length; ++i)
            ints[ints.length] = parseInt(intstrs[i]);
        var bin = new Uint8Array(ints);
        $('#term').html(JSON.stringify(decode(bin)));
    });
});

