'use strict';


class Store {

    constructor (options) {

        const opts = options || {};

        this.id = opts.id || 0;
        this.country = opts.country || null;
        this.city = opts.city || null;
        this.name = opts.name || "";
        this.channel = opts.channel || "RETAIL";
        this.size = opts.size || "SMALL";

    }

}


export default Store;
