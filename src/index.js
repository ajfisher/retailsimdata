'use strict';


import Person from './Person.js';
import Product from './Product.js';
import Store from './Store.js';

Person.config({
    stores: [1, 2, 3,4],
    products: [1,2,3,4,5],
    categories: ["HAIR", "SKIN", "HOME", "FRAGRANCE"],
});


let p = new Person();

console.log(p);
