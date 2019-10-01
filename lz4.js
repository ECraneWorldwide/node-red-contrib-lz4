const lz4           = require('lz4');

const LZ_SIGNATURE  = Buffer.from([0x04, 0x22, 0x4D, 0x18]);
const CHAR_ENC      = 'utf8';
const TYPE_STRING   = 'string';
const TYPE_OBJECT   = 'object';

function tryDecode(msg, node, asString)
{
    try
    {
        msg.payload = lz4.decode(msg.payload);

        if(asString)
            msg.payload = msg.payload.toString(CHAR_ENC);

        return node.send(msg);
    }
    catch (e)
    {
        return node.error(e, msg);
    }
}

function tryEncode(msg, node)
{
    try
    {
        msg.payload = lz4.encode(msg.payload);
        return node.send(msg);
    }
    catch (e)
    {
        return node.error(e, msg);
    }
}


module.exports = function(RED)
{
    function Lz4Node(n)
    {
        RED.nodes.createNode(this, n);

        const node = this;
        const decodeStr = n.decodeStr;

        this.on(
            'input',
            function(msg)
            {
                if (!msg.hasOwnProperty('payload'))
                    return node.send(msg);

                const value = msg.payload;

                if(Buffer.isBuffer(value))
                {
                    if(value.slice(0, 4).equals(LZ_SIGNATURE))
                        return tryDecode(msg, node, decodeStr);
                    else
                        return tryEncode(msg, node);
                }

                switch (typeof value)
                {
                    case TYPE_STRING:
                        msg.payload = Buffer.from(value, CHAR_ENC);
                        return tryEncode(msg, node);

                    case TYPE_OBJECT:
                        msg.payload = Buffer.from(JSON.stringify(value), CHAR_ENC);
                        return tryEncode(msg, node);
                }

                return node.send(msg);
            }
        );
    }

    RED.nodes.registerType('lz4', Lz4Node);
};