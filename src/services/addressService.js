import axios from 'axios';

// Philippine Standard Geographic Code (PSGC) API
// Docs: https://psgc.gitlab.io/api/
const psgcApi = axios.create({
    baseURL: 'https://psgc.gitlab.io/api',
    headers: { 'Accept': 'application/json' },
});

// Response interceptor to extract data only
psgcApi.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(error)
);

const cache = {};
const nameToCodeCache = {};
const resolvedLocationCache = {};

function isLikelyLocationCode(value) {
    return /^\d{9}$/.test(String(value || "").trim());
}

async function fetchWithCache(url) {
    if (cache[url]) return cache[url];
    try {
        const data = await psgcApi.get(url);
        cache[url] = data;
        return data;
    } catch (error) {
        console.error(`Failed to fetch ${url}:`, error);
        return null;
    }
}

function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
}

async function resolveRegionCode(regionValue) {
    if (!regionValue) return null;
    if (isLikelyLocationCode(regionValue)) return String(regionValue).trim();

    const regions = await fetchWithCache("/regions/");
    if (!Array.isArray(regions)) return null;

    const target = normalizeText(regionValue);
    const match = regions.find((region) => {
        return [
            region.code,
            region.name,
            region.regionName,
            region.psgc10DigitCode,
        ].some((candidate) => normalizeText(candidate) === target);
    });

    return match?.code || null;
}

/**
 * Searches for a location by name and returns its code
 * This helps when database stores location names instead of PSGC codes
 */
async function searchLocationByName(name, searchType) {
    const cacheKey = `${searchType}:${name}`;
    if (nameToCodeCache[cacheKey]) return nameToCodeCache[cacheKey];

    try {
        const searchUrl = `/${searchType}/?q=${encodeURIComponent(name)}`;
        const results = await fetchWithCache(searchUrl);
        if (results && results.length > 0) {
            const found = results[0];
            nameToCodeCache[cacheKey] = found;
            return found;
        }
    } catch (error) {
        console.error(`Failed to search for ${name}:`, error);
    }
    return null;
}

/**
 * Safely fetches location data, handling both codes and names
 */
async function safeGetLocation(code, endpoint) {
    if (!code) return null;

    // Try direct code first
    const result = await fetchWithCache(`/${endpoint}/${code}/`);
    if (result) return result;

    // If code fails, try searching by name
    const searchType = endpoint.replace('-', '');
    return searchLocationByName(code, searchType);
}

async function resolveLocationName(value, getter) {
    if (!value) return "";
    if (!isLikelyLocationCode(value)) return value;

    const result = await getter(value);
    return result?.name || value;
}

const addressService = {
    getRegions: () => fetchWithCache('/regions/'),
    getProvinces: async (regionCode) => {
        const resolvedCode = await resolveRegionCode(regionCode);
        if (!resolvedCode) return [];
        return (await fetchWithCache(`/regions/${resolvedCode}/provinces/`)) || [];
    },
    getCitiesByRegion: async (regionCode) => {
        const resolvedCode = await resolveRegionCode(regionCode);
        if (!resolvedCode) return [];
        return (await fetchWithCache(`/regions/${resolvedCode}/cities-municipalities/`)) || [];
    },
    getCities: (provinceCode) => fetchWithCache(`/provinces/${provinceCode}/cities-municipalities/`),
    getBarangays: (cityCode) => fetchWithCache(`/cities-municipalities/${cityCode}/barangays/`),
    getRegion: async (code) => {
        const result = await safeGetLocation(code, 'regions');
        return result || { name: code };
    },
    getProvince: async (code) => {
        const result = await safeGetLocation(code, 'provinces');
        return result || { name: code };
    },
    getCity: async (code) => {
        const result = await safeGetLocation(code, 'cities-municipalities');
        return result || { name: code };
    },
    getBarangay: async (code) => {
        const result = await safeGetLocation(code, 'barangays');
        return result || { name: code };
    },
    resolveLocationParts: async (location) => {
        if (!location) return null;

        const cacheKey = [
            location.barangay || "",
            location.city_municipality || "",
            location.province || "",
            location.region || "",
        ].join("|");

        if (resolvedLocationCache[cacheKey]) return resolvedLocationCache[cacheKey];

        const [barangay, city_municipality, province, region] = await Promise.all([
            resolveLocationName(location.barangay, addressService.getBarangay),
            resolveLocationName(location.city_municipality, addressService.getCity),
            resolveLocationName(location.province, addressService.getProvince),
            resolveLocationName(location.region, addressService.getRegion),
        ]);

        const resolved = {
            ...location,
            barangay,
            city_municipality,
            province,
            region,
        };

        resolvedLocationCache[cacheKey] = resolved;
        return resolved;
    },
    formatLocation: (location, options = {}) => {
        if (!location) return "";

        const { includeRegion = false } = options;
        const parts = [
            location.barangay,
            location.city_municipality,
            location.province,
            includeRegion ? location.region : null,
        ].filter(Boolean);

        return parts.join(", ");
    },
};

export default addressService;
