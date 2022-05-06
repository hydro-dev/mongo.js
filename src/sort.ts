import { Sort } from "mongodb";

export function sortData<T>(data: T[], sort: Sort): T[] {
    if (!sort) return data;
    const sortField = Object.keys(sort)[0];
    const sortOrder = sort[sortField];
    return data.sort((a, b) => {
        if (a[sortField] > b[sortField]) return sortOrder;
        if (a[sortField] < b[sortField]) return -sortOrder;
        return 0;
    });
}