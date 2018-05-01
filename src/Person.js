'use strict';
// Creates a person object which can be used to ensure there's
// appropriate information on it.

let products = [];
let stores = [];
let categories = [];

class Person {

    constructor (options) {

        let opts = options || {};


        this.fname = opts.fname || "";
        this.sname = opts.sname || "";
        this.title = opts.title || "";
        this.gender = opts.gender || "";
        this.email = opts.email || "";
        this.id = opts.id || "";
        this.country = opts.country || "AU";
        this.dob = opts.dob || null;
        this.registered = opts.registered || null;
        this.phone = opts.phone || null;

        this.category_weighting = opts.weighting || {};
        this.frequency = opts.frequency || {};
        this.store_country = opts.store_country || "AU";
        this.stores = opts.stores || {};

        console.log(categories, products, stores);
    }

    static config (options) {

        const opts = options || {};

        products = opts.products || [];
        stores = opts.stores || [];
        categories = opts.categories || [];
    }

    category_weights () {
        // determine the category weighting if blank

    }

}


export default Person;
