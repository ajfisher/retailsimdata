'use strict';
// Creates a person object which can be used to ensure there's
// appropriate information on it.
import _ from 'lodash';
import moment from 'moment';

let products = [];
let stores = [];
let categories = [];
let store_allocation_table = [];

const STORE_ALLOCATION = ["ONLINE", "ONLINE_SINGLE", "ONLINE_MULTI", "SINGLE", "MULTI"];
const ALLOC_RATIOS = [ 10, 20, 5, 45, 20 ];
const FREQ = {
    SLOW: {
        p: 0.6,
        days: 360,
    },
    MEDIUM: {
        p: 0.3,
        days: 180,
    },
    FAST: {
        p: 0.1,
        days: 90,
    },
};

const CAT_PREFS = {
    SKIN: {
        p: 0.6,
    },
    HAIR: {
        p: 0.4,
    },
    FRAGRANCE: {
        p: 0.1,
    },
    HOME: {
        p: 0.4,
    }
};

const CAT_LOADING = {
    HIGH: {
        p: 0.1,
        range: [2, 5],
    },
    MEDIUM: {
        p: 0.3,
        range: [1, 3],
    },
    LOW : {
        p: 0.6,
        range: [1, 2],
    }
};

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
        this.dob = moment(opts.dob) || null;
        this.registered = moment(opts.registered) || null;
        this.phone = opts.phone || null;

        this.categories = [];
        this.category_weighting = opts.weighting || {};
        this.frequency = opts.frequency || {};
        this.store_country = opts.store_country || "AU";
        this.stores = opts.stores || [];
        this.products = {};

        this.transactions = [];
    }

    static config (options) {

        const opts = options || {};

        products = opts.products || [];
        stores = opts.stores || [];
        categories = opts.categories || [];

        // set up the store allocation table;
        ALLOC_RATIOS.forEach((val, index) => {
            for (let i = 0; i < val; i++ ) {
                store_allocation_table.push(index);
            }
        });

    }

    derive () {
        // derives the extended fields based on the other data
        this.allocate_store_country();
        this.allocate_stores();
        this.category_weights();
        if (this.categories.length == 0) {
            // run this a second time just so we only have a small number
            // of people with zero categories.
            this.category_weights();
        }
        this.allocate_products();

        // determine frequency of purchase
        // roll d100 and compare to frequency table
        const freq = Math.random();
        if (freq < FREQ.SLOW.p) {
            this.frequency = "SLOW";
        } else if (freq > 1 - FREQ.FAST.p) {
            this.frequency = "FAST";
        } else {
            this.frequency = "MEDIUM";
        }

        console.log(this);

    }

    create_transactions() {


    }

    category_weights () {
        // determine the category weighting for a customer

        _.map(CAT_PREFS, (pref, key) => {
            if (Math.random() < pref.p) {
                this.categories.push(key);

                // roll d100 and look up on weight key for cat range ownership
                const cat_rnd = Math.random();
                if (cat_rnd < CAT_LOADING.LOW.p) {
                    this.category_weighting[key] = "LOW";
                } else if (cat_rnd > 1 -CAT_LOADING.HIGH.p) {
                    this.category_weighting[key] = "HIGH";
                } else {
                    this.category_weighting[key] = "MEDIUM";
                }
            }
        });
    }

    allocate_products() {
        // take the preferences and then allocate a set of products to it.

        _.map(this.category_weighting, (weight, cat) => {
            let available_products = _.filter(products, {'category': cat});
            // choose random value from the pref range.
            const min = CAT_LOADING[weight].range[0];
            const max = CAT_LOADING[weight].range[1];
            const range_amt = Math.floor(Math.random() * (max - min) + min);

            // push the products into the list:
            this.products[cat] = [];
            for (let i = 0; i < range_amt; i++) {
                const prod_index = Math.floor(Math.random() * available_products.length);
                this.products[cat].push(available_products[prod_index].sku);
            }
            // deduplicate
            this.products[cat] = _.uniq(this.products[cat]);

        });
    }

    allocate_store_country() {
        // take the person's country and then allocate them to one of the
        // official countries

        if (['GB', 'IE', 'FR', 'DE'].includes(this.country)) {
            this.store_country = 'UK';
        } else if (['NZ', 'AU'].includes(this.country)) {
            this.store_country = 'AU';
        } else {
            this.store_country = 'US';
        }
    }

    allocate_stores() {
        // take the person's country and then allocate them to a store or
        // multiple stores as needed.

        // allocate the online customers first
        if (this.country == 'NZ') {
            this.stores.push('au_07');
            return;
        } else if (['IE', 'FR', 'DE'].includes(this.country)) {
            this.stores.push('uk_07');
            return;
        }

        // for anyone left then we need to do some other store allocations.
        const country_stores = _.filter(stores, {'country_code': this.store_country});

        // roll d100 and see what store allocation we land on.
        const alloc = store_allocation_table[Math.floor(Math.random() * store_allocation_table.length)];

        // work out some store ids for the person.
        const online_id = _.filter(country_stores, {'channel': 'ONLINE'})[0].store_id;

        let store_1 = country_stores[Math.floor(Math.random() * country_stores.length)].store_id;
        while (store_1 == online_id) {
            store_1 = country_stores[Math.floor(Math.random() * country_stores.length)].store_id;
        }

        let store_2 = country_stores[Math.floor(Math.random() * country_stores.length)].store_id;
        while (store_2 == online_id) {
            store_2 = country_stores[Math.floor(Math.random() * country_stores.length)].store_id;
        }

        // assign the store(s) to the person now
        switch (STORE_ALLOCATION[alloc]) {
            case "ONLINE":
                this.stores.push(online_id);
                break;
            case "ONLINE_SINGLE":
                this.stores.push(online_id);
                this.stores.push(store_1)
                break;
            case "ONLINE_MULTI":
                this.stores.push(online_id);
                this.stores.push(store_1);
                this.stores.push(store_2);
                break;
            case "SINGLE":
                this.stores.push(store_1);
                break;
            case "MULTI":
                this.stores.push(store_1);
                this.stores.push(store_2);
                break;
            default:
                this.stores.push(store_1);
                break;
        }
    }
}


export default Person;
