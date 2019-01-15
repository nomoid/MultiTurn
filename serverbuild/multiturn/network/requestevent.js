"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AbstractRequestEvent {
    constructor(socket, key, message) {
        this.socket = socket;
        this.key = key;
        this.message = message;
    }
    respond(message) {
        this.socket.respond(this.key, message);
    }
}
exports.default = AbstractRequestEvent;
