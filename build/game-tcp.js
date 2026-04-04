import { WebSocketServer, WebSocket } from "ws";
import { Codec, rpcMappingFromFile } from "zombslib-dev";
import { createServer as createHttpsServer } from "https";
import { readFileSync } from "fs";
export var GameServer;
(function (GameServer) {
    let info;
    function createServer() {
        const https = createHttpsServer({
            key: readFileSync("C:\\Users\\KacperPC\\Desktop\\Coding\\transcription layer\\pk.pem"),
            cert: readFileSync("C:\\Users\\KacperPC\\Desktop\\Coding\\transcription layer\\cert.pem"),
        });
        const proxy = new WebSocketServer({ server: https });
        https.listen(3003, "127.0.0.1", () => {
            console.log(`Game: proxy server has started`);
        });
        proxy.on("connection", (client) => {
            if (!info) {
                return;
            }
            client.binaryType = "arraybuffer";
            console.log(`Game: client has connected`);
            /*
            const a_codec = new Codec(
                rpcMappingFromFile(
                    "C:\\Users\\KacperPC\\Desktop\\Coding\\transcription layer\\codec-android.json",
                ),
            );
            */
            const w_codec = new Codec(rpcMappingFromFile("C:\\Users\\KacperPC\\Desktop\\Coding\\transcription layer\\codec-windows.json"));
            const url = `wss://${info.hostnameV4}/${info.endpoint}`;
            const server = new WebSocket(url);
            server.binaryType = "arraybuffer";
            console.log(`Game: ${url}`);
            client.on("close", () => {
                console.log(`Game: client has disconnected. closing down game server connection.`);
                server.close();
            });
            server.on("close", () => {
                console.log(`Game: game server connection has closed down. disconnecting client.`);
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
                console.log(`Game: proxy server shutting down`);
                proxy.close();
            },
        };
    }
    GameServer.createServer = createServer;
    function setServerInfo(server) {
        info = server;
    }
    GameServer.setServerInfo = setServerInfo;
})(GameServer || (GameServer = {}));
