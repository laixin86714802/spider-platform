require("babel-core/polyfill");

var Reflux = require("reflux");
var { FancyWebSocket } = require("../utils/FancyWebSocket");
var JobStore = require("./JobStore");


export var Actions = Reflux.createActions(["update", "reconnect"]);


export var store = Reflux.createStore({
    init: function () {
        this.status = "offline";
        this.listenToMany(Actions);
        this.listenTo(JobStore.store, this.onJobListChanged);
    },

    getInitialState: function () {
        return this.status;
    },

    onJobListChanged: function (jobs) {
        if (jobs.some(job => job.status == "crawling")) {
            this.status = "crawling";
            this.trigger(this.status);
        }
        else if (this.status == "crawling") {
            this.status = "online";
            this.trigger(this.status);
        }
    },

    onUpdate: function (status) {
        this.status = status;
        this.trigger(status);
    },

    onReconnect: function () {
        socket.reconnect();
    }
});


var socket = FancyWebSocket.instance();
socket.on("open", () => { Actions.update('online') });
socket.on("close", () => { Actions.update('offline') });

