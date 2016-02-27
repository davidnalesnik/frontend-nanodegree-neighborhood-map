/**
    This file contains the Javascript code supporting index.html.  This
    includes code for
    (1) building a Google map;
    (2) drawing data from Google Places;
    (3) creating a model view using Knockout;
    (4) accessing the Yelp API.
*/

/************* DATA *************/

// the initial center coordinates of the map
var hillCoords = {lat: 38.6156543, lng: -90.2800253};

// latitude and longitude values for SW and NE corners of Hill search area
var hillBoundaries = {
    SW: {lat: 38.609711, lng: -90.280624},
    NE: {lat: 38.619077, lng: -90.266437}
};

/**
    NW boundary of the Hill.  Outside of search area, but useful for orienting
    and scaling map display.
*/
var hillNW = {lat: 38.622438, lng: -90.288026};

/**
    Will store data about restaurants, cafes, bakeries, and groceries in the
    Hill neighborhood of St. Louis.  Populated by Google Places.
*/
var hillVenueData = [];

/**
    A backup array used in case Google Maps doesn't load properly.  This
    includes a few restaurants so that the onscreen list has some content
    and can be searched.
*/
var backupVenues = [
    {
        name: "Amighetti's"
    },
    {
        name: "Charlie Gitto's On the Hill"
    },
    {
        name: "Giovanni's On the Hill"
    },
    {
        name: "Cunetto House of Pasta"
    },
    {
        name: "Mama Toscano's Ravioli"
    }
];

/*********** MAP **************/

var map;
/**
    In order that only a single info window is visible at any one
    time, we reuse a single global window.  This window changes
    position and content depending on the marker which is clicked.
    This same window is also used when a list element is clicked.
*/
var infoWindow;

// Callback for successful load of Google Maps code.
function mapInit() {
    var mapDiv = $('#map')[0];
    map = new google.maps.Map(mapDiv, {
        center: hillCoords,
        zoom: 16,
        disableDefaultUI: true
    });
    var bounds = new google.maps.LatLngBounds();
    /**
        We first add the NW coordinate of the Hill neighborhood to the
        map's bounds.  This helps position and scale the map for better
        mobile display.
    */
    bounds.extend(new google.maps.LatLng(hillNW));
    // When viewport changes, ensure markers fit.
    google.maps.event.addDomListener(window, 'resize', function() {
        map.fitBounds(bounds);
    });
    // When a marker is clicked, animate it and open an info window.
    infoWindow = new google.maps.InfoWindow();

    var makeMarkerClickCallback = function(venue) {
        return function() {
            var settings = getJQueryAjaxSettings(venue);
            $.ajax(settings);
            if (this.getAnimation() == null) {
                this.setAnimation(google.maps.Animation.BOUNCE);
                var self = this;
                setTimeout(function () {
                    self.setAnimation(null);
                }, 1400);
            }
        };
    };
    /**
        Use Google Places to find Italian restaurants/groceries/bakeries/cafes
        in the Hill.
    */
    var service = new google.maps.places.PlacesService(map);
    var searchBounds = new google.maps.LatLngBounds(hillBoundaries.SW, hillBoundaries.NE);
    var request = {
        bounds: searchBounds,
        keyword: 'italian',
        types: ['restaurant','cafe','bakery','grocery_or_supermarket']
    };
    service.nearbySearch(request, placeCallback);

    function placeCallback(placeData, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            /**
                Add markers to the map based on location data from Google
                PlacesService search.  These are stored in the global venue data
                object for easy access by the view model.  Other information
                is stored there too for population of the marker info windows
                and verification of Yelp search results.
            */
            var position, marker, entry;
            placeData.forEach(function(venue) {
                position = new google.maps.LatLng(venue.geometry.location.lat(), venue.geometry.location.lng());
                // Discount Google search results outside of search area.
                if (searchBounds.contains(position)) {
                    marker = new google.maps.Marker({
                        position: position,
                        map: map,
                        title: venue.name
                    });
                    /**
                        Add marker coordinates to map bounds so map will be
                        centered on our venues and appropriately scaled.
                    */
                    bounds.extend(position);
                    entry = {
                        name: venue.name,
                        address: venue.vicinity,
                        marker: marker
                    };
                    hillVenueData.push(entry);
                    marker.addListener('click', makeMarkerClickCallback(entry));
                }
            });
            map.fitBounds(bounds);
        } else {
            /**
                If Google Places doesn't return successfully, alert the user
                with a message giving some information about what happened.  A
                map of the Hill neighborhood will still appear, though without
                markers.
            */
            alert('A problem occurred with Google Places search. Status: ' +
            status);
        }
        // Now that the map has been built, we can instantiate the view model.
        ko.applyBindings(new ViewModel());
    }
}

/**
    If Google Maps isn't available, create a limited view model and alert
    the user.
*/
function initWithGoogleMapsError() {
    ko.applyBindings(new ViewModel());
    alert('Problem loading Google Maps!');
}

/**************** VIEW MODEL *****************/

/**
    The view model will be instantiated after the Google map has been created
    since it refers to the map for full functionality.  If retrieving the map
    fails, the view model will still be built (see function
    'initWithGoogleMapsError' above) so that there is some interactivity: a
    short backup list can be searched by the user and the Italian flag button
    will toggle the list display.
*/
var ViewModel = function() {
    var vm = this;
    vm.venueDataList = (typeof google !== 'undefined') ?
    ko.observableArray(hillVenueData) : ko.observableArray(backupVenues);
    // Put data in alphabetical order by name.
    vm.venueDataList(vm.venueDataList().sort(function (x, y) {
        if (x.name < y.name) return -1;
        if (x.name > y.name) return 1;
        return 0;
    }));
    /**
        When a list item is clicked:
        (1) The list view is hidden.
        (2) The marker will bounce twice.  See http://stackoverflow.com/questions/7339200/bounce-a-pin-in-google-maps-once
        (3) An info window will open for the marker.
    */
    vm.listClickHandler = function(venue) {
        if (typeof google !== 'undefined') {
            var m = venue.marker;
            vm.toggleListView();
            /**
                When the map was initialized, we attached an event listener
                to the marker to animate it when clicked.  Trigger this same
                marker behavior when the list item is clicked.  See http://stackoverflow.com/questions/2730929/how-to-trigger-the-onclick-event-of-a-marker-on-a-google-maps-v3
            */
            google.maps.event.trigger(m, 'click');
        }
    };
    /**
        Create a copy of vm.venueDataList which only includes matches for
        user's search.  For use in list display.  Markers are hidden/reappeared
        by side-effect as this filtered list is created.
    */
    vm.searchString = ko.observable('');
    vm.filteredVenueList = ko.computed(function() {
        var searchstring = vm.searchString().toLowerCase();
        return ko.utils.arrayFilter(vm.venueDataList(), function(venue) {
            var name = venue.name.toLowerCase();
            var hide = (name.indexOf(searchstring) === -1);
            if (typeof google !== 'undefined') {
                hide ? venue.marker.setMap(null) : venue.marker.setMap(map);
            }
            return !hide;
        });
    });
    /**
        Clicking on the tricolor Italian flag button in the list view hides the
        search bar and the venue list.  Search bar and list are hidden by
        default.
    */
    vm.listVisibility = ko.observable(false);
    vm.toggleListView = function() {
        vm.listVisibility(!vm.listVisibility());
    };
};

/************ Yelp API, Info window  ************/

/**
    The Yelp API is used to add a phone number, rating, and Yelp page link to
    the info window which pops up when a marker or list item is clicked.  (Other
    information is derived from Google Places so that window content doesn't
    depend solely on the success of the Yelp AJAX request.)
*/

var YELP_BASE_URL = 'http://api.yelp.com/v2/';
var YELP_SEARCH_URL = YELP_BASE_URL + 'search';

/**
    Note: the strings stored in the following four variables must be replaced
    with actual values obtained from https://www.yelp.com/developers.  These
    strings also must be changed in the optimized version of this file found
    in dist/js/optimizedJS.js where they appear at the end.  (Running Grunt
    will take care of this automatically, provided the keys are first changed
    here.)
*/
var YELP_CONSUMER_KEY = 'XXXXXXXXXXXXXXXXXXXXXX';
var YELP_TOKEN = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
var YELP_CONSUMER_SECRET = 'XXXXXXXXXXXXXXXXXXXXXXXXXXX';
var YELP_TOKEN_SECRET = 'XXXXXXXXXXXXXXXXXXXXXXXXXXX';

// string representing the alphanumeric characters usable by nonce
var nonceChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// Generate a random string of 16 alphanumeric characters for OAuth request.
function getNonce() {
    var nonce = '';
    for(var i = 0; i < 16; i++) {
        nonce += nonceChars.charAt(Math.floor(Math.random() * 62));
    }
    return nonce;
}

// 'Cunetto's House of     Pasta' --> 'Cunetto's+House+of+Pasta'
function formatName(str) {
    return str.replace(/\s+/g, '+');
}

// '1234567890' -> '(123) 456-7890'
function formatYelpPhone(phoneNum) {
    return '(' + phoneNum.slice(0, 3) + ') ' +
    phoneNum.slice(3, 6) + '-' + phoneNum.slice(6);
}

/**
    Return an HTML string representing a star with the given width and
    height.  The variable 'widthFraction' represents the width of a partial
    star expressed as a multiplier of width.  Partial stars are drawn from
    the left edge.  Used in creating a display for ratings derived from Yelp.
*/
function getStarHTML(width, height, widthFraction) {
    return '<svg width="' + width * widthFraction +
    '" height="' + height +
    '" style="fill:orange" ><polygon points="' +
    width / 2 + ',0' + // top point
    ' ' + width / 6 + ',' + height + // bottom left
    ' ' + width + ',' + height / 3 + // middle right
    ' ' + 0 + ',' + height / 3 + // middle left
    ' ' + width * 5 / 6 + ',' + height + // bottom right
    '" /></svg>';
}

/**
    Return settings for Yelp ajax requests made when user clicks on a marker
    or on an item in the list view.  The parameter 'venue' is an element of
    the hillVenueData array.
*/
function getJQueryAjaxSettings(venue) {
    var googleAddress = venue.address;
    var name = venue.name;
    var baseInfoHTML = '<div class="infowindow"><h3>' + name + '</h3><p>' +
    googleAddress + '</p>';
    var parameters = {
        term: formatName(name),
        location: 'The+Hill+Saint+Louis',
        oauth_consumer_key: YELP_CONSUMER_KEY,
        oauth_token: YELP_TOKEN,
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000),
        oauth_nonce: getNonce(),
        oauth_version : '1.0',
        callback: 'myCallback'
    };
    parameters.oauth_signature = oauthSignature.generate('GET',
    YELP_SEARCH_URL, parameters, YELP_CONSUMER_SECRET, YELP_TOKEN_SECRET);

    var settings = {
        url: YELP_SEARCH_URL,
        data: parameters,
        cache: true,
        dataType: 'jsonp',
        // On success, open info window with Yelp data.
        success: function(results) {
            /**
                Yelp search results will ideally put our venue at the head
                of the returned array.  We can't count on this, however: the
                name derived from Google Places may not match Yelp's name.  Use
                the street number to sift through Yelp results.
            */
            var googleStreetNumber = googleAddress.match(/^[0-9]+/g)[0];
            var hit = results.businesses.find(function(elt) {
                return elt.location.display_address[0].includes(googleStreetNumber, 0);
            });
            var infoHTML = baseInfoHTML;
            if (typeof hit != 'undefined') {
                // Make a star display for Yelp rating.
                var rating = hit.rating;
                var fullStars = Math.floor(rating);
                var partialStars = rating - fullStars;
                var STAR_WIDTH = 18;
                var STAR_HEIGHT = 18;
                var starHTML = getStarHTML(STAR_WIDTH, STAR_HEIGHT, 1);
                var ratingHTML = '';
                for(var i = 0; i < fullStars; i++) {
                    ratingHTML += starHTML;
                }
                if (partialStars > 0) {
                    ratingHTML += getStarHTML(STAR_WIDTH, STAR_HEIGHT, partialStars);
                }

                var phoneNumber = formatYelpPhone(hit.phone);
                var mobileURL = hit.mobile_url;
                infoHTML += '<p>' + phoneNumber + '</p>' +
                '<p><a class="yelplink" href="' + mobileURL +
                '">Yelp</a> &nbsp;rating: <span class="ratingstars">' + ratingHTML +
                '</span></p></div>';
            } else {
                infoHTML += '<p class="yelperror">Not found at Yelp</p></div>';
            }
            infoWindow.setContent(infoHTML);
            infoWindow.open(map, venue.marker);
        },
        // On error, give user infomation from Google Places and a message.
        error: function(jqXHR, textStatus, errorThrown) {
            var message = '(' + jqXHR.status + ' ' + errorThrown + ')';
            infoWindow.setContent(baseInfoHTML +
            '<p class="yelperror">Yelp unavailable ' + message + '</p>');
            infoWindow.open(map, venue.marker);
        }
    };
    return settings;
}
