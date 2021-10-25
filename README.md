# usage
  let emailQuery = new Email();
  
  emailQuery.setNextObj(new Pager()).setNextObj(new Mobile()).setNextObj(new DefaultQuery())
 
 let queries = emailQuery.processMultiple(q);

