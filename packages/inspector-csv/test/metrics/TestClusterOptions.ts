/* eslint-env mocha */

import 'reflect-metadata'
import 'source-map-support/register'

import {
  Worker
} from 'cluster'

import { EventEmitter } from 'events'
import { ClusterOptions } from 'inspector-metrics'
import { SinonSpy, spy } from 'sinon'

export class TestClusterOptions implements ClusterOptions<Worker> {
  public enabled: boolean;
  public sendMetricsToMaster: boolean;
  public eventReceiver: EventEmitter;
  public getWorkers: () => Promise<Worker[]>;
  public sendToMaster: (message: any) => Promise<any>;
  public sendToWorker: (worker: Worker, message: any) => Promise<any>;
  public eventReceiverOnSpy: SinonSpy;
  public getWorkersSpy: SinonSpy;
  public sendToMasterSpy: SinonSpy;
  public sendToWorkerSpy: SinonSpy;
  public workers: Worker[];

  public constructor (
    enabled: boolean,
    sendMetricsToMaster: boolean,
    workers: Worker[]
  ) {
    this.enabled = enabled
    this.sendMetricsToMaster = sendMetricsToMaster
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
