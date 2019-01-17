import * as sio from 'socket.io-client';
import { ConnectionEvent, RequestEvent } from '../multiturn/network/network';
import SIOClientNetworkLayer from '../multiturn/sio-network/client/layer';
import { defaultSerializer, defaultDeserializer } from '../multiturn/sio-network/serializer';

const requestId = 'request';
const responseId = 'response';
const connRefusedId = 'refused';
const closeId = 'close';

const io = sio();

const serializer = defaultSerializer('$');
const deserializer = defaultDeserializer('$');

function main() {
    console.log('Starting client');
    const layer = new SIOClientNetworkLayer(io);
    layer.addConnectionListener((e: ConnectionEvent) => {
        const socket = e.accept();
        socket.addRequestListener((e2: RequestEvent) => {
            console.log(`Request: ${e2.message}`);
        });
        socket.request('testKey', 'testMesssage').then((resp: string) => {
            console.log(`Response to testKey: ${resp}`);
        });
    });
}

main();
