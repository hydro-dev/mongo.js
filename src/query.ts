import Emitter from 'events';
import { AbstractCursorEvents, Callback, CollationOptions, CommonEvents, CountOptions, CursorCloseOptions, CursorStreamOptions, Document, ExplainVerbosityLike, Filter, FindCursor, GenericListener, Hint, Long, MongoDBNamespace, ReadConcern, ReadConcernLike, ReadPreference, ReadPreferenceLike, Sort, SortDirection } from 'mongodb';
import { Readable } from 'stream';
import { applyFilter } from './filter';
import { sortData } from './sort';

type Type = new () => (Omit<Emitter, 'listeners' | 'addListener'> & {
    listeners: () => any[];
    addListener: (this: Query, event: CommonEvents, listener: GenericListener) => void;
});
const EventEmitter: Type = Emitter as any;

export class Query<T = any> extends EventEmitter implements FindCursor<T>  {
    data: T[];
    private _limit: number;
    private _skip: any;
    private _readCursor = 0;

    constructor(data: T[], args: Filter<T>) {
        super();
        this.data = applyFilter(data, args);
    }

    clone(): FindCursor<any> {
        throw new Error('Method not implemented.');
    }
    map<T>(transform: (doc: any) => T): FindCursor<T> {
        throw new Error('Method not implemented.');
    }
    count(): Promise<number>;
    count(callback: Callback<number>): void;
    count(options: CountOptions): Promise<number>;
    count(options: CountOptions, callback: Callback<number>): void;
    count(options?: any, callback?: any): void | Promise<number> {
        return Promise.resolve(this.data.length);
    }
    explain(): Promise<Document>;
    explain(callback: Callback<any>): void;
    explain(verbosity?: ExplainVerbosityLike): Promise<Document>;
    explain(verbosity?: any): void | Promise<import("bson").Document> {
        throw new Error('Method not implemented.');
    }
    filter(filter: Filter<T>): this {
        this.data = applyFilter(this.data, filter);
        return this;
    }
    hint(hint: Hint): this {
        // We dont use index so hint is useless
        return this;
    }
    min(min: Document): this {
        throw new Error('Method not implemented.');
    }
    max(max: Document): this {
        throw new Error('Method not implemented.');
    }
    returnKey(value: boolean): this {
        throw new Error('Method not implemented.');
    }
    showRecordId(value: boolean): this {
        throw new Error('Method not implemented.');
    }
    addQueryModifier(name: string, value: string | number | boolean | Document): this {
        throw new Error('Method not implemented.');
    }
    comment(value: string): this {
        throw new Error('Method not implemented.');
    }
    maxAwaitTimeMS(value: number): this {
        return this;
    }
    maxTimeMS(value: number): this {
        return this;
    }
    project<T extends Document = Document>(value: Document): FindCursor<T> {
        throw new Error('Method not implemented.');
    }
    sort(sort: Sort, direction?: SortDirection): this {
        if (typeof sort === 'string') this.data = sortData(this.data, { [sort]: direction });
        else this.data = sortData(this.data, sort);
        return this;
    }
    allowDiskUse(): this {
        return this;
    }
    collation(value: CollationOptions): this {
        throw new Error('Method not implemented.');
    }
    limit(value: number): this {
        this._limit = value;
        return this;
    }
    skip(value: number): this {
        this._skip = value;
        return this;
    }
    get id(): Long {
        throw new Error('Method not implemented.');
    }
    get namespace(): MongoDBNamespace {
        throw new Error('Method not implemented.');
    }
    get readPreference(): ReadPreference {
        throw new Error('Method not implemented.');
    }
    get readConcern(): ReadConcern {
        throw new Error('Method not implemented.');
    }
    get closed(): boolean {
        throw new Error('Method not implemented.');
    }
    get killed(): boolean {
        throw new Error('Method not implemented.');
    }
    get loadBalanced(): boolean {
        throw new Error('Method not implemented.');
    }
    bufferedCount(): number {
        throw new Error('Method not implemented.');
    }
    readBufferedDocuments(number?: number): any[] {
        throw new Error('Method not implemented.');
    }
    stream(options?: CursorStreamOptions): Readable {
        throw new Error('Method not implemented.');
    }
    hasNext(): Promise<boolean>;
    hasNext(callback: Callback<boolean>): void;
    hasNext(callback?: any): void | Promise<boolean> {
        return Promise.resolve(!!this.data[this._readCursor]);
    }
    next(): Promise<any>;
    next(callback: Callback<any>): void;
    next(callback?: Callback<any>): void | Promise<any>;
    next(callback?: any): void | Promise<any> {
        const data = this.data[this._readCursor];
        this._readCursor++;
        return Promise.resolve(data);
    }
    tryNext(): Promise<any>;
    tryNext(callback: Callback<any>): void;
    tryNext(callback?: any): void | Promise<any> {
        return this.next();
    }
    async forEach(iterator: any, callback?: any): Promise<void> {
        this.data.forEach(iterator);
    }
    close(options?: any, callback?: any): Promise<void> {
        return;
    }
    toArray(callback?: Callback<any[]>): Promise<any[]> {
        const res = this.data.slice(this._skip, (this._skip + this._limit) || this.data.length);
        callback?.(null, res);
        return Promise.resolve(res);
    }
    addCursorFlag(flag: 'tailable' | 'oplogReplay' | 'noCursorTimeout' | 'awaitData' | 'exhaust' | 'partial', value: boolean): this {
        throw new Error('Method not implemented.');
    }
    withReadPreference(readPreference: ReadPreferenceLike): this {
        return this;
    }
    withReadConcern(readConcern: ReadConcernLike): this {
        return this;
    }
    batchSize(value: number): this {
        throw new Error('Method not implemented.');
    }
    rewind(): void {
        throw new Error('Method not implemented.');
    }
    [Symbol.asyncIterator](): AsyncIterator<any, void, undefined> {
        throw new Error('Method not implemented.');
    }
}