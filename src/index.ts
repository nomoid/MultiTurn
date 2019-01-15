import * as sio from 'socket.io-client';
import { defaultSerializer, defaultDeserializer } from './multiturn/sio-network/serializer';

const requestId = 'request';
const responseId = 'response';
const connRefusedId = 'refused';
const closeId = 'close';

const io = sio();

const serializer = defaultSerializer('$');
const deserializer = defaultDeserializer('$');

function main() {
    console.log('Starting client');
    io.on(responseId, (value: string) => {
        const [success, key, message] = deserializer(value);
        if (success) {
            console.log(`Response with key ${key} and message ${message}`);
        }
    });
    io.emit(requestId, serializer('testKey', 'testMessage'));
}

main();
