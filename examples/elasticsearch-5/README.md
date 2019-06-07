# elasticsearch-5

Example project showing the usage of [inspector-metrics](https://github.com/rstiller/inspector-metrics) and [inspector-elasticsearch](https://github.com/rstiller/inspector-metrics/tree/master/packages/inspector-elasticsearch) with [elasticsearch client](https://www.npmjs.com/package/@elastic/elasticsearch) version 5.

This examples demonstrates the basic setup and   
how to report common nodeVM stats alongside metric events.

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
   examples/elasticsearch-5/run.sh --compile # method one: compiles the lib and starts the application
   # or
   node examples/elasticsearch-5/ # method two: starts the application
   ```
1. view graphs of the example application  
   1. navigate to [local grafana](http://localhost:3000)
   1. click on the `Home` button in the upper left corner
   1. choose the `elasticsearch-5` folder and see all dashboards for this example application

## License

[MIT](https://www.opensource.org/licenses/mit-license.php)
