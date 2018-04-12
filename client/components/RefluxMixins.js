var React = require("react");
var Reflux = require("reflux");
var JobStore = require("../stores/JobStore");

export var JobsMixin = Reflux.connect(JobStore.store, "jobs");
