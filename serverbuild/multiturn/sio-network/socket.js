"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const requestevent_1 = require("../network/requestevent");
const requestId = 'request';
const responseId = 'response';
const connRefusedId = 'refused';
const closeId = 'close';
class SIONetworkSocket {
    constructor(socket, serialize, deserialize) {
        this.socket = socket;
        this.serialize = serialize;
        this.deserialize = deserialize;
        // True if accepted or rejected
        this.responded = false;
        this.closed = false;
        this.listeners = [];
        this.promises = new Map();
    }
    accept() {
        if (this.responded) {
            throw Error('Socket already accepted or rejected');
        }
        this.responded = true;
        this.socket.on(requestId, (value) => {
            const [success, key, message] = this.deserialize(value);
            if (success) {
                for (const listener of this.listeners) {
                    const event = new requestevent_1.default(this, key, message);
                    listener(event);
                }
            }
            // Do nothing on failed deserializing
        });
        this.socket.on(responseId, (value) => {
            const [success, key, message] = this.deserialize(value);
            if (success) {
                if (this.promises.has(key)) {
                    const resolve = this.promises.get(key);
                    resolve(message);
                }
            }
            // Do nothing on failed deserializing
        });
    }
    reject() {
        if (this.responded) {
            throw Error('Socket already accepted or rejected');
        }
        this.responded = true;
        this.closed = true;
        this.socket.emit(connRefusedId);
        this.socket.disconnect();
    }
    addRequestListener(callback) {
        if (this.closed) {
            throw Error('Socket already closed');
        }
        this.listeners.push(callback);
    }
    request(key, message) {
        this.socketReadyCheck();
        return new Promise((resolve, reject) => {
            this.socket.emit(requestId, this.serialize(key, message));
            this.promises.set(key, resolve);
        });
    }
    respond(key, message) {
        this.socketReadyCheck();
        this.socket.emit(responseId, this.serialize(key, message));
    }
    // Closing a rejected socket/already closed socket throws an error
    close() {
        this.socketReadyCheck();
        this.closed = true;
        this.socket.emit(closeId);
        this.socket.disconnect();
    }
    socketReadyCheck() {
        if (this.closed) {
            throw Error('Socket already closed');
        }
        if (!this.responded) {
            throw Error('Socket not yet accepted');
        }
    }
}
exports.default = SIONetworkSocket;
