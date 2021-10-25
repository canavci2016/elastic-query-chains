const { validateIsNumeric, stripPhoneChars } = require("../helper");
const HandlerChain = require("./HandlerChain");
const elastic = require("../Elastic");


module.exports = class Mobile extends HandlerChain {
    processMultiple(q) {

        if (validateIsNumeric(stripPhoneChars(q))) {
            queries = [elastic.match("Phone.Mobile", q), elastic.match("Phone.Phone", q)];

            if (stripPhoneChars(q).length === 10 && stripPhoneChars(q)[0] !== '0')
                for (const c of [90, 0]) queries.push(elastic.match("Phone.Mobile", c + q), elastic.match("Phone.Phone", c + q));
            else if (stripPhoneChars(q).length === 11 && stripPhoneChars(q)[0] == 0)
                for (const c of [9]) queries.push(elastic.match("Phone.Mobile", c + q), elastic.match("Phone.Phone", c + q));

            console.log(queries);

            return queries;
        }

        return super.next(q);
    }
}