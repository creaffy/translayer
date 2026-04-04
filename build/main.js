import { ZRProxy } from "./proxies.js";
const mason = ZRProxy.createMasonProxy(); // 3002
const tcp = ZRProxy.createTcpProxy(); // 3003
const udp = ZRProxy.createUdpProxy(); // 3004
process.on("SIGINT", () => {
    mason.stop();
    tcp.stop();
    udp.stop();
    process.exit();
});
