"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connectionevent_1 = require("../network/connectionevent");
const serializer_1 = require("./serializer");
const socket_1 = require("./socket");
/**
 * A socket.io based implementation of the Network layer
 */
class SIONetworkLayer {
    constructor(io, serializer, deserializer) {
        this.io = io;
        this.listening = false;
        this.listeners = [];
        if (serializer) {
            this.serializer = serializer;
        }
        else {
            this.serializer = serializer_1.defaultSerializer('$');
        }
        if (deserializer) {
            this.deserializer = deserializer;
        }
        else {
            this.deserializer = serializer_1.defaultDeserializer('$');
        }
    }
    listen() {
        if (this.listening) {
            return;
        }
        this.listening = true;
        this.io.on('connection', (socket) => {
            for (const listener of this.listeners) {
                const internalSocket = new socket_1.default(socket, this.serializer, this.deserializer);
                const event = new connectionevent_1.default(internalSocket);
                listener(event);
            }
        });
    }
    addConnectionListener(callback) {
        this.listeners.push(callback);
    }
}
exports.default = SIONetworkLayer;
