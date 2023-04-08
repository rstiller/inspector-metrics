# influxdb-1.x

Example project showing the usage of [inspector-metrics](https://github.com/rstiller/inspector-metrics) and [inspector-influx](https://github.com/rstiller/inspector-metrics/tree/main/packages/inspector-influx) with [node-influxdb client](https://www.npmjs.com/package/influx) version 5.x (influxdb 1.x).

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
   examples/influxdb-1x/run.sh --compile # method one: compiles the lib and starts the application
   # or
   node examples/influxdb-1x/ # method two: starts the application
   ```
1. view graphs of the example application  
   1. navigate to [local grafana](http://localhost:3000)
   1. click on the `Home` button in the upper left corner
   1. choose the `influxdb-1x` folder and see all dashboards for this example application

## License

[MIT](https://www.opensource.org/licenses/mit-license.php)
