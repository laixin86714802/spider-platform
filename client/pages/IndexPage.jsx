/* Main (index) page */

var React = require("react");
var { Panel } = require("react-bootstrap");

var { JobList } = require("../components/JobList");
var { AggregateJobStats } = require("../components/JobStats");
var { ProcessStatsTable } = require("../components/ProcessStats");


export var IndexPage = React.createClass({
    render: function () {
        return (
            <div className="row">
                <div className="col-lg-7 col-md-7">
                    <Panel collapsible defaultExpanded header="任务" bsStyle="primary">
                        <JobList/>
                    </Panel>
                    <Panel collapsible defaultExpanded header="系统状态" className="hidden-lg">
                        <ProcessStatsTable />
                    </Panel>
                </div>
                <div className="col-lg-5 col-md-5">
                    <Panel collapsible defaultExpanded header="系统状态" className="visible-lg-block">
                        <ProcessStatsTable />
                    </Panel>
                    <Panel collapsible defaultExpanded header="爬虫状态">
                        <AggregateJobStats/>
                    </Panel>
                </div>
            </div>
        );
    }
});
