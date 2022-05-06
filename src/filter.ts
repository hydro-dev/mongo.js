import { Filter, ObjectId } from "mongodb";

function getPath(node, path = []) {
    let t = node;
    for (const p of path) {
        t = t?.[p];
    }
    return t;
}

type basicFilter = Date | ObjectId | RegExp | boolean | string | number;

function isBasicFilter(filter: any): filter is basicFilter {
    return ["boolean", 'string', 'number'].includes(typeof filter)
        || filter instanceof Date
        || filter instanceof ObjectId
        || filter instanceof RegExp;
}

const Matchers = {
    $eq(data: any, filter: any) {
        const x = data instanceof Array ? data : [data];
        if (['string', 'number', 'boolean'].includes(typeof filter)) return x.includes(filter);
        if (filter instanceof ObjectId) return x.some(x => x instanceof ObjectId && filter.equals(x));
        if (filter instanceof RegExp) return x.some(x => (x instanceof RegExp && filter == x) || (typeof x === 'string' && filter.test(x)));
        if (filter instanceof Date) return x.some(x => x instanceof Date && filter.getTime() === x.getTime());
        return false;
    },
    $ne(data: any, filter: any) {
        return !Matchers.$eq(data, filter);
    },
    $in(data: any, filter: any[]) {
        return filter.some(f => Matchers.$eq(data, f));
    },
    $nin(data: any, filter: any[]) {
        return !Matchers.$in(data, filter);
    },
    $gte(data: any, filter: number) {
        return data >= filter;
    },
    $gt(data: any, filter: number) {
        return data > filter;
    },
    $lte(data: any, filter: number) {
        return data <= filter;
    },
    $lt(data: any, filter: number) {
        return data < filter;
    },
    $regex(data: any, filter: RegExp) {
        return Matchers.$eq(data, new RegExp(filter));
    }
}

export function fieldMatch<T>(data: T, filter: Filter<T>, path = []): boolean {
    if (isBasicFilter(filter)) return Matchers.$eq(getPath(data, path), filter);
    let match = true;
    for (const key in filter) {
        if (!key.startsWith('$')) {
            match &&= fieldMatch(data, filter[key], path.concat(key));
        } else {
            const query = filter[key];
            switch (key) {
                case '$eq': case '$ne': case '$in': case '$nin':
                case '$gt': case '$gte': case '$lt': case '$lte':
                case '$regex':
                    match &&= Matchers[key](getPath(data, path), query);
                    break;
                case '$not':
                    match &&= !fieldMatch(data, query, path);
                    break;
                case '$exists':
                    match &&= query === (getPath(data, path) !== undefined);
                    break;
                default:
                    throw new Error(`Unsupported filter ${key} on path ${path.join('->')}`);
            }
        }
        if (!match) return false;
    }
    return true;
}

export function applyFilter<T>(data: T[], args: Filter<T>): T[] {
    let res = [...data];
    for (const key in args) {
        if (!key.toString().startsWith('$')) {
            res = res.filter(l => fieldMatch(l, args[key], [key]));
        } else {
            switch (key) {
                case '$not':
                    const matched = applyFilter(data, args[key]);
                    res = res.filter(l => !matched.includes(l));
                    break;
                case '$or': case '$and':
                    if (!(args[key] instanceof Array)) throw new Error(`${key} must be an array`);
                    const tests = args[key].map(i => applyFilter(data, i));
                    res = res.filter(l => tests[key === '$or' ? 'some' : 'every'](f => f.includes(l)));
                    break;
                default:
                    throw new Error(`Unsupported filter ${key} on root`);
            }
        }
    }
    return res;
}