/* A form for starting the crawl */

var React = require("react");
var { Panel } = require("react-bootstrap");

var JobStore = require("../stores/JobStore");


export var CrawlForm = React.createClass({
    getInitialState: function () {
        return {value: ""};
    },

    render: function () {
        // it must be rendered inside a small bootstrap Panel
        var noPadding = {
            paddingLeft: 0, paddingRight: 0, marginLeft: 0, marginRight: 0
        };
        return (
            <form method="post" className="container-fluid" style={noPadding}
                  action={this.props.action} onSubmit={this.onSubmit}>
                <div className="form-group row" style={noPadding}>
                    <div className="col-xs-2"  style={noPadding}>
                        <button type="submit" className="btn btn-success" style={{width:"100%"}}>Crawl</button>
                    </div>
                    <div className="col-xs-10"  style={noPadding}>
                        <input type="text" className="form-control" name="domain"
                               ref="domainInput" value={this.state.value}
                               onChange={this.onChange}
                               placeholder="website URL, e.g. scrapy.org"/>
                    </div>
                </div>
            </form>

        );
    },

    onChange: function (ev) {
        this.setState({value: this.refs.domainInput.getDOMNode().value});
    },

    onSubmit: function (ev) {
        ev.preventDefault();
        if (this.state.value != "") {
            JobStore.Actions.startCrawl(this.state.value);
            this.setState({value: ""});
        }
    }
});

