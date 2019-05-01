# express4-multi-process-js

Example project in pure javascript showing the usage of [inspector-metrics](https://github.com/rstiller/inspector-metrics) in a multi-process express 4 application.

## How to run

1. start the test-environment
   ```bash
   cd <project-path>/
   test-env/reset.sh # optional - erases the entire test-env
   test-env/boot.sh
   ```
1. compile the library
   ```bash
   cd <project-path>/
   npm i
   npm run bootstrap
   npm run build
   ```
1. start the example application
   ```bash
   cd <project-path>/
   examples/express4-multi-process-js/run.sh # method one: compiles the lib and starts the application
   # or
   node examples/express4-multi-process-js/ # method two: starts the application
   ```
1. view graphs of the example application  
   1. navigate to [local grafana](http://localhost:3000)
   1. click on the `Home` button in the upper left corner
   1. choose the `express4-multi-process-js` folder and see all dashboards for this example application

## License

[MIT](https://www.opensource.org/licenses/mit-license.php)
