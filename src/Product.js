'use strict';

class Product {

    constructor(options) {

        let opts = options || {};

        this.sku = opts.sku || "";
        this.name = opts.name || "";
        this.category = opts.category || "SKIN";
        this.cost_price = opts.cost_price || 0.00;
        this.wholesale_price = opts.wholesale_price || 0.00;
        this.retail_price = opts.retail_price || 0.00;

    }


}

export default Product;
