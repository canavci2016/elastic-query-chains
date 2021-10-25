const { englishKeywordReplacer } = require("../helper");
const HandlerChain = require("./HandlerChain");
const elastic = require("../Elastic");


module.exports = class DefaultQuery extends HandlerChain {
    processMultiple(q) {

        return [

            elastic.match("Name", q, { "operator": "and", "boost": 2 }),
            elastic.match("FullName", q, { "operator": "and", "boost": 2 }),
            elastic.match("FullNameForEnglishKeyword", englishKeywordReplacer(q), { "operator": "and", "boost": 2 }),
            elastic.match("FullNameCompanyTitle", q, { "operator": "and" }),
            elastic.match("FullNameCompanyTitleForEnglishKeyword", englishKeywordReplacer(q), { "operator": "and" }),
            { query_string: { default_field: "FullName", query: `${q}*` } },
            { query_string: { default_field: "FullNameForEnglishKeyword", query: `${englishKeywordReplacer(q)}*` } }

        ];
    }
}