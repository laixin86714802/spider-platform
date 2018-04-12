/* Main entry point */

var React = require("react");
var Router = require('react-router');
var { Route, RouteHandler, Link, DefaultRoute, NotFoundRoute } = Router;

var { IndexPage } = require("./pages/IndexPage.jsx");
var { JobPage } = require("./pages/JobPage.jsx");

var NotFound = React.createClass({
    render: function () {
        return (
            <div>
                <h2>404 找不到网页</h2>
                <p>您试图访问的页面不存在.</p>
            </div>
        );
    }
});


var App = React.createClass({
  render () {
      // TODO: move most stuff from base.html here
      return (
          <RouteHandler/>
      );
  }
});

var routes = (
    <Route path="/" handler={App}>
        <DefaultRoute handler={IndexPage} name="index" />
        <Route path="job/:id" handler={JobPage} name="job" />
        <NotFoundRoute handler={NotFound} />
    </Route>
);

Router.run(routes, Router.HashLocation, (Root) => {
    React.render(<Root/>, document.getElementById("root"));
});
