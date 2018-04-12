var { FancyWebSocket } = require("./utils/FancyWebSocket");
var ConnectionMonitor = require("./components/ConnectionMonitor.jsx");
var ProcessStats = require("./components/ProcessStats.jsx");

$(window).ready(function() {
    ConnectionMonitor.install("monitor");
    ProcessStats.installHeader("process-stats");
});
