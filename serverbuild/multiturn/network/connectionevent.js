"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AbstractConnectionEvent {
    constructor(socket) {
        this.socket = socket;
    }
    accept() {
        this.socket.accept();
        return this.socket;
    }
    reject() {
        this.socket.reject();
    }
}
exports.default = AbstractConnectionEvent;
