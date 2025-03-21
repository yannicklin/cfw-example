/**
 * Adds the url parameter brandCode=ctm to all urls ending *.jsp ie web-ctm urls
 * The health journey (in particular the payment gateway JSPs) are using this url parameter - to ensure
 * no degradation in this journey , this legacy CF worker has been absorbed into the CF worker router.
 * @param incoming The incoming request
 */
export async function AddBrandCode(incoming: Request): Promise< Request > {
    let url = new URL(incoming.url);
    const jspMatch = /.*\.jsp/g;

    if(jspMatch.test(url.pathname)) { // If .jsp - Append Custom Query String Parameter
        url.searchParams.set('brandCode', 'ctm');
        return new Request(url, incoming);
    }
    return incoming;
}