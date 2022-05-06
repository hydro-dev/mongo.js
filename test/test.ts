import { expect } from 'chai';
import { Collection } from '../src';
import { applyFilter } from '../src/filter';

const date = new Date();
const data = [
    { a: 1, b: 2, c: 3, str: '123' },
    { a: 1, b: 2, c: date, str: 'abcccc' },
    { a: 1, b: '2', c: null, str: '123' },
    { a: 1, b: 2, c: 3 },
    { a: 1, b: 3, d: 3 },
];

describe('applyFilter', () => {
    it('basic', () => {
        expect(applyFilter(data, { a: 1 })).to.deep.eq(data);
        expect(applyFilter(data, { b: 2 })).to.deep.eq(data.filter(i => i.b === 2));
        expect(applyFilter(data, { a: 1, b: 2 })).to.deep.eq(data.filter(i => i.a === 1 && i.b === 2));
        expect(applyFilter(data, { c: date })).to.deep.eq(data.filter(i => i.c === date));
        expect(applyFilter(data, { a: { $eq: 1 } })).to.deep.eq(data);
        expect(applyFilter(data, { a: { $ne: 1 } })).to.deep.eq([]);
        expect(applyFilter(data, { b: { $in: [2, 3] } })).to.deep.eq(data.filter(i => [2, 3].includes(i.b as any)));
    });

    it('compare', () => {
        expect(applyFilter(data, { a: { $gte: 1 } })).to.deep.eq(data);
    });

    it('regex', () => {
        expect(applyFilter(data, { str: { $regex: /^[a-z]{3}$/ } })).to.deep.eq([]);
        expect(applyFilter(data, { str: /^\d{3}$/ })).to.deep.eq([data[0], data[2]]);
    });
});

describe('Collection', () => {
    const coll = new Collection<any>('test');

    it('insert', async () => {
        await coll.insertOne(data[0]);
        await expect(coll.find().toArray()).eventually.to.deep.eq([data[0]]);
        await coll.insertMany(data.slice(1));
        await expect(coll.find().toArray()).eventually.to.deep.eq(data);
    });

    it('find', async () => {
        await expect(coll.find({ a: 1 }).toArray()).eventually.to.deep.eq(data.filter(i => i.a === 1));
    });

    it('delete', async () => {
        expect(await coll.deleteOne({ b: '2' })).to.have.shape({ deletedCount: 1 });
        await expect(coll.find().toArray()).eventually.to.deep.eq(data.filter(i => i.b !== '2'));
    });
})