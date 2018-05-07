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
    SLOW: { p: 0.6, days: 360, range: [-60, 120] },
    MEDIUM: { p: 0.3, days: 180, range: [-15, 90]},
    FAST: { p: 0.1, days: 90, range: [-10, 30] },
};

const CAT_PREFS = {
    SKIN: { p: 0.6, },
    HAIR: { p: 0.4, },
    FRAGRANCE: { p: 0.1, },
    HOME: { p: 0.4, }
};

const CAT_LOADING = {
    HIGH: { p: 0.1, range: [2, 5], },
    MEDIUM: { p: 0.3, range: [1, 3], },
    LOW : { p: 0.6, range: [1, 2], }
};

const ENGAGEMENT = { HIGH: 90, MEDIUM: 70, LOW: 50, NONE: 30 };

const ENGAGEMENT_MODIFIER = {
    RETAIL: { LOW: -2, HIGH: 10, START: 5, },
    DEPT_STORE: { LOW: -5, HIGH: 5, START: 0, },
    ONLINE: { LOW: -10, HIGH: 5, START: -1, },
    WHOLESALE: { LOW: -5, HIGH: 2, START: -2, },
}

const PURCHASE_QTY = {
    RETAIL: {
        LOW: { p: 0.9, range: [1,1]},
        MEDIUM: {p: 0.09, range: [1,2]},
        HIGH: {p: 0.01, range: [2, 5]},
    },
    DEPT_STORE: {
        LOW: { p: 0.8, range: [1,1]},
        MEDIUM: {p: 0.19, range: [1,2]},
        HIGH: {p: 0.01, range: [2, 5]},
    },
    ONLINE: {
        LOW: { p: 0.8, range: [1,1]},
        MEDIUM: {p: 0.19, range: [2,3]},
        HIGH: {p: 0.01, range: [2, 5]},
    },
    WHOLESALE: {
        LOW: { p: 0.6, range: [5,10]},
        MEDIUM: {p: 0.3, range: [10,20]},
        HIGH: {p: 0.1, range: [20, 50]},
    }
}

const rand_range = (low, high) => {
    // takes the range value and returns from within iut.
    if (low === high ) return low;

    return (Math.floor(Math.random() * (high - low) + low));
}

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
        this.products = [];

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
        this.determine_engagement();

        // determine frequency of purchase
        // roll d100 and compare to frequency table
        const freq = Math.random();
        if (freq < FREQ.SLOW.p) {
            if (this.engagement > ENGAGEMENT.MEDIUM) {
                this.frequency = "MEDIUM";
            } else {
                this.frequency = "SLOW";
            }
        } else if (freq > 1 - FREQ.FAST.p) {
            if (this.engagement < ENGAGEMENT.MEDIUM) {
                this.frequency = "MEDIUM";
            } else {
                this.frequency = "FAST";
            }
        } else {
            if (this.engagement > ENGAGEMENT.MEDIUM) {
                this.frequency = "MEDIUM";
            } else {
                this.frequency = "SLOW";
            }
        }
    }

    create_transactions() {
        //creates a set of transactions for this customer

        const start_date = this.registered;

        // roll d100 and if lower than 80 then registered date is first
        // transaction date. If not then it's between 1 and 30d in the future.
        if (Math.random() > 0.8) {
            start_date.add(Math.floor(Math.random() * 30), 'days');
        }

        let tx_date = start_date;
        let transactions = [];

        // roll forward in time by an amount that is randomly derived from the
        // frequency period.
        // create a new transaction that is a set of items
        // items have: date, seq_no, sku, qty, line_total, store_id, customer_id

        while (tx_date.isBefore("2018-01-01") && this.engagement > ENGAGEMENT.NONE) {

            // create the transaction

            const store = _.filter(stores, {"store_id":_.sample(this.stores)})[0];
            // determine the number of products to buy.
            let no_prods = rand_range(1, this.products.length);
            let tx_prods = [];
            // for each product, determine the quantity.
            this.products.forEach((sku) => {
                // if random() < engagement then add it to the list
                if (Math.random() * 100 < this.engagement) {
                    if (tx_prods.length < no_prods) {
                        tx_prods.push({sku: sku});
                    }
                }
            });

            while (tx_prods.length < no_prods) {
                // need to add some random products
                tx_prods.push({sku: _.sample(products).sku});
                tx_prods = _.uniq(tx_prods);
            }

            // add the final parts and then push onto the transactions array
            tx_prods.forEach((item, i) => {

                item.date = tx_date.toISOString();
                item.store_id = store.store_id;
                item.seq_no = i + 1;

                // roll d100 on qty and then modify based on engagement
                const qty_rnd = Math.random();
                let qty_range = PURCHASE_QTY[store.channel].MEDIUM.range;
                if (qty_rnd < PURCHASE_QTY[store.channel].LOW.p) {
                    if (this.engagement > ENGAGEMENT.HIGH) {
                        qty_range = PURCHASE_QTY[store.channel].MEDIUM.range;
                    } else {
                        qty_range = PURCHASE_QTY[store.channel].LOW.range;
                    }
                } else if (qty_rnd > 1 - PURCHASE_QTY[store.channel].HIGH.p) {
                    if (this.engagement < ENGAGEMENT.LOW) {
                        qty_range = PURCHASE_QTY[store.channel].MEDIUM.range;
                    } else {
                        qty_range = PURCHASE_QTY[store.channel].LOW.range;
                    }
                }

                item.qty = _.random(qty_range[0], qty_range[1]);

                // now get the pricing.
                if (store.channel == "WHOLESALE") {
                    item.price = _.filter(products, {'sku': item.sku})[0].wholesale_price * 1.0;
                } else {
                    item.price = _.filter(products, {'sku': item.sku})[0].retail_price * 1.0;
                }

                item.line_total = item.price * item.qty;

                this.transactions.push(item);

            });

            // calculate the engagement update
            const e_mod = ENGAGEMENT_MODIFIER[store.channel];
            this.engagement += _.random(e_mod.LOW, e_mod.HIGH);

            if (this.engagement > 95) this.engagement = 95;
            if (this.engagement < 15) this.engagement = 15;

            if (this.frequency == "SLOW") {
                if (this.engagement > ENGAGEMENT.MEDIUM) {
                    this.frequency = "MEDIUM";
                }
            } else if (this.frequency == "FAST") {
                if (this.engagement < ENGAGEMENT.MEDIUM) {
                    this.frequency = "MEDIUM";
                }
            } else {
                if (this.engagement < ENGAGEMENT.MEDIUM) {
                    this.frequency = "SLOW";
                } else if (this.engagement >ENGAGEMENT.HIGH) {
                    this.frequency = "FAST";
                }
            }

            const freq = FREQ[this.frequency];
            const next_tx = freq.days + rand_range(freq.range[0], freq.range[1]);

            //console.log(store.store_id, store.channel, next_tx, tx_date);
            tx_date.add(next_tx, 'days');

        }

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
            //this.products[cat] = [];
            for (let i = 0; i < range_amt; i++) {
                const prod_index = Math.floor(Math.random() * available_products.length);
                this.products.push(available_products[prod_index].sku);
            }
            // deduplicate
            this.products = _.uniq(this.products);

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

    determine_engagement() {
        // determines the starting level of engagement for the customer

        // start with a baseline of 60 ± 10
        this.engagement = _.random(50, 70); //60 + Math.floor(Math.random() * 20 - 10);
        // for each store add the start point of ranges on engagement ased on type
        this.stores.forEach((store) => {
            // get the store details
            const s = _.filter(stores, {"store_id": store})[0];
            this.engagement += ENGAGEMENT_MODIFIER[s.channel].START;
        });
        // add +3 for each product the person has
        this.engagement += this.products.length * 3;
    }
}


export default Person;
