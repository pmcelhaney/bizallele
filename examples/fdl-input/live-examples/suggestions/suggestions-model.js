import { string, Record } from 'bizallele';

const cities = ['Amsterdam', 'Athens', 'Berlin', 'Boston', 'Lisbon', 'London'];

// A local, asynchronous stand-in for a remote directory. Results are partial.
export async function findCities(query, record, signal) {
    await new Promise(resolve => setTimeout(resolve, 250));
    if (signal?.aborted) return [];
    return cities
        .filter(city => city.toLowerCase().includes(query.trim().toLowerCase()))
        .slice(0, 3);
}

export const record = new Record(
    {
        city: string.label('Destination').suggestions({
            fetch: findCities,
            text: city => city,
            value: city => city,
        }),
    },
    { city: 'Paris' }
);
