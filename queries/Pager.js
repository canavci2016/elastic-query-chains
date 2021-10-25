const { validateIsNumeric, stripPhoneChars } = require("../helper");
const HandlerChain = require("./HandlerChain");
const elastic = require("../Elastic");


module.exports = class Pager extends HandlerChain {
    processMultiple(q) {
        return (validateIsNumeric(stripPhoneChars(q)) && stripPhoneChars(q).length < 8) ? [elastic.match("Phone.Pager", q)] : super.next(q);
    }
}