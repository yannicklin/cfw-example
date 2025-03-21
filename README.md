# A collection of things that relate to cloudflare workers.

## dev:

This project requires >= node <strong>22</strong>.
In ADO, the project is built with this version of node, so should be the preferred version for local development.

```bash
pnpm install
pnpm run start
```

That will run all the required workers at once and interleave their output.
If you want to run the workers seperately:

```bash
cd ctm-cf-worker-router
pnpm run start
```

```bash
cd ctm-cf-worker-mw-svc-example
pnpm run start
```

## Notes:

Because code injected into script blocks is minified there can be name collisions for variables.
For this reason i recommend wrapping all the injected code in a function and then calling it.
This way the variables are not in the global scope
eg:

```js
function exec {
  //My injected code
}

exec();
```

## worker-router

The main entrypoint for everything in this repo.
This is where we setup routes and the middleware that should run on them.
Also contains few simple single file middleware

### Middleware

#### arkoseInjector

Injects arkose script onto a page

#### cookieJar

Uses the set-cookie header to make the client store a backup of any cookie, restoring it if the original is missing

#### cf-page-router

Request and response middleware for use in the

## worker-router-core

The shared code that is needed by the router and any worker that wishes to be a piece of middleware.

## CI/CD

This worker is built and deployed with Devops Pipelines:

* build - https://dev.azure.com/ctmaus/CTM/_build?definitionId=179
* release - https://dev.azure.com/ctmaus/CTM/_build?definitionId=173

The release pipeline uses the wrangler [cli](https://developers.cloudflare.com/workers/wrangler/), to deploy the worker
to Cloudflare.
Three separate deploys occur with each release deployment:

1. Worker and *.dev.comparethemarket.com.au routes deploy
2. Worker and *.secure.comparethemarket.com.au routes deploy
3. Worker secrets deploy

This worker is designed to listen on various routes in different cloudflare zones eg:

* dev.comparethemarket.com.au/* - DEV zone
* nxi.secure.comparethemarket.com.au/* - PROD zone
* nxs.secure.comparethemarket.com.au/* - PROD zone

For security reasons, devops does not want a single cloudflare api token that has access to both dev and prod zones,
therefore, two deployments take place, to deploy the worker on different routes in different zones using different api
tokens.
In addition, encrypted environment variables must be deployed in a separate deployment to that of the worker and routes.

These api tokens and worker secrets are stored as azure devops secrets and retrieved in the release pipeline.

## Feature Branches

* In order for the Feature CI/CD process to work correctly, all features branches must follow the following naming
  convention:
  `refs/head/feature/ado-{{TICKET-NUMBER}}-some-stuff`
* The ADO ticket number is used as the feature tag for the feature worker
* feature branches are created as a separate worker (different name) that listens on a custom subdomain in dev ie
    * `cf-feat-{{TICKET-NUMBER}}.dev.comparethemarket.com.au`
    * `cf-feat-{{TICKET-NUMBER}}.secure.comparethemarket.com.au`
* these routes are made accessible via custom DNS records created as part of the build
* refer to the final deploy step, `Feature Worker Routes`, in the `FEATURE deploy` stage, to identify what routes the
  feature worker is listening on
* feature workers fetch all assets from DEV - when a feature worker reaches out to dev, it bypasses the DEV worker all
  together
* When clients make requests directly to DEV, both the Origin header and a cookie, `cf-feature-tag`, are used to
  instruct the DEV worker to send a redirect back to client to call on the feature subdomain
* there is a group of requests that are not redirected (for various reasons) - instead the Origin header and
  cookie, `cf-feature-tag`, are used to instruct the DEV worker not to execute any middleware on this request - in so
  doing, all request/response modification is managed by the feature worker
* examples of these types of requests are:
    * OPTIONS requests - browsers do not allow redirects on OPTIONS
    * pet and everest handovers - redirects on redirects do not appear to function correctly
    * everest journey create - we want to use the JWT token on the client when creating the journey, to ensure handover
      requests, using the same JWT, can access the journey
    * energy activity requests (in apply phase)
* while every effort has been made to ensure this behaviour is honoured, there are still requests made from the client,
  that bypass the feature worker (calling directly to DEV), without the `Origin` header or `cf-feature-tag` cookie (to
  indicate it is a feature branch request) - these requests, will unfortunately not be managed by our feature worker
* feature branches are created/updated on a build of a feature branch
* feature branches are not deployable, by default, to DEV - should you need your feature worker deployed to dev, you can
  set the `FEATURE_DEV_DEPLOY_OVERRIDE` parameter in the deploy pipeline UI
* on PR created, feature workers are updated using the PR build artifact
* only PR and main builds are eligible to be deployed to DEV, UAT and PROD - each of these environments require various
  approvers to promote into that env
* on PR merged, main is built (with `Build.Reason` of `IndividualCI`) - this triggers the destruction of the feature
  worker and associated infrastructure

### CORS and Feature Branches

* since our feature branches are deployed on different sub-domains to dev, CORS failures have frequently been
  encountered during development.
* This has largely been mitigated through the use of Cloudflare Page Transform rules, in which an `Origin` header is
  injected into the request, to satisfy upstream services, on both `OPTIONS` and `POST` requests. Refer to transform
  rule `CF Worker router feature branch (CORS : ADO-27148)` in request and response header modification tabs
* Bear in mind that these rules exists in both the `dev.comparethemarket.com.au` and `comparethemarket.com.au` CF
  zones (to manage health routes on *.secure.comparethemarket.com.au)
* Other factors to consider, when debugging CORS issues are CF WAF rules and CF Zero Trust - network failures in the
  browser, should be curled, to interrogate the response and identify possible interference by Cloudflare

### Feature Branch Known Issues

* Requests made, from a feature branch, directly from the client to DEV, by their nature are CORS requests - Browser
  security is heightened in these cases
* In addition, these requests are redirected back to the client on a different subdomain
* Browsers will set the `Origin` to `null` and excluded the `Cookie` and `Authorization` header on these requests
* Any middleware that relies on cookies will therefore be negatively impacted
* with verticals implementing macro/micro-ui frontends, in feature branches, the macro-ui attempts to load assets on
  http - sertain browsers eg Chrome will block these `mixed content` requests

### Gotchas

* when running locally, you may experience a network error - `(failed)net::ERR_CONTENT_DECODING_FAILED    )`. This error
  has been apparent in Chrome but not Safari.
* if you request a resource over http (which we do when running locally), Safari only sends the request
  header `accept-encoding=gzip, deflate`, if on https it sends `accept-encoding=gzip, deflate, br`
* Chrome on the other hand always sends `accept-encoding=gzip, deflate, br`. `br` stands for brotli compression and it
  is only available over https, hence the failure in Chrome.
* Wrangler version - to build this project we are currently pinned on 3.72.0. It ahs been observed that bumping our
  build version to the latest (as 2024-11-06, 3.84.1),
  wrangler's bundling (it uses esbuild under the hood) adds a renaming function to certain scripts. While, when
  consuming the whole js file, this doesn't present a problem, when we inject certain scripts verbatim into responses eg
  core Martech scripts,
  these scripts fail on the client, as they are missing wrangler's renaming function