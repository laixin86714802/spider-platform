/*
WebSocket wrapper.
It allows multiple callbacks and forces a common message format.
*/

var EventEmitter = require("eventemitter3");

var endpointSockets = {};

export class FancyWebSocket {

    constructor(url) {
        this._ee = new EventEmitter();
        this._connect(url);
    }

    _connect(url) {
        this._conn = new WebSocket(url);
        this._conn.onmessage = (evt) => {
            var json = JSON.parse(evt.data);
            this._ee.emit(json.event, json.data);
        };
        this._conn.onopen = () => { this._ee.emit('open', null) };
        this._conn.onclose = (e) => { this._ee.emit('close', e) };
        this._conn.onerror = (e) => { this._ee.emit('error', e) };
        this._url = url;
    }

    reconnect() {
        this._conn.close();
        this._connect(this._url);
    }

    /* Listen to incoming messages */
    on(event, callback) { this._ee.on(event, callback) }
    off(event, callback) { this._ee.off(event, callback) }
    once(event, callback) { this._ee.once(event, callback) }

    /* Send data to the websocket */
    send(event, data) {
        var payload = JSON.stringify({event: event, data: data});
        this._conn.send(payload);
    }

    /* Return a FancyWebSocket on the same domain/port as current URL */
    static forEndpoint(endpoint){
        if (endpointSockets[endpoint]) {
            return endpointSockets[endpoint];
        }
        var loc = document.location;
        var url = "ws://" + loc.hostname + ":" + loc.port + endpoint;
        var socket = new FancyWebSocket(url);
        endpointSockets[endpoint] = socket;
        return socket;
    }

    /* Return a default instance */
    static instance() {
        return FancyWebSocket.forEndpoint(window.WS_SERVER_ADDRESS);
    }

}
