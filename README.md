# Compilation

The directory src/ contains the source code for the spectral-sequences module.
This is compiled into bundle.js, which is what you should include into your
webpage.

To install dependencies for compilation, run 
```
 $ npm install
```
This only has to be done once. Afterwards, to compile the source code into
bundle.js, run
```
 $ npm run build
```
# Running

Due to CORS restrictions, opening an file directly in a browser is unlikely to
succeed. Instead, you should run a web server that serves the directory and
then access localhost. To do so, navigate into the directory containing the
source code, and run one of the following two commans:
```
 $ python3 -m http.server 8080
 $ npx http-server
```
Afterwards, direct your browser to http://localhost:8080/
