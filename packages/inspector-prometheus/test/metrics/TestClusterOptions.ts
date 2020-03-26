import 'reflect-metadata'
import 'source-map-support/register'

import * as cluster from 'cluster'

import { EventEmitter } from 'events'
import { SinonSpy, spy } from 'sinon'
import { PrometheusClusterOptions } from '../../lib/metrics'

export class TestClusterOptions implements PrometheusClusterOptions<cluster.Worker> {
  public enabled: boolean;
  public sendMetricsToMaster: boolean;
  public workerResponseTimeout: number;
  public eventReceiver: EventEmitter;
  public getWorkers: () => Promise<cluster.Worker[]>;
  public sendToMaster: (message: any) => Promise<any>;
  public sendToWorker: (worker: cluster.Worker, message: any) => Promise<any>;
  public eventReceiverOnSpy: SinonSpy;
  public getWorkersSpy: SinonSpy;
  public sendToMasterSpy: SinonSpy;
  public sendToWorkerSpy: SinonSpy;
  public workers: cluster.Worker[];

  public constructor (enabled: boolean,
    sendMetricsToMaster: boolean,
    workers: cluster.Worker[],
    workerResponseTimeout: number = 10) {
    this.enabled = enabled
    this.sendMetricsToMaster = sendMetricsToMaster
    this.workerResponseTimeout = workerResponseTimeout
    this.workers = workers

    this.eventReceiver = new EventEmitter()
    this.eventReceiverOnSpy = spy(this.eventReceiver.on)
    this.eventReceiver.on = this.eventReceiverOnSpy

    this.sendToMaster = async () => { }
    this.sendToMasterSpy = spy(this.sendToMaster)
    this.sendToMaster = this.sendToMasterSpy

    this.sendToWorker = async () => { }
    this.sendToWorkerSpy = spy(this.sendToWorker)
    this.sendToWorker = this.sendToWorkerSpy

    this.getWorkers = async () => this.workers
    this.getWorkersSpy = spy(this.getWorkers)
    this.getWorkers = this.getWorkersSpy
  }
}
