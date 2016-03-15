Meteor.startup(function(){
  if (Contents.find().count() === 0) {
    var contents = [{
    	"id": "cf11ef6d41044be287e31f5a017f4f96",
    	"owner": "WWF_Globil",
    	"created": 1416245605000,
    	"modified": 1454435077000,
    	"guid": null,
    	"name": "Amazon_Globil",
    	"title": "Amazon_Globil",
    	"type": "Feature Service",
    	"typeKeywords": ["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"],
    	"description": null,
    	"tags": ["WWF", "GLOBIL", "South America", "Brazil", "Bolivia", "Peru", "Ecuador", "Colombia", "Venezuela", "Guiana", "Suriname", "French Guiana", "Amazon", "Amazon and Guianas", "Panamazon", "biodiversity", "biome", "boundary", "ecosystem", "infrastructure", "landuse", "landcover", "natural resources", "threats", "terrestrial", "fire", "protected area", "overlay layers", "web map", "webmap", "interactive map"],
    	"snippet": "overview of the amazon ecoregion",
    	"thumbnail": "thumbnail/thumbnail.png",
    	"documentation": null,
    	"extent": [
    		[-79.9000015, -30.832888891],
    		[-35.203611112, 10.5]
    	],
    	"spatialReference": "WGS_1984_Web_Mercator_Auxiliary_Sphere",
    	"accessInformation": null,
    	"licenseInfo": null,
    	"culture": "de-de",
    	"properties": null,
    	"url": "http://services1.arcgis.com/RTK5Unh1Z71JKIiR/arcgis/rest/services/Amazon_Globil/FeatureServer",
    	"access": "public",
    	"size": -1,
    	"appCategories": [],
    	"industries": [],
    	"languages": [],
    	"largeThumbnail": null,
    	"banner": null,
    	"screenshots": [],
    	"listed": false,
    	"numComments": 0,
    	"numRatings": 0,
    	"avgRating": 0,
    	"numViews": 19326
    }, {
    	"id": "3b700ae97bda4edb9ee7c57094993d0e",
    	"owner": "aurelie.shapiro@wwf.de_panda",
    	"created": 1411395478000,
    	"modified": 1411395559000,
    	"guid": null,
    	"name": "salonga_villages",
    	"title": "salonga_villages",
    	"type": "Feature Service",
    	"typeKeywords": ["Data", "Service", "Feature Service", "ArcGIS Server", "Feature Access", "Hosted Service"],
    	"description": "Villages in and around Salonga National Park",
    	"tags": ["Bonobo", "IUCN", "WWF"],
    	"snippet": "Salonga Villages",
    	"thumbnail": "thumbnail/thumbnail.png",
    	"documentation": null,
    	"extent": [
    		[15.276760069263974, -5.031678676377479],
    		[23.58118995749292, 0.04757507289079927]
    	],
    	"spatialReference": "GCS_WGS_1984",
    	"accessInformation": "WWF",
    	"licenseInfo": null,
    	"culture": "de-de",
    	"properties": null,
    	"url": "http://services1.arcgis.com/RTK5Unh1Z71JKIiR/arcgis/rest/services/salonga_villages/FeatureServer",
    	"access": "public",
    	"size": -1,
    	"appCategories": [],
    	"industries": [],
    	"languages": [],
    	"largeThumbnail": null,
    	"banner": null,
    	"screenshots": [],
    	"listed": false,
    	"numComments": 0,
    	"numRatings": 0,
    	"avgRating": 0,
    	"numViews": 12103
    }, {
    	"id": "287c4eeb7fef454b94b3dcaf9857b58c",
    	"owner": "WWF_Globil",
    	"created": 1412080841000,
    	"modified": 1412764102000,
    	"guid": null,
    	"name": null,
    	"title": "DRC",
    	"type": "Feature Service",
    	"typeKeywords": ["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"],
    	"description": null,
    	"tags": ["DRC"],
    	"snippet": null,
    	"thumbnail": "thumbnail/ago_downloaded.png",
    	"documentation": null,
    	"extent": [
    		[12.204143525367954, -13.455675126045394],
    		[31.30591201712801, 5.386097906017343]
    	],
    	"spatialReference": null,
    	"accessInformation": null,
    	"licenseInfo": null,
    	"culture": "de",
    	"properties": null,
    	"url": "http://services1.arcgis.com/RTK5Unh1Z71JKIiR/arcgis/rest/services/DRC/FeatureServer",
    	"access": "public",
    	"size": -1,
    	"appCategories": [],
    	"industries": [],
    	"languages": [],
    	"largeThumbnail": null,
    	"banner": null,
    	"screenshots": [],
    	"listed": false,
    	"numComments": 0,
    	"numRatings": 0,
    	"avgRating": 0,
    	"numViews": 12047
    }, {
    	"id": "07d28c8abbf54483820538784e87fc68",
    	"owner": "aurelie.shapiro@wwf.de_panda",
    	"created": 1411302460000,
    	"modified": 1411303193000,
    	"guid": null,
    	"name": "bonobo_range",
    	"title": "bonobo_range",
    	"type": "Feature Service",
    	"typeKeywords": ["Data", "Service", "Feature Service", "ArcGIS Server", "Feature Access", "Hosted Service"],
    	"description": "Bonobo Range in DRC",
    	"tags": ["Bonobo", "IUCN", "WWF"],
    	"snippet": "Bonobo Range from IUCN Redlist",
    	"thumbnail": "thumbnail/thumbnail.png",
    	"documentation": null,
    	"extent": [
    		[16.174791666802037, -4.384763889242038],
    		[25.82905115688543, 2.1441250000687564]
    	],
    	"spatialReference": "GCS_WGS_1984",
    	"accessInformation": "IUCN",
    	"licenseInfo": null,
    	"culture": "de-de",
    	"properties": null,
    	"url": "http://services1.arcgis.com/RTK5Unh1Z71JKIiR/arcgis/rest/services/bonobo_range/FeatureServer",
    	"access": "public",
    	"size": -1,
    	"appCategories": [],
    	"industries": [],
    	"languages": [],
    	"largeThumbnail": null,
    	"banner": null,
    	"screenshots": [],
    	"listed": false,
    	"numComments": 0,
    	"numRatings": 0,
    	"avgRating": 0,
    	"numViews": 11792
    }, {
    	"id": "ef8f0ec97c664f7fa83b304987587d3f",
    	"owner": "WWF_Globil",
    	"created": 1412080782000,
    	"modified": 1412764102000,
    	"guid": null,
    	"name": null,
    	"title": "bushmeat_markets",
    	"type": "Feature Service",
    	"typeKeywords": ["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"],
    	"description": null,
    	"tags": ["WWF", "DRC"],
    	"snippet": null,
    	"thumbnail": "thumbnail/ago_downloaded.png",
    	"documentation": null,
    	"extent": [
    		[19.432242015423014, -4.337700676893025],
    		[22.24438333244825, -0.27805395965897445]
    	],
    	"spatialReference": null,
    	"accessInformation": null,
    	"licenseInfo": null,
    	"culture": "de",
    	"properties": null,
    	"url": "http://services1.arcgis.com/RTK5Unh1Z71JKIiR/arcgis/rest/services/bushmeat_markets/FeatureServer",
    	"access": "public",
    	"size": -1,
    	"appCategories": [],
    	"industries": [],
    	"languages": [],
    	"largeThumbnail": null,
    	"banner": null,
    	"screenshots": [],
    	"listed": false,
    	"numComments": 0,
    	"numRatings": 0,
    	"avgRating": 0,
    	"numViews": 11591
    }, {
    	"id": "eeda34a01c60473aa2373fc5e49f82ef",
    	"owner": "WWF_Globil",
    	"created": 1412154571000,
    	"modified": 1412764103000,
    	"guid": null,
    	"name": "Salonga_towns",
    	"title": "Salonga_towns",
    	"type": "Feature Service",
    	"typeKeywords": ["Data", "Service", "Feature Service", "ArcGIS Server", "Feature Access", "Hosted Service"],
    	"description": null,
    	"tags": ["Africa", "DRC", "WWF"],
    	"snippet": "big towns around the Salonga National Park in the DRC",
    	"thumbnail": "thumbnail/thumbnail.png",
    	"documentation": null,
    	"extent": [
    		[15.27676006962156, -4.337700676744812],
    		[23.364575675926744, 0.04757507253162177]
    	],
    	"spatialReference": "WGS_1984_Web_Mercator_Auxiliary_Sphere",
    	"accessInformation": null,
    	"licenseInfo": null,
    	"culture": "de-de",
    	"properties": null,
    	"url": "http://services1.arcgis.com/RTK5Unh1Z71JKIiR/arcgis/rest/services/Salonga_towns/FeatureServer",
    	"access": "public",
    	"size": -1,
    	"appCategories": [],
    	"industries": [],
    	"languages": [],
    	"largeThumbnail": null,
    	"banner": null,
    	"screenshots": [],
    	"listed": false,
    	"numComments": 0,
    	"numRatings": 0,
    	"avgRating": 0,
    	"numViews": 11254
    }, {
    	"id": "01ba6da6ef1e433c9024a2105bf2c581",
    	"owner": "WWF_Globil",
    	"created": 1412242901000,
    	"modified": 1412764101000,
    	"guid": null,
    	"name": "Bonobo_Habitat2000",
    	"title": "Bonobo_Habitat2000",
    	"type": "Map Service",
    	"typeKeywords": ["Data", "Service", "Map Service", "ArcGIS Server", "Hosted Service"],
    	"description": null,
    	"tags": ["WWF", "Bonobo", "DRC"],
    	"snippet": "suitable habitat for Bonobos 2000",
    	"thumbnail": "thumbnail/ago_downloaded.png",
    	"documentation": null,
    	"extent": [
    		[15.3815264185, -6.84162840811844],
    		[27.2523607015, 3.67551424611842]
    	],
    	"spatialReference": "WGS_1984_Web_Mercator_Auxiliary_Sphere",
    	"accessInformation": null,
    	"licenseInfo": null,
    	"culture": "de-de",
    	"properties": null,
    	"url": "http://tiles.arcgis.com/tiles/RTK5Unh1Z71JKIiR/arcgis/rest/services/Bonobo_Habitat2000/MapServer",
    	"access": "public",
    	"size": -1,
    	"appCategories": [],
    	"industries": [],
    	"languages": [],
    	"largeThumbnail": null,
    	"banner": null,
    	"screenshots": [],
    	"listed": false,
    	"numComments": 0,
    	"numRatings": 0,
    	"avgRating": 0,
    	"numViews": 11075
    }, {
    	"id": "8c574a9ad5a24bdb8370574c5f441920",
    	"owner": "WWF_Globil",
    	"created": 1412666266000,
    	"modified": 1412764103000,
    	"guid": null,
    	"name": null,
    	"title": "WWF_stations_final",
    	"type": "Feature Service",
    	"typeKeywords": ["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"],
    	"description": null,
    	"tags": ["Bonobo", "WWF", "DRC"],
    	"snippet": null,
    	"thumbnail": "thumbnail/ago_downloaded.png",
    	"documentation": null,
    	"extent": [
    		[20.4818632164, -3.1507680795000033],
    		[21.987899415300003, -0.9068117703000067]
    	],
    	"spatialReference": null,
    	"accessInformation": null,
    	"licenseInfo": null,
    	"culture": "de-de",
    	"properties": null,
    	"url": "http://services1.arcgis.com/RTK5Unh1Z71JKIiR/arcgis/rest/services/WWF_stations_final/FeatureServer",
    	"access": "public",
    	"size": -1,
    	"appCategories": [],
    	"industries": [],
    	"languages": [],
    	"largeThumbnail": null,
    	"banner": null,
    	"screenshots": [],
    	"listed": false,
    	"numComments": 0,
    	"numRatings": 0,
    	"avgRating": 0,
    	"numViews": 10670
    }, {
    	"id": "7ba439d5330945edb7d53bebc2aa4bf0",
    	"owner": "mayra.milkovic@vidasilvestre.org.ar_panda",
    	"created": 1423163479000,
    	"modified": 1437682691000,
    	"guid": null,
    	"name": "Mapa_Interactivo_de_Biodiversidad",
    	"title": "Mapa_Interactivo_de_Biodiversidad",
    	"type": "Feature Service",
    	"typeKeywords": ["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Multilayer", "Service", "Hosted Service"],
    	"description": "Herramienta interactiva de soporte para la toma de desiciones sobre manejo responsable de los recursos naturales, con base ambiental y de biodiversidad.<div><br /><\/div><div><div style='margin: 0px; padding: 0px; color: rgb(77, 77, 77); font-family: '>Información proveniente de distintas instituciones: FVSA, AOP, SIFAP, APN, CeIBA, IGN, SAyDS.<\/div><div style='margin: 0px; padding: 0px; color: rgb(77, 77, 77); font-family: '><br /><\/div><div style='margin: 0px; padding: 0px; color: rgb(77, 77, 77); font-family: '>Sistemas de coordenadas: WGS_1984_Web_Mercator_Auxiliary_Sphere<\/div><div style='margin: 0px; padding: 0px; color: rgb(77, 77, 77); font-family: '><br /><\/div><div style='margin: 0px; padding: 0px; color: rgb(77, 77, 77); font-family: '>Contacto: mayra.milkovic@vidasilvestre.org.ar<\/div><\/div>",
    	"tags": ["WWF", "GLOBIL", "South America", "Vida Silvestre Argentina", "Argentina", "biodiversity", "ecosystem", "ecoregion", "protected area", "analysis result", "overlay layers", "polygon"],
    	"snippet": "Herramienta interactiva de soporte para la toma de desiciones sobre manejo responsable de los recursos naturales, con base ambiental y de biodiversidad.",
    	"thumbnail": "thumbnail/thumbnail.png",
    	"documentation": null,
    	"extent": [
    		[-180, -90],
    		[-25.023144836989466, -21.521019895853065]
    	],
    	"spatialReference": "WGS_1984_Web_Mercator_Auxiliary_Sphere",
    	"accessInformation": "FVSA",
    	"licenseInfo": "Público",
    	"culture": "es-es",
    	"properties": null,
    	"url": "http://services1.arcgis.com/RTK5Unh1Z71JKIiR/arcgis/rest/services/Mapa_Interactivo_de_Biodiversidad/FeatureServer",
    	"access": "public",
    	"size": -1,
    	"appCategories": [],
    	"industries": [],
    	"languages": [],
    	"largeThumbnail": null,
    	"banner": null,
    	"screenshots": [],
    	"listed": false,
    	"numComments": 0,
    	"numRatings": 0,
    	"avgRating": 0,
    	"numViews": 7271
    }, {
    	"id": "2efd8c7cf92c48388238d99337708136",
    	"owner": "WWF_Globil",
    	"created": 1412065098000,
    	"modified": 1412764102000,
    	"guid": null,
    	"name": null,
    	"title": "Bonobo Kampagne",
    	"type": "Web Map",
    	"typeKeywords": ["ArcGIS Online", "Collector", "Data Editing", "Explorer Web Map", "Map", "Online Map", "useOnly", "Web Map"],
    	"description": null,
    	"tags": ["WWF", "DRC", "Bonobo"],
    	"snippet": "Information related to Bonobos and their conservation in DRC",
    	"thumbnail": "thumbnail/ago_downloaded.png",
    	"documentation": null,
    	"extent": [
    		[19.76, -3.13],
    		[24.34, -0.95]
    	],
    	"spatialReference": null,
    	"accessInformation": "WWF Deutschland",
    	"licenseInfo": null,
    	"culture": "de",
    	"properties": null,
    	"url": null,
    	"access": "public",
    	"size": -1,
    	"appCategories": [],
    	"industries": [],
    	"languages": [],
    	"largeThumbnail": null,
    	"banner": null,
    	"screenshots": [],
    	"listed": false,
    	"numComments": 0,
    	"numRatings": 0,
    	"avgRating": 0,
    	"numViews": 6527
    }, {
    	"id": "97f1bb9aa5394e6fabb72b1d85effd81",
    	"owner": "WWF_Globil",
    	"created": 1412065775000,
    	"modified": 1412764102000,
    	"guid": null,
    	"name": null,
    	"title": "Bonobo Kampagne",
    	"type": "Web Mapping Application",
    	"typeKeywords": ["JavaScript", "Map", "Mapping Site", "Online Map", "Ready To Use", "Web Map"],
    	"description": null,
    	"tags": ["WWF", "DRC", "Bonobo"],
    	"snippet": "Information related to Bonobos and their conservation in DRC",
    	"thumbnail": "thumbnail/junger-bonobo-18091.jpg",
    	"documentation": null,
    	"extent": [],
    	"spatialReference": null,
    	"accessInformation": null,
    	"licenseInfo": null,
    	"culture": "de",
    	"properties": null,
    	"url": "http://panda.maps.arcgis.com/apps/Viewer/index.html?appid=97f1bb9aa5394e6fabb72b1d85effd81",
    	"access": "public",
    	"size": -1,
    	"appCategories": [],
    	"industries": [],
    	"languages": [],
    	"largeThumbnail": null,
    	"banner": null,
    	"screenshots": [],
    	"listed": false,
    	"numComments": 0,
    	"numRatings": 0,
    	"avgRating": 0,
    	"numViews": 6509
    }, {
    	"id": "aa92a999cfd54163a5c244809591ab48",
    	"owner": "WWF_Globil",
    	"created": 1389977357000,
    	"modified": 1413289973000,
    	"guid": null,
    	"name": "Meeresspiegelanstieg 11",
    	"title": "Global Sea Level Rise: 11,5m",
    	"type": "Map Service",
    	"typeKeywords": ["ArcGIS Server", "Data", "Map Service", "Service", "Hosted Service"],
    	"description": "RCP8.5 (=BAU) 5°C (11,5m) in 2100.\r\n\r\nIPCC5 Scenario RCP8.5-Scenario: Business as usual (BAU), from NASA Shuttle Radar Topographic Mission (SRTM) 250m from https://hc.app.box.com/shared/1yidaheouv <div>Data classification: 5° Temperature rise, areas with elevation &lt;=11.5m\r\n\r\nNASA SRTM, Levermann et al. 2013<\/div>",
    	"tags": ["IPCC", "Climate", "Climate Change", "Sea Level Rise", "WWF", "GLOBIL"],
    	"snippet": "NASA Shuttle Radar Topographic Mission (SRTM) 250m Sea Level rise of  11.5m; udner homogenous sea level rise according to Levermann 2,3m/°C- warming",
    	"thumbnail": "thumbnail/ago_downloaded.png",
    	"documentation": null,
    	"extent": [
    		[-179.999995508415, -88.9999999216112],
    		[108.626374004513, 88.9999999216112]
    	],
    	"spatialReference": "WGS_1984_Web_Mercator_Auxiliary_Sphere",
    	"accessInformation": "NASA SRTM, Levermann et al. 2013",
    	"licenseInfo": null,
    	"culture": "de-de",
    	"properties": null,
    	"url": "http://tiles.arcgis.com/tiles/RTK5Unh1Z71JKIiR/arcgis/rest/services/Meeresspiegelanstieg_11/MapServer",
    	"access": "public",
    	"size": -1,
    	"appCategories": [],
    	"industries": [],
    	"languages": [],
    	"largeThumbnail": null,
    	"banner": null,
    	"screenshots": [],
    	"listed": false,
    	"numComments": 0,
    	"numRatings": 0,
    	"avgRating": 0,
    	"numViews": 4578
    }, {
    	"id": "ef1b62313b1a4f598c5a36eab36cd81c",
    	"owner": "birgit.zander",
    	"created": 1401795468000,
    	"modified": 1439209758000,
    	"guid": null,
    	"name": "WM_spielorte",
    	"title": "WM_spielorte",
    	"type": "Feature Service",
    	"typeKeywords": ["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"],
    	"description": "This service shows the places of the football world cup 2014 in Brazil",
    	"tags": ["WM; WWF", "WWF", "GLOBIL", "South America", "Brazil", "Amazon", "Atlantic Forest", "Cerrado Pantanal", "Caatinga", "Paraguay river", "Paraguay basin", "Pampa", "brazilian amazon", "biodiversity", "biome", "ecosystem", "species", "interactive map", "web map", "webmap", "WM"],
    	"snippet": "shows the places of the Football world cup 2014 in Brazil",
    	"thumbnail": "thumbnail/thumbnail.png",
    	"documentation": null,
    	"extent": [
    		[-79.43629454451586, -30.040001932867266],
    		[-34.9149954693725, 8.603646492564732]
    	],
    	"spatialReference": "WGS_1984_Web_Mercator_Auxiliary_Sphere",
    	"accessInformation": "WWF Germany",
    	"licenseInfo": null,
    	"culture": "de-de",
    	"properties": null,
    	"url": "http://services1.arcgis.com/RTK5Unh1Z71JKIiR/arcgis/rest/services/WM_spielorte/FeatureServer",
    	"access": "public",
    	"size": -1,
    	"appCategories": [],
    	"industries": [],
    	"languages": [],
    	"largeThumbnail": null,
    	"banner": null,
    	"screenshots": [],
    	"listed": false,
    	"numComments": 0,
    	"numRatings": 0,
    	"avgRating": 0,
    	"numViews": 3638
    }, {
    	"id": "d70217f3e7a24a259492852f31964a89",
    	"owner": "WWF_Globil",
    	"created": 1392293413000,
    	"modified": 1392312064000,
    	"guid": null,
    	"name": "MPAJan2014",
    	"title": "MPAJan2014",
    	"type": "Map Service",
    	"typeKeywords": ["Data", "Service", "Map Service", "ArcGIS Server", "Hosted Service"],
    	"description": null,
    	"tags": ["WWF", "MPA"],
    	"snippet": "Marine Protected Areas - January 2014",
    	"thumbnail": "thumbnail/thumbnail.png",
    	"documentation": null,
    	"extent": [
    		[-179.999988540844, -68.6478214859999],
    		[179.999988540844, 83.73000006]
    	],
    	"spatialReference": "WGS_1984_Web_Mercator_Auxiliary_Sphere",
    	"accessInformation": "WWF",
    	"licenseInfo": "Non-commercial use",
    	"culture": "de-de",
    	"properties": null,
    	"url": "http://tiles.arcgis.com/tiles/RTK5Unh1Z71JKIiR/arcgis/rest/services/MPAJan2014/MapServer",
    	"access": "public",
    	"size": -1,
    	"appCategories": [],
    	"industries": [],
    	"languages": [],
    	"largeThumbnail": null,
    	"banner": null,
    	"screenshots": [],
    	"listed": false,
    	"numComments": 0,
    	"numRatings": 0,
    	"avgRating": 0,
    	"numViews": 3531
    }, {
    	"id": "bb9be66100374edabc796189a7c37043",
    	"owner": "mariobarroso@wwf.org.br_panda",
    	"created": 1418754113000,
    	"modified": 1438006100000,
    	"guid": null,
    	"name": null,
    	"title": "South America rivers",
    	"type": "Feature Service",
    	"typeKeywords": ["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"],
    	"description": "Lines derived from SRTM",
    	"tags": ["WWF", "WWF Brazil", "Rivers", "South America", "Hydrosheds", "GLOBIL", "Brazil", "database", "polyline"],
    	"snippet": "South America rivers- Hydrosheds 15s",
    	"thumbnail": "thumbnail/ago_downloaded.png",
    	"documentation": null,
    	"extent": [
    		[-81.12708333333353, -54.55625000000002],
    		[-34.885416666667595, 11.556249999998906]
    	],
    	"spatialReference": null,
    	"accessInformation": null,
    	"licenseInfo": null,
    	"culture": "pt-br",
    	"properties": null,
    	"url": "http://services1.arcgis.com/RTK5Unh1Z71JKIiR/arcgis/rest/services/line_rivers/FeatureServer",
    	"access": "public",
    	"size": -1,
    	"appCategories": [],
    	"industries": [],
    	"languages": [],
    	"largeThumbnail": null,
    	"banner": null,
    	"screenshots": [],
    	"listed": false,
    	"numComments": 0,
    	"numRatings": 0,
    	"avgRating": 0,
    	"numViews": 3361
    }, {
    	"id": "aa39aeb9418b4f3e8e55e471b0fa9a5e",
    	"owner": "mariobarroso@wwf.org.br_panda",
    	"created": 1418743160000,
    	"modified": 1437590408000,
    	"guid": null,
    	"name": "municipalities_Br",
    	"title": "municipalities_Br",
    	"type": "Map Service",
    	"typeKeywords": ["ArcGIS Server", "Data", "Map Service", "Metadata", "Service", "Hosted Service"],
    	"description": "Oficial data - IBGE\r\nPoligons \r\nMunicipalities\r\n1:250.000",
    	"tags": ["municipalities", "South America", "WWF", "WWF Brazil", "Brazil", "GLOBIL", "boundary", "political", "polygon"],
    	"snippet": "Brazilian municipalities - IBGE data",
    	"thumbnail": "thumbnail/thumbnail.png",
    	"documentation": null,
    	"extent": [
    		[-83.6661764748881, -35.4464851499661],
    		[-19.1601811233483, 7.3179194135136]
    	],
    	"spatialReference": "WGS_1984_Web_Mercator_Auxiliary_Sphere",
    	"accessInformation": "IBGE",
    	"licenseInfo": null,
    	"culture": "pt-br",
    	"properties": null,
    	"url": "http://tiles.arcgis.com/tiles/RTK5Unh1Z71JKIiR/arcgis/rest/services/municipalities_Br/MapServer",
    	"access": "public",
    	"size": -1,
    	"appCategories": [],
    	"industries": [],
    	"languages": [],
    	"largeThumbnail": null,
    	"banner": null,
    	"screenshots": [],
    	"listed": false,
    	"numComments": 0,
    	"numRatings": 0,
    	"avgRating": 0,
    	"numViews": 2585
    }, {
    	"id": "4e6b7a31505c47dbab8a035d1a180a6d",
    	"owner": "nshahida@wwf.org.my_panda",
    	"created": 1433839113000,
    	"modified": 1434016330000,
    	"guid": null,
    	"name": "Satellite_Trekking_in_Terengganu",
    	"title": "Satellite_Trekking_in_Terengganu",
    	"type": "Feature Service",
    	"typeKeywords": ["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Multilayer", "Service", "Hosted Service"],
    	"description": "Movement of Green Turtle in South China Sea",
    	"tags": ["Turtles"],
    	"snippet": "Satellite trekking movement in Terengganu",
    	"thumbnail": "thumbnail/thumbnail.png",
    	"documentation": null,
    	"extent": [
    		[101.63805823268504, -0.9541211366386341],
    		[119.95559209627363, 10.74052476628152]
    	],
    	"spatialReference": "GCS_WGS_1984",
    	"accessInformation": null,
    	"licenseInfo": null,
    	"culture": "en-my",
    	"properties": null,
    	"url": "http://services1.arcgis.com/RTK5Unh1Z71JKIiR/arcgis/rest/services/Satellite_Trekking_in_Terengganu/FeatureServer",
    	"access": "public",
    	"size": -1,
    	"appCategories": [],
    	"industries": [],
    	"languages": [],
    	"largeThumbnail": null,
    	"banner": null,
    	"screenshots": [],
    	"listed": false,
    	"numComments": 0,
    	"numRatings": 0,
    	"avgRating": 0,
    	"numViews": 2579
    }, {
    	"id": "d08eeb6546d847aeb28616bac73c3567",
    	"owner": "WWF_Globil",
    	"created": 1396622140000,
    	"modified": 1431763712000,
    	"guid": null,
    	"name": "MPA_storymap_photos",
    	"title": "MPA_storymap_photos",
    	"type": "Feature Service",
    	"typeKeywords": ["Data", "Service", "Feature Service", "ArcGIS Server", "Feature Access", "Hosted Service"],
    	"description": null,
    	"tags": [],
    	"snippet": null,
    	"thumbnail": null,
    	"documentation": null,
    	"extent": [],
    	"spatialReference": null,
    	"accessInformation": null,
    	"licenseInfo": null,
    	"culture": null,
    	"properties": null,
    	"url": "http://services1.arcgis.com/RTK5Unh1Z71JKIiR/arcgis/rest/services/MPA_storymap_photos/FeatureServer",
    	"access": "public",
    	"size": -1,
    	"appCategories": [],
    	"industries": [],
    	"languages": [],
    	"largeThumbnail": null,
    	"banner": null,
    	"screenshots": [],
    	"listed": false,
    	"numComments": 0,
    	"numRatings": 0,
    	"avgRating": 0,
    	"numViews": 2377
    }, {
    	"id": "c95ab68aa0e54fc398c735317d82c609",
    	"owner": "WWF_Globil",
    	"created": 1412689047000,
    	"modified": 1412764102000,
    	"guid": null,
    	"name": null,
    	"title": "Bonobo Kampagne-Mobil",
    	"type": "Web Map",
    	"typeKeywords": ["ArcGIS Online", "Collector", "Data Editing", "Explorer Web Map", "Map", "Online Map", "useOnly", "Web Map"],
    	"description": null,
    	"tags": ["WWF", "DRC", "Bonobo"],
    	"snippet": "Information related to Bonobos and their conservation in DRC",
    	"thumbnail": "thumbnail/ago_downloaded.png",
    	"documentation": null,
    	"extent": [
    		[19.2801, -3.1529],
    		[23.8614, -0.9765]
    	],
    	"spatialReference": null,
    	"accessInformation": "WWF Deutschland",
    	"licenseInfo": null,
    	"culture": "de-de",
    	"properties": null,
    	"url": null,
    	"access": "public",
    	"size": -1,
    	"appCategories": [],
    	"industries": [],
    	"languages": [],
    	"largeThumbnail": null,
    	"banner": null,
    	"screenshots": [],
    	"listed": false,
    	"numComments": 0,
    	"numRatings": 0,
    	"avgRating": 0,
    	"numViews": 2363
    }, {
    	"id": "19a35d4ec2794fa58072f4887ab56c43",
    	"owner": "WWF_Globil",
    	"created": 1412689081000,
    	"modified": 1412764102000,
    	"guid": null,
    	"name": null,
    	"title": "Bonobo Kampagne-Mobil",
    	"type": "Web Mapping Application",
    	"typeKeywords": ["JavaScript", "Map", "Mapping Site", "Online Map", "Web Map"],
    	"description": null,
    	"tags": ["WWF", "DRC", "Bonobo"],
    	"snippet": "Information related to Bonobos and their conservation in DRC",
    	"thumbnail": "thumbnail/ago_downloaded.png",
    	"documentation": null,
    	"extent": [],
    	"spatialReference": null,
    	"accessInformation": null,
    	"licenseInfo": null,
    	"culture": "de-de",
    	"properties": null,
    	"url": "http://panda.maps.arcgis.com/apps/Viewer/index.html?appid=19a35d4ec2794fa58072f4887ab56c43",
    	"access": "public",
    	"size": -1,
    	"appCategories": [],
    	"industries": [],
    	"languages": [],
    	"largeThumbnail": null,
    	"banner": null,
    	"screenshots": [],
    	"listed": false,
    	"numComments": 0,
    	"numRatings": 0,
    	"avgRating": 0,
    	"numViews": 2336
    }];

    for (var i = 0; i < contents.length; i++) {
      Contents.insert(contents[i]);
    }
  }
});
