module.exports = class HandlerChain {

    constructor() {
        this.nextObjInChain = null;
    }

    setNextObj(nextObj) {
        this.nextObjInChain = nextObj;
        return this;
    }

    next(query) {
        return this.nextObjInChain ? this.nextObjInChain.processMultiple(query) : [];
    }
};