const express = require('express');
const app = express();
const config = require('./config');
const indexSettings = require('./index-settings');
const elastic = require("./Elastic");
const { stripPhoneChars, validateEmail, validateIsNumeric, englishKeywordReplacer, mapFields } = require('./helper');
const Email = require('./queries/Email');
const Pager = require('./queries/Pager');
const Mobile = require('./queries/Mobile');
const DefaultQuery = require('./queries/DefaultQuery');
app.use(express.json());

const match = elastic.match;
const term = elastic.term;


app.get('/demo', (req, res) => res.sendFile('demo.html', { root: __dirname }));

app.post('/search', async (req, res, next) => {

  let emailQuery = new Email();
  emailQuery.setNextObj(new Pager()).setNextObj(new Mobile()).setNextObj(new DefaultQuery())
  let queries = emailQuery.processMultiple(q);





  let queries = [];
  let { q, limit = 100, from = 0, company_id = 2, filter = {}, user_id = null } = req.body;
  q = q.trim();

  if (!q)
    next(new Error("q must be filled"));
  else if (validateEmail(q))
    queries.push(match("EmailAddress", q));
  else if (validateIsNumeric(stripPhoneChars(q)) && stripPhoneChars(q).length < 8)
    queries = [match("Phone.Pager", q)];
  else if (validateIsNumeric(stripPhoneChars(q))) {
    queries = [match("Phone.Mobile", q), match("Phone.Phone", q)];

    if (stripPhoneChars(q).length === 10 && stripPhoneChars(q)[0] !== '0')
      for (const c of [90, 0]) queries.push(match("Phone.Mobile", c + q), match("Phone.Phone", c + q));
    else if (stripPhoneChars(q).length === 11 && stripPhoneChars(q)[0] == 0)
      for (const c of [9]) queries.push(match("Phone.Mobile", c + q), match("Phone.Phone", c + q));

    console.log(queries);
  } else
    queries = [

      match("Name", q, { "operator": "and", "boost": 2 }),
      match("FullName", q, { "operator": "and", "boost": 2 }),
      match("FullNameForEnglishKeyword", englishKeywordReplacer(q), { "operator": "and", "boost": 2 }),
      match("FullNameCompanyTitle", q, { "operator": "and" }),
      match("FullNameCompanyTitleForEnglishKeyword", englishKeywordReplacer(q), { "operator": "and" }),
      { query_string: { default_field: "FullName", query: `${q}*` } },
      { query_string: { default_field: "FullNameForEnglishKeyword", query: `${englishKeywordReplacer(q)}*` } }

    ];

  let postFilters = [];

  if ((filter.companies && filter.companies.length > 0))
    filter.companies.forEach(c => postFilters.push(match("Company.Name.raw", c)));
  if ((filter.departments && filter.departments.length > 0))
    filter.departments.forEach(c => postFilters.push(match("Department.raw", c)));


  let functions = [{ filter: term("Company.Id", company_id), weight: 20 }];
  /*  if (user_id)
      functions.push({
        filter: {nested: {path: "Friends", query: {bool: {filter: term("Friends.Id", user_id)}}}},
        weight: 22
      });
    */


  const body = {
    query: {
      function_score: {
        query: { dis_max: { queries } },
        functions: functions,
        boost: 5,
        boost_mode: "sum"
      }
    }, sort: [
      "_score",
      { "LastName": { "order": "asc" } },
    ],
    aggs: {
      departments: { terms: { field: "Department.raw" } },
      companies: { terms: { field: "Company.Name.raw" } }
    },
    post_filter: {
      bool: {
        should: postFilters
      }
    },
    from,
    size: limit
  };


  elastic.search(body).then(a => res.json({
    hits: a.hits,
    aggregations: a.aggregations,
  })).catch(next);

});

app.post('/import', (req, res, next) => {
  const formattedData = mapFields(req.body);
  elastic.bulkCreateRequest(formattedData).then(result => res.json(result)).catch(next);
});

app.get('/index/create', (req, res, next) => elastic.indexCreate(indexSettings).then(result => res.json(result)).catch(next));

app.use((req, res, next) => res.status(404).json({ message: "page wasnt found" }));

app.use((err, req, res, next) => {
  const { message = null, name = null, trace = null, response: { data } = { data: null } } = err;
  return res.status(500).json({ message, name, trace, data });
});


app.listen(config.port, console.log(`listenin port is ${config.port}`));
