
const Email = require('./queries/Email');
const Pager = require('./queries/Pager');
const Mobile = require('./queries/Mobile');
const DefaultQuery = require('./queries/DefaultQuery');

let emailQuery = new Email();
emailQuery.setNextObj(new Pager()).setNextObj(new Mobile()).setNextObj(new DefaultQuery())
let queries = emailQuery.processMultiple(q);


