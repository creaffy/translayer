import { WebSocketServer } from "ws";
import { MasonService } from "zombslib-dev";
import { createServer as createHttpServer } from "http";
export var MasonServer;
(function (MasonServer) {
    function createServer(port) {
        const proxy = new WebSocketServer({ noServer: true });
        proxy.on("connection", (client) => {
            const server = new MasonService();
            client.on("message", (msg) => {
                console.log(msg.toString());
                server.send(msg.toString());
            });
            client.on("close", () => {
                server.shutdown();
            });
            server.on("any", (e, d, r) => {
                if (e === "socketIoSessionData") {
                    client.send(r);
                    client.send("40");
                    return;
                }
                if (e === "partyMetadataUpdated") {
                    const m = MasonService.stringify("partyMetadataUpdated", {
                        tournamentCode: "test",
                        tournamentName: "Test",
                    });
                    console.log(m);
                    client.send(m);
                    return;
                }
                else {
                    client.send(r);
                }
            });
        });
        const http = createHttpServer();
        http.on("upgrade", (req, socket, head) => {
            proxy.handleUpgrade(req, socket, head, (ws) => {
                proxy.emit("connection", ws, req);
            });
        });
        http.listen(port, "127.0.0.1", () => {
            console.log(`[Mason]: Running HTTP on http://127.0.0.1:${port}`);
        });
        return {
            stop: () => {
                console.log(`[Mason]: Shutting down`);
                proxy.close();
            },
        };
    }
    MasonServer.createServer = createServer;
})(MasonServer || (MasonServer = {}));
