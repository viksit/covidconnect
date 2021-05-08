import citiesRaw from '../cities.json'

const resourceTypes = {
    "ICU"                 : ["icu"],
    "Ventilator"          : ["ventilator"],
    "Oxygen Bed"          : ["oxygenbed"],
    "Bed"                 : ["bed"],
    "Remdesivir"          : ["remdesivir", "remdes", "remdesvir"],
    "Favipiravir"         : ["favipiravir", "cipvir", "favipill", "favilow", "avigan", "araflu", "fevindo", "fluguard", "faviblu", "fapvir", "fabiflu", "faviflu"],
    "Tocilizumab"         : ["tocilizumab", "tocilizuman", "itolizumab", "tocili", "toclizumab"],
    "Plasma"              : ["plasma", "plasm"],
    "Food"                : ["food", "meal", "meals", "tiffin"],
    "Ambulance"           : ["ambulance", "ambulances"],
    "Oxygen Concentrator" : ["concentrator", "concentrators", "bipap"],
    "Oxygen Cylinder"     : ["cylinder", "oxygen"],
    "Covid Test"          : ["rtpcr", "rt-pcr", "test"],
    "Helpline"            : ["helpline", "war room", "war-room", "warroom"]
};

const categories = {
    "Bed"                 : ["hospital"],
    "ICU"                 : ["hospital"],
    "Ventilator"          : ["hospital"],
    "Oxygen Bed"          : ["hospital"],
    "Remdesivir"          : ["medicine"],
    "Favipiravir"         : ["medicine"],
    "Tocilizumab"         : ["medicine"],
    "Plasma"              : [],
    "Food"                : [],
    "Ambulance"           : ["ambulance"],
    "Oxygen Cylinder"     : ["oxygen", "medical device"],
    "Oxygen Concentrator" : ["oxygen", "medical device"],
    "Covid Test"          : ["test"],
    "Helpline"            : ["helpline"]
};

// Parse raw data of cities into a structure more useful for searching
const cities = {};

for(let state in citiesRaw){
    cities[state] = citiesRaw[state].map(city => ({ [city]: [city.toLowerCase().replace(/\*| /g, "")] }) ).reduce((obj, val) => ({ ...obj, ...val }), {});
}

/**
 * Normalizes given tweet for easier parsing
 *
 * @param {string} text
 * @returns {string}
 */
const normalize = text => {
    // To make parsing easier, we do a few transformations:
    // 1. Convert everything to lower case
    // 2. Remove spaces, newlines, tabs, . and commas
    return text.toLowerCase().split(/ |\n|\t|\.|,/g).filter(i => i).join("");
};

/**
 * Find values corresponds to given text
 *
 * Expects values to be an object of the form:
 *
 * {
 *  key1: ['A A', 'B B'],
 *  key2: ['A B', 'B C']
 * }
 *
 * Returns array of *keys* where *text* is present in the values
 * of any such key.
 *
 * For example if text is 'A A', the function will return `['key1']`.
 * If text is `B`, the function will return `[key1, key2]`, since
 * the string `B` is present in the values of both keys.
 *
 * @param {string} text String to search
 * @param {object} values
 * @returns {Array}
 */
const find = (text, values) => {
    const set = new Set;

    for(let key in values){
        for(let word of values[key]){
            if(text.search(word) != -1){
                set.add(key);
            }
        }
    }
    return Array.from(set) || [];
};

/**
 * Find resource types mentioned in the tweet
 *
 * @param {string} text Normalized text of tweet
 * @returns {Array}
 */
const findResourceType = (text) => {
    return find(text, resourceTypes);
};

/**
 * Find list of locations mentioned in the tweet
 *
 * Currently, looks for presence of names of major cities in
 * the tweet.
 *
 * @param {string} text Normalized text of tweet
 * @returns {Array}
 */
const findLocation = (text) => {
    const location = new Set;

    for(let state in cities){
        const _cities = find(text, cities[state]);

        if(_cities.length > 0){
            _cities.forEach(city => {
                location.add({ state, city });
            });
        }
    }
    return Array.from(location) || [];
};

/**
 * Determine verification status of tweet
 *
 * @param {string} text Normalized text of the tweet
 * @returns {string}
 */
const findVerificationStatus = text => {
    // needs work
    if(text.search("notverified") !== -1){
        return "Not Verified";
    }
    if(text.search("unverified") !== -1){
        return "Not Verified";
    }
    if(text.search("verified") !== -1){
        return "Verified";
    }
    return "Unknown";
};

/**
 * Determine when the resources in the tweet were last verified
 *
 * @param {string} text Normalized text of tweet
 * @returns {string}
 */
const findVerificationTime = (text) => {
    // FIXME: needs work
    const index = text.search(/verifiedat|verifiedon/);

    if(index !== -1){
        // Look for text that looks like a time written after words 'verifiedat'
        const newText = text.substring(index+"verifiedat".length);

        const time = newText.match(/([0-9]{1,2}:[0-9]{2}(am|pm))/) || [];
        return time[0];
    }
};

/**
 * Parse tweet into useful structure.
 *
 * Returns object with following fields:
 *
 * 1. categories:
 *      General category of resources mentioned in the tweet.
 *      Examples: 'hospital', 'ambulance', etc
 *
 * 2. resource_types
 *      Specific types of resources mentioned in the tweet.
 *      Examples: ICU, ventilator, food, helpline, etc
 *
 * 3. verification_status
 *      String indicating current verification status of this tweet.
 *      Returns 'Verified', 'Not Verified' or 'Unknown'
 *
 * 4. verified_at
 *      String representing time when this information was last verified.
 *
 * 5. phone_numbers
 *      Array of phone numbers listed in the tweet
 *
 * 6. emails
 *      Array of emaila ddresses listed in the tweet
 *
 * 7. locations
 *      Array of locations mentioned in the tweet.
 *      Picks from major cities in all the states
 *
 * @param {string} raw_text Raw text of the tweet to parse
 * @returns {object}
 */
const parse = raw_text => {
    const text = normalize(raw_text);
    const resourceTypes = findResourceType(text);

    return {
        categories             : resourceTypes.map(r => categories[r]).flat() || [],
        resource_types         : resourceTypes || [],
        verification_status    : findVerificationStatus(text) || null,
        phone_numbers          : raw_text.match(/(?!([0]?[1-9]|[1|2][0-9]|[3][0|1])[./-]([0]?[1-9]|[1][0-2])[./-]([0-9]{4}|[0-9]{2}))(\+?\d[\d -]{8,12}\d)/g) || [],
        emails                 : raw_text.match(/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/g) || [],
        verified_at            : findVerificationTime(text) || null,
        locations              : findLocation(text) || null
    }
};

export default parse;
