import { WebSocketServer, WebSocket } from "ws";
import { Codec, MasonService, PacketId, rpcMappingFromFile, } from "zombslib";
import { createServer as createHttpsServer } from "https";
import { readFileSync } from "fs";
import { createSocket } from "dgram";
const PORT_MASON_PROXY = 3002;
const PORT_TCP_PROXY = 3003;
const PORT_UDP_PROXY = 3004;
export var ZRProxy;
(function (ZRProxy) {
    let gameServer;
    let a_codec;
    let w_codec;
    function createMasonProxy() {
        const proxy = new WebSocketServer({ port: PORT_MASON_PROXY });
        console.log(`MASON: Proxy server is listening on port ${PORT_MASON_PROXY}`);
        proxy.on("connection", (client) => {
            const server = new MasonService();
            console.log(`MASON: Client has connected`);
            client.on("close", () => {
                console.log(`MASON: Client has disconnected. Closing down Mason connection`);
                server.shutdown();
            });
            server.on("close", () => {
                console.log(`MASON: Mason connection has closed down. Disconnecting client`);
                client.close();
            });
            client.on("message", (msg) => {
                server.send(msg.toString());
            });
            server.on("any", (e, d, r) => {
                if (e === "socketIoSessionData") {
                    client.send(r);
                    client.send("40");
                    return;
                }
                if (e === "partyJoinServer") {
                    gameServer = d;
                    client.send(MasonService.stringify(e, Object.assign(Object.assign({}, d), { hostname: `127.0.0.1:${PORT_TCP_PROXY}`, hostnameV4: `127.0.0.1:${PORT_TCP_PROXY}`, ipv4: `127.0.0.1`, ipv6: `[::1]` })));
                    return;
                }
                client.send(r);
            });
        });
        return {
            stop: () => {
                console.log(`MASON: Proxy server is shutting down`);
                proxy.close();
            },
        };
    }
    ZRProxy.createMasonProxy = createMasonProxy;
    function createTcpProxy() {
        const https = createHttpsServer({
            key: readFileSync("pk.pem"),
            cert: readFileSync("cert.pem"),
        });
        const proxy = new WebSocketServer({ server: https });
        https.listen(PORT_TCP_PROXY, "127.0.0.1", () => {
            console.log(`GAME TCP: Proxy server is listening on port ${PORT_TCP_PROXY}`);
        });
        proxy.on("connection", (client) => {
            client.binaryType = "arraybuffer";
            console.log(`GAME TCP: Client has connected`);
            const a_dump = rpcMappingFromFile("codec-android.json");
            a_codec = new Codec(a_dump);
            const w_dump = rpcMappingFromFile("codec-windows.json");
            w_codec = new Codec(w_dump);
            const url = `wss://${gameServer.hostnameV4}/${gameServer.endpoint}`;
            const server = new WebSocket(url);
            server.binaryType = "arraybuffer";
            console.log(`GAME TCP: Original server URL is ${url}`);
            client.on("close", () => {
                console.log(`GAME TCP: Client has disconnected. Closing down game server connection`);
                server.close();
            });
            server.on("close", () => {
                console.log(`GAME TCP: Game server connection has closed down. Disconnecting the client`);
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
                        case PacketId.EnterWorld: {
                            const a_enterWorldResponse = w_codec.decodeEnterWorldResponse(dataArray);
                            a_codec.enterWorldResponse = a_enterWorldResponse;
                            let w_enterWorldResponse = structuredClone(a_enterWorldResponse);
                            for (const rpc of w_enterWorldResponse.rpcs) {
                                const a_rpc = a_dump.Rpcs.find((r) => r.NameHash === rpc.nameHash);
                                const w_rpc = w_dump.Rpcs.find((r) => r.ClassName === (a_rpc === null || a_rpc === void 0 ? void 0 : a_rpc.ClassName));
                                if (w_rpc) {
                                    rpc.nameHash = w_rpc.NameHash;
                                    for (const param of rpc.parameters) {
                                        const a_param = a_rpc === null || a_rpc === void 0 ? void 0 : a_rpc.Parameters.find((p) => p.NameHash === param.nameHash);
                                        const w_param = w_rpc.Parameters.find((p) => p.FieldName ===
                                            (a_param === null || a_param === void 0 ? void 0 : a_param.FieldName));
                                        if (w_param) {
                                            param.nameHash = w_param.NameHash;
                                            param.internalIndex =
                                                w_param.InternalIndex;
                                        }
                                    }
                                }
                            }
                            w_enterWorldResponse.udpPort = PORT_UDP_PROXY;
                            w_codec.enterWorldResponse = w_enterWorldResponse;
                            client.send(w_codec.encodeEnterWorldResponse(w_enterWorldResponse));
                            break;
                        }
                        case PacketId.Rpc: {
                            const a_rpc = a_codec.decodeRpc(a_codec.crypto.cryptRpc(dataArray), false);
                            if (a_rpc) {
                                const w_rpc = w_codec.encodeRpc(a_rpc.name, a_rpc.data, a_rpc.extra.tick);
                                if (w_rpc) {
                                    client.send(w_codec.crypto.cryptRpc(w_rpc));
                                }
                            }
                            break;
                        }
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
                        case PacketId.EnterWorld: {
                            const w_enterWorldRequest = w_codec.decodeEnterWorldRequest(dataArray);
                            const a_enterWorldRequest = {
                                displayName: w_enterWorldRequest.displayName,
                                version: a_dump.Codec,
                                proofOfWork: a_codec.crypto.generateProofOfWork(gameServer.endpoint, "Android"),
                            };
                            a_codec.crypto.computeRpcKey(a_dump.Codec, new TextEncoder().encode("/" + gameServer.endpoint), a_enterWorldRequest.proofOfWork);
                            w_codec.crypto.computeRpcKey(w_dump.Codec, new TextEncoder().encode("/" + gameServer.endpoint), w_enterWorldRequest.proofOfWork);
                            server.send(a_codec.encodeEnterWorldRequest(a_enterWorldRequest));
                            break;
                        }
                        case PacketId.Rpc: {
                            const w_rpc = w_codec.decodeRpc(w_codec.crypto.cryptRpc(dataArray), false);
                            if ((w_rpc === null || w_rpc === void 0 ? void 0 : w_rpc.name) === "SetPlatformRpc") {
                                w_rpc.data.platform =
                                    "Android";
                            }
                            if (w_rpc) {
                                const a_rpc = a_codec.encodeRpc(w_rpc.name, w_rpc.data);
                                if (a_rpc) {
                                    server.send(a_codec.crypto.cryptRpc(a_rpc));
                                }
                            }
                            break;
                        }
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
                console.log(`GAME TCP: Proxy server is shutting down`);
                proxy.close();
            },
        };
    }
    ZRProxy.createTcpProxy = createTcpProxy;
    function createUdpProxy() {
        const proxy = createSocket("udp4");
        let port = 67;
        proxy.bind(PORT_UDP_PROXY, () => {
            console.log(`GAME UDP: Proxy server is listening on port ${PORT_UDP_PROXY}`);
        });
        proxy.on("message", (msg, rinfo) => {
            if (rinfo.address === gameServer.ipv4 &&
                rinfo.port === a_codec.enterWorldResponse.udpPort) {
                const packetId = msg[0];
                switch (packetId) {
                    case PacketId.Rpc: {
                        const a_rpc = a_codec.decodeRpc(msg, true);
                        if (a_rpc) {
                            const w_rpc = w_codec.encodeUdpRpc(a_rpc === null || a_rpc === void 0 ? void 0 : a_rpc.name, a_rpc === null || a_rpc === void 0 ? void 0 : a_rpc.data, a_rpc === null || a_rpc === void 0 ? void 0 : a_rpc.extra.tick);
                            if (w_rpc) {
                                proxy.send(w_rpc, port, "127.0.0.1");
                            }
                        }
                        break;
                    }
                    default: {
                        proxy.send(msg, port, "127.0.0.1");
                        break;
                    }
                }
            }
            else {
                port = rinfo.port;
                const packetId = msg[0];
                switch (packetId) {
                    case PacketId.Rpc: {
                        const w_rpc = w_codec.decodeUdpRpc(msg);
                        if (w_rpc) {
                            const a_rpc = a_codec.encodeUdpRpc(w_rpc === null || w_rpc === void 0 ? void 0 : w_rpc.name, w_rpc === null || w_rpc === void 0 ? void 0 : w_rpc.data, w_rpc === null || w_rpc === void 0 ? void 0 : w_rpc.extra.tick);
                            if (a_rpc) {
                                proxy.send(a_rpc, a_codec.enterWorldResponse.udpPort, gameServer.ipv4);
                            }
                        }
                        break;
                    }
                    default: {
                        proxy.send(msg, a_codec.enterWorldResponse.udpPort, gameServer.ipv4);
                        break;
                    }
                }
            }
        });
        return {
            stop: () => {
                console.log(`GAME UDP: Proxy server is shutting down`);
                proxy.close();
            },
        };
    }
    ZRProxy.createUdpProxy = createUdpProxy;
})(ZRProxy || (ZRProxy = {}));
