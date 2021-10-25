const { validateEmail } = require("../helper");
const HandlerChain = require("./HandlerChain");
const elastic = require("../Elastic");


module.exports = class Email extends HandlerChain {
    processMultiple(q) {
        return validateEmail(q) ? [elastic.match("EmailAddress", q)] : super.next(q);
    }
}