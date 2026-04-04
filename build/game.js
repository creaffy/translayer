import { WebSocketServer, WebSocket } from "ws";
import { Codec, rpcMappingFromFile } from "zombslib-dev";
import { createServer as createHttpsServer } from "https";
import { readFileSync } from "fs";
import { createSocket } from "dgram";
let gameServer;
export function createTcpServer() {
    const https = createHttpsServer({
        key: readFileSync("C:\\Users\\KacperPC\\Desktop\\Coding\\transcription layer\\pk.pem"),
        cert: readFileSync("C:\\Users\\KacperPC\\Desktop\\Coding\\transcription layer\\cert.pem"),
    });
    const proxy = new WebSocketServer({ server: https });
    https.listen(3003, "127.0.0.1", () => {
        console.log(`Game (TCP): proxy server has started`);
    });
    proxy.on("connection", (client) => {
        client.binaryType = "arraybuffer";
        console.log(`Game (TCP): client has connected`);
        /*
            const a_codec = new Codec(
                rpcMappingFromFile(
                    "C:\\Users\\KacperPC\\Desktop\\Coding\\transcription layer\\codec-android.json",
                ),
            );
            */
        const w_codec = new Codec(rpcMappingFromFile("C:\\Users\\KacperPC\\Desktop\\Coding\\transcription layer\\codec-windows.json"));
        const url = `wss://${gameServer.hostnameV4}/${gameServer.endpoint}`;
        const server = new WebSocket(url);
        server.binaryType = "arraybuffer";
        console.log(`Game (TCP): ${url}`);
        client.on("close", () => {
            console.log(`Game (TCP): client has disconnected. closing down game server connection.`);
            server.close();
        });
        server.on("close", () => {
            console.log(`Game (TCP): game server connection has closed down. disconnecting client.`);
            client.close();
        });
        server.on("open", () => {
            server.send([7, 0]);
        });
        server.on("message", (data) => {
            if (client.readyState === WebSocket.OPEN) {
                const view = new DataView(data);
                const dataArray = new Uint8Array(data);
                const packetId = view.getUint8(0);
                switch (packetId) {
                    default: {
                        client.send(data);
                        break;
                    }
                }
            }
        });
        client.on("message", (data) => {
            if (server.readyState === WebSocket.OPEN) {
                const view = new DataView(data);
                const dataArray = new Uint8Array(data);
                const packetId = view.getUint8(0);
                switch (packetId) {
                    default: {
                        server.send(data);
                        break;
                    }
                }
            }
        });
    });
    return {
        stop: () => {
            console.log(`Game (TCP): proxy server shutting down`);
            proxy.close();
        },
    };
}
export function createUdpServer() {
    const https = createHttpsServer({
        key: readFileSync("C:\\Users\\KacperPC\\Desktop\\Coding\\transcription layer\\pk.pem"),
        cert: readFileSync("C:\\Users\\KacperPC\\Desktop\\Coding\\transcription layer\\cert.pem"),
    });
    const proxy = createSocket("udp4");
    https.listen(3004, "127.0.0.1", () => {
        console.log(`Game (UDP): proxy server has started`);
    });
    proxy.on("connection", (client) => {
        client.binaryType = "arraybuffer";
        console.log(`Game (UDP): client has connected`);
        /*
            const a_codec = new Codec(
                rpcMappingFromFile(
                    "C:\\Users\\KacperPC\\Desktop\\Coding\\transcription layer\\codec-android.json",
                ),
            );
            */
        const w_codec = new Codec(rpcMappingFromFile("C:\\Users\\KacperPC\\Desktop\\Coding\\transcription layer\\codec-windows.json"));
        const url = `wss://${gameServer.hostnameV4}/${gameServer.endpoint}`;
        const server = createSocket("udp4");
        server.connect;
        console.log(`Game (UDP): ${url}`);
        client.on("close", () => {
            console.log(`Game (UDP): client has disconnected. closing down game server connection.`);
            server.close();
        });
        server.on("close", () => {
            console.log(`Game (UDP): game server connection has closed down. disconnecting client.`);
            client.close();
        });
        server.on("message", (data) => {
            if (client.readyState === WebSocket.OPEN) {
                const view = new DataView(data);
                const dataArray = new Uint8Array(data);
                const packetId = view.getUint8(0);
                switch (packetId) {
                    default: {
                        client.send(data);
                        break;
                    }
                }
            }
        });
        client.on("message", (data) => {
            if (server.readyState === WebSocket.OPEN) {
                const view = new DataView(data);
                const dataArray = new Uint8Array(data);
                const packetId = view.getUint8(0);
                switch (packetId) {
                    default: {
                        server.send(data);
                        break;
                    }
                }
            }
        });
    });
    return {
        stop: () => {
            console.log(`Game (UDP): proxy server shutting down`);
            proxy.close();
        },
    };
}
export function setGameServerDetails(server) {
    gameServer = server;
}
