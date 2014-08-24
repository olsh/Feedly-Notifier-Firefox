Feedly-Notifier-Firefox
=======================

**Description**

Firefox extension for reading news from rss aggregator [Feedly](http://www.feedly.com)

**How to build sandbox version**

 The sandbox version is for development purpose only.

 1. Install [node.js](http://nodejs.org/) and [Python 2.x](https://www.python.org/).  
 
 2. Install grunt-cli globally  
 ```
 npm install -g grunt-cli
 ```
 
 3. Clone the repo 
 ```
 git clone https://github.com/olsh/Feedly-Notifier.git
 ```
 
 4. Go to the cloned directory and update submodules
 ```cd Feedly-Notifier-Firefox
 git submodule init
 git submodule update
 ```
 
 5. Install dependencies  
 ```
 npm install
 ```
 
 6. Get a client ID and a client secret from [here](https://groups.google.com/forum/#!topic/feedly-cloud/R0SEcJ5F8Oc).
 
 7. Run the next grunt task
 ```
grunt sandbox --clientId=xxx --clientSecret=xxx
 ```
 where xxx data from the previous step. 

**Changelog**

Changelog can be found [here](http://olsh.github.io/Feedly-Notifier/changelog/firefox/).

**Credits**

This addon is using source code of [Geo Mealer](https://github.com/geoelectric)'s [RSS Handler for Feedly](https://github.com/geoelectric/firefox-feedly-rss).