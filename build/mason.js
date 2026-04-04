import { WebSocketServer } from "ws";
import { MasonService } from "zombslib-dev";
import { setGameServerDetails } from "./proxies.js";
export function createMasonProxy() {
    const proxy = new WebSocketServer({ port: 3002 });
    console.log(`Mason: proxy server has started`);
    proxy.on("connection", (client) => {
        const server = new MasonService();
        console.log(`Mason: client has connected`);
        client.on("close", () => {
            console.log(`Mason: client has disconnected. closing down mason connection.`);
            server.shutdown();
        });
        server.on("close", () => {
            console.log(`Mason: mason connection has closed down. disconnecting client.`);
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
                setGameServerDetails(d);
                client.send(MasonService.stringify(e, Object.assign(Object.assign({}, d), { hostname: "127.0.0.1:3003", hostnameV4: "127.0.0.1:3003", ipv4: "127.0.0.1:3003", ipv6: "[::1]:3003" })));
                return;
            }
            client.send(r);
        });
    });
    return {
        stop: () => {
            console.log(`Mason: proxy server shutting down`);
            proxy.close();
        },
    };
}
