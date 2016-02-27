## Neighborhood Map Project

#### Introduction

This project is a single-page application for discovering Italian food in the
St. Louis neighborhood known as "The Hill."  It was completed as P5-1:
Neighborhood Map Project of a Udacity Front-End Web Developer Nanodegree.

#### To run the project

1. Download/unzip or clone the repository.

2. Yelp keys have been redacted.  To use this project, you will need to
establish API access credentials [here](https://www.yelp.com/developers).
Use the strings you obtain in the following lines of `src/js/app.js`:

  ```
  var YELP_CONSUMER_KEY = 'XXXXXXXXXXXXXXXXXXXXXX';
  var YELP_TOKEN = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
  var YELP_CONSUMER_SECRET = 'XXXXXXXXXXXXXXXXXXXXXXXXXXX';
  var YELP_TOKEN_SECRET = 'XXXXXXXXXXXXXXXXXXXXXXXXXXX';
  ```

  These variables are found at the end of `dist/js/optimizedJS.js` and
  may be manually replaced or created automatically by running the
  build process on the updated `src/js/app.js`.  Building the project is
  discussed below.

3. Open `src/index.html` (unoptimized) or `dist/index.html` (optimized) in
a browser.

#### More information

This web project features a full-page Google map with markers for restaurants,
bakeries, cafes, and grocery stores found using the Google Places API.
Information about each business drawn from Google Places and from Yelp is
displayed in info windows.  Venues are also presented in a searchable list.

The map and list view are integrated.  Clicking either on a marker or its
associated entry in the list causes the marker to bounce and an info window to
appear above it.  When the list is filtered by a search, markers will disappear
or reappear in accordance with the updated list contents.

Searches are by name and case-insensitive.

The following behaviors are designed to accommodate smaller devices:

1. The search bar and venue list are hidden by default.  They are alternately
made visible or hidden again by clicking or tapping the tricolor Italian flag
button.

2. When an item in the list is selected, the search bar/venue list is
immediately hidden in case it would overlap the marker or info window.

3. The search bar/venue list is slightly transparent.

This project is organized in a Model-View-ModelView pattern created with
[Knockout](http://knockoutjs.com/).

#### To build the production version

There are two directories in the repository: `src` for development purposes
and `dist` for deployment on the web.  The former contains reader-friendly
code, while the latter has been optimized for better performance.

[Grunt](http://gruntjs.com/) is used to create the optimized code.

To build the optimized version from the source directory, follow these steps:

1. Grunt requires Node.js, so you may need to
[install it](https://nodejs.org/en/).

2. In the terminal, navigate to the root directory of the project and type

  `npm install`

  (This creates a new folder called `node_modules`.)

3. Install the Grunt command-line interface (Grunt CLI) with this command:

  `npm install -g grunt-cli`

4. Install the Grunt plug-ins used to build the project:

  ```
  npm install grunt-contrib-copy --save-dev
  npm install grunt-contrib-concat --save-dev
  npm install grunt-contrib-uglify --save-dev
  npm install grunt-usemin --save-dev
  npm install grunt-inline --save-dev
  npm install grunt-contrib-htmlmin --save-dev
  ```

5. Finally, type the following command into the terminal:

  `grunt build`

  This will run the Grunt plug-ins, creating the `dist` directory in the
  process (if it does not already exist).
