import { serialize, deserialize } from 'bson';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { BSONSerializeOptions, BulkWriteOptions, Callback, ChangeStream, ChangeStreamOptions, Collection as Coll, CollStats, CollStatsOptions, CommandOperationOptions, CountDocumentsOptions, Document, Filter, FindCursor, FindOptions, IndexInformationOptions, InsertManyResult, InsertOneOptions, InsertOneResult, Logger, ObjectId, OptionalUnlessRequiredId, OrderedBulkOperation, ReadConcern, ReadPreference, RenameOptions, ReplaceOptions, UnorderedBulkOperation, UpdateFilter, UpdateOptions, UpdateResult, WithId, WithoutId, WriteConcern } from 'mongodb';
import { join } from 'path';
import { applyFilter } from './filter';
import { Query } from './query';

function notImplemented(): any {
    throw new Error('Not implemented');
}
function deprecated(): any {
    throw new Error('Not implemented');
}
function noop(): any { }
const dataPath = join(process.cwd(), 'data.json');
let data = {};
if (existsSync(dataPath)) {
    data = deserialize(readFileSync(dataPath));
}
process.on('beforeExit', () => {
    writeFileSync(dataPath, serialize(data))
});

export class Collection<T> implements Coll<T> {
    constructor(public readonly name: string) {
        if (!data[name]) data[name] = [];
    }
    updateOne(filter: Filter<T>, update: Partial<T> | UpdateFilter<T>): Promise<UpdateResult>;
    updateOne(filter: Filter<T>, update: Partial<T> | UpdateFilter<T>, callback: Callback<UpdateResult>): void;
    updateOne(filter: Filter<T>, update: Partial<T> | UpdateFilter<T>, options: UpdateOptions): Promise<UpdateResult>;
    updateOne(filter: Filter<T>, update: Partial<T> | UpdateFilter<T>, options: UpdateOptions, callback: Callback<UpdateResult>): void;
    updateOne(filter: any, update: any, options?: any, callback?: any): void | Promise<import("mongodb").UpdateResult> {
        throw new Error('Method not implemented.');
    }
    updateMany(filter: Filter<T>, update: UpdateFilter<T>): Promise<Document | UpdateResult>;
    updateMany(filter: Filter<T>, update: UpdateFilter<T>, callback: Callback<Document | UpdateResult>): void;
    updateMany(filter: Filter<T>, update: UpdateFilter<T>, options: UpdateOptions): Promise<Document | UpdateResult>;
    updateMany(filter: Filter<T>, update: UpdateFilter<T>, options: UpdateOptions, callback: Callback<Document | UpdateResult>): void;
    updateMany(filter: any, update: any, options?: any, callback?: any): void | Promise<import("bson").Document | import("mongodb").UpdateResult> {
        throw new Error('Method not implemented.');
    }

    initializeUnorderedBulkOp(options?: BulkWriteOptions): UnorderedBulkOperation {
        throw new Error('Method not implemented.');
    }
    initializeOrderedBulkOp(options?: BulkWriteOptions): OrderedBulkOperation {
        throw new Error('Method not implemented.');
    }
    getLogger(): Logger {
        throw new Error('Method not implemented.');
    }
    get logger(): Logger {
        throw new Error('Method not implemented.');
    }

    public dbName = 'hydro';
    public get bsonOptions(): BSONSerializeOptions {
        return {
            ignoreUndefined: true,
            serializeFunctions: true,
        };
    }
    public collectionName: string;
    public readonly namespace: string;
    public readonly readConcern: ReadConcern;
    public readonly writeConcern: WriteConcern;
    public readonly readPreference: ReadPreference;
    public readonly hint: string;
    public readonly options: any;
    public readonly aggregate = notImplemented;
    public readonly bulkWrite = notImplemented;
    public count(filter?, cb?) {
        const l = (filter && typeof filter !== 'function') ? this.find(filter) : data[this.name];
        if (cb) return cb(null, l.length);
        if (typeof filter === 'function') return filter(null, l.length);
        return Promise.resolve(data[this.name].length);
    };
    public countDocuments(filter?: any, callback?: any): Promise<number> {
        return this.count(filter, callback);
    }
    public readonly createIndex = () => Promise.resolve('index');
    public readonly createIndexes = () => Promise.resolve(['index']);

    private _delete(filter, options, one) {
        const matched = applyFilter(data[this.name], filter);
        if (one && matched.length > 1) matched.length = 1;
        data[this.name] = data[this.name].filter(x => !matched.includes(x));
        return { deletedCount: matched.length, acknowledged: true, value: matched[0] as WithId<T>, ok: 1 as 1 };
    }
    public deleteMany(filter, options?, callback?) {
        if (typeof options === 'function') (callback = options), (options = {});
        const res = this._delete(filter, options, false);
        callback?.(null, res);
        return Promise.resolve(res);
    };
    public deleteOne(filter, options?, callback?) {
        if (typeof options === 'function') (callback = options), (options = {});
        const res = this._delete(filter, options, true);
        callback?.(null, res);
        return Promise.resolve(res);
    };
    public findOneAndDelete = this.deleteOne;

    public drop(options?: any, callback?: Callback<boolean>): Promise<boolean> {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        data[this.name] = [];
        callback?.(null, true);
        return Promise.resolve(true);
    }
    public get estimatedDocumentCount() { return notImplemented() };
    private _find(filter, options) {
        return applyFilter(data[this.name], filter);
    }
    public find(filter: Filter<T> = {}, options?, callback?) {
        if (typeof filter === 'function') {
            (callback = filter as Callback<number>), (filter = {}), (options = {});
        } else {
            if (typeof options === 'function') (callback = options), (options = {});
        }
        filter ??= {};
        const res = new Query<T>(data[this.name], filter) as FindCursor<WithId<T>>;
        callback?.(null, res);
        return res;
    };

    public findOne(filter?, options?, callback?): Promise<WithId<T>> {
        return this.find(filter, options, callback).toArray()[0];
    };
    public readonly findOneAndUpdate: any;
    public async insertMany(
        docs: OptionalUnlessRequiredId<T>[],
        options?: BulkWriteOptions | Callback<InsertManyResult<T>>,
        callback?: Callback<InsertManyResult<T>>
    ) {
        if (typeof options === 'function') (callback = options), (options = {});
        options = options ? Object.assign({}, options) : { ordered: true };
        const insertedIds = docs.map(doc => {
            if (!doc._id) doc._id = new ObjectId();
            data[this.name].push(doc);
            return doc._id;
        });
        const res = { insertedIds, insertedCount: insertedIds.length, acknowledged: true };
        callback?.(null, res);
        return res;
    };
    public async insertOne(
        doc: OptionalUnlessRequiredId<T>,
        options?: InsertOneOptions | Callback<InsertOneResult<T>>,
        callback?: Callback<InsertOneResult<T>>
    ) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        if (!doc._id) doc._id = new ObjectId();
        data[this.name].push(doc);
        const res = {
            insertedId: doc._id,
            acknowledged: true,
        }
        callback?.(null, res);
        return res;
    };
    public async isCapped() {
        return false;
    };

    public readonly indexExists = noop;
    public readonly indexInformation = noop;
    public readonly listIndexes = noop;
    public readonly dropIndex = noop;
    public readonly dropIndexes = noop;
    public readonly insert = deprecated;
    public readonly remove = deprecated;
    public readonly update = deprecated;
    public readonly findOneAndReplace = notImplemented;
    public readonly mapReduce = notImplemented;
    public readonly distinct = notImplemented;
    public readonly replaceOne = notImplemented;
    public readonly rename = notImplemented;
    public readonly indexes = notImplemented;
    public readonly stats = notImplemented;
    public readonly watch = notImplemented;
}
