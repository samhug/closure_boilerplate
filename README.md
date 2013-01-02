[Google Closure/AppEngine Boilerplate](https://github.com/samuelhug/closure_boilerplate)
========================
<br>

### Project Description
    The project provides boilerplate code and a build system to accelerate development of large scale web applications.

### Instructions
- Ensure the following dependencies are installed:
    - python-dev
    - libxml2-dev
    - libxslt1-dev

            In Ubuntu this can be achieved by running:
        `sudo apt-get install python-dev libxml2-dev libxslt1-dev`

- Execute the following command to setup the environment:
    `$ ./bootstrap.sh`

- Building:
    `$ ./waf configure build`

- Building in produection mode:
    `$ ./waf configure build --mode=production`

- Deploying:
    `$ ./waf configure build --mode=production`
    `$ ./waf deploy`

- Cleaning Up:
    `$ ./waf clean`
    or
    `$ ./waf distclean`
