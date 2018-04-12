/*
A widget which shows if a server is idle/crawling or if we're not connected.
*/

var React = require('react');
var Reflux = require('reflux');
var { Label } = require('react-bootstrap');
var ConnectionStore = require("../stores/ConnectionStore");


var ConnectionMonitorWidget = React.createClass({
    STATE_CLASSES: {
        'offline': 'danger',
        'online': 'info',
        'crawling': 'success'
    },

    render: function () {
        var cls = this.STATE_CLASSES[this.props.status] || "default";
        return (
            <Label bsStyle={cls} title="reconnect" style={{cursor:"pointer"}} onClick={this.onClick}>
                {this.props.status}
            </Label>
        );
    },

    onClick: function () {
        ConnectionStore.Actions.reconnect();
    }
});


var ConnectionMonitor = React.createClass({
    mixins: [Reflux.connect(ConnectionStore.store, "status")],
    render: function () {
        return <ConnectionMonitorWidget status={this.state.status}/>;
    }
});

export function install(elemId) {
    React.render(<ConnectionMonitor />, document.getElementById(elemId));
}
