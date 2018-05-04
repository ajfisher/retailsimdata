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

        this.category_weighting = opts.weighting || {};
        this.frequency = opts.frequency || {};
        this.store_country = opts.store_country || "AU";
        this.stores = opts.stores || [];

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

        console.log(store_allocation_table);
    }

    derive () {
        // derives the extended fields based on the other data
        this.allocate_store_country();
        this.allocate_stores();
        console.log(this);

    }

    create_transactions() {

    }

    category_weights () {
        // determine the category weighting if blank

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
