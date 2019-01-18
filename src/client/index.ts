import * as sio from 'socket.io-client';
import AuthClientNetworkLayer from '../multiturn/auth-network/client/layer';
import { ConnectionEvent, RequestEvent } from '../multiturn/network/network';
import SIOClientNetworkLayer from '../multiturn/sio-network/client/layer';

const io = sio();

function main() {
    console.log('Starting client');
    const netLayer = new SIOClientNetworkLayer(io);
    const authLayer = new AuthClientNetworkLayer(netLayer);
    authLayer.addConnectionListener((e: ConnectionEvent) => {
        const socket = e.accept();
        socket.addRequestListener((e2: RequestEvent) => {
            console.log(`Request: ${e2.message}`);
        });
        socket.request('testKey', 'testMesssage').then((resp: string) => {
            console.log(`Response to testKey: ${resp}`);
        });
    });
    authLayer.listen();
}

main();
