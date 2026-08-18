/*
 * The plugin ships no types. It attaches `L.gridLayer.googleMutant` as a side
 * effect of being imported, so the module itself exports nothing worth naming —
 * this only needs to exist for the dynamic import to typecheck.
 */
declare module "leaflet.gridlayer.googlemutant";
