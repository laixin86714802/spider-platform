/*
Widgets for job downloads info.
*/
var React = require("react/addons");
//var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
var Reflux = require("reflux");
var filesize = require("filesize");
var prettyMs = require("pretty-ms");
var { Table } = require("react-bootstrap");

var JobStore = require("../stores/JobStore");
var { JobsMixin } = require("./RefluxMixins");



function _updatedSeenTimes(currentUrls, oldSeen) {
    var now = new Date();
    var seenAt = {};
    currentUrls.forEach(url => {seenAt[url] = now});
    Object.keys(oldSeen).filter(url => seenAt[url]).forEach(url => {
        seenAt[url] = oldSeen[url];
    });
    return seenAt;
}


function sortedRequests(requests, seenAt) {
    var arr = requests.slice();
    arr.sort((r1, r2) => seenAt[r1.url] - seenAt[r2.url]);
    return arr;
}


export var ShortTermQueueWidget = React.createClass({
    propTypes: {
        job: React.PropTypes.object.isRequired,
    },

    getInitialState: function () {
        return {seenAt: {}};
    },

    componentWillReceiveProps: function(nextProps) {
        var urls = nextProps.job.downloads.active.map(tr => tr.url);
        this.setState({seenAt: _updatedSeenTimes(urls, this.state.seenAt)});
    },

    render: function () {
        var downloads = this.props.job.downloads;
        var active = sortedRequests(downloads.active, this.state.seenAt);

        if (!active.length){
            return false;
        }

        var getSlotTable = (slot) => {
            var requests = sortedRequests(slot.active, this.state.seenAt);
            var isTransferring = {};
            slot.transferring.forEach(req => isTransferring[req.url] = true);
            var rows = requests.map(
                req => {
                    var clsName = isTransferring[req.url] ? "success" : "default";
                    return <tr key={req.url} className={clsName}><td>{req.url}</td></tr>;
                }
            );
            var delay = prettyMs((slot.delay || 0) * 1000);

                //<ReactCSSTransitionGroup transitionName="transfer"
                //                         component="tbody"
                //                         transitionLeave={false}>
                //    {rows}
                //</ReactCSSTransitionGroup>

            return <Table key={slot.key}>
                <caption>
                    {slot.key} &nbsp;
                    <span className="pull-right">
                        download delay: {delay}
                    </span>
                </caption>
                <tbody>
                {rows}
                </tbody>
            </Table>;
        };

        var tables = downloads.slots.map(s => getSlotTable(s));

        return <div>{tables}</div>;
    }
});


/*
export var ActiveTransfersWidget = React.createClass({
    render: function () {
        return false;
    }
});
*/
