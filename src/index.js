'use strict';

import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import parse from 'csv-parse/lib/sync';
import csvparse from 'csv-parse';


import Person from './Person.js';
import Product from './Product.js';
import Store from './Store.js';

const data_files = "data/src/";

let stores = [];
let products = [];
let categories = [];
let people = [];

// load up the products and then derive this into the categories as well
const product_file = fs.readFileSync(path.join(data_files, "products.csv"), 'UTF8');
products = parse(product_file, {columns: true});

const store_file = fs.readFileSync(path.join(data_files, "stores.csv"), 'UTF8');
stores = parse(store_file, {columns: true});

// refine down to the categories that are from the product list
_.map(products, (v) => categories.push(v.category));
categories = _.uniq(categories);

Person.config({
    stores: stores,
    products: products,
    categories: categories,
});


// load up people and then start processing each person to create values etc.
const people_file = fs.readFileSync(path.join(data_files, "customers.csv"), 'UTF8');
csvparse(people_file, {columns: true}, (err, raw_people) => {
    console.log("Got the person now");
    console.log(raw_people.length);

    raw_people.forEach((row, i) => {
        if (i < 10) {
            console.log(row);
            let p = new Person(row);
            p.derive();
        }
    })


});

