from __future__ import print_function
from sys import platform
from os import system
import WalabotAPI
from queue import Queue
from gi.repository import GLib
from threading import Thread

import mraa
import time
import sys
import urllib.request
import json

mraa.addSubplatform(mraa.GROVEPI,"0")
# serial port
port = "/dev/ttyACM0"

data_on = "1"
data_off = "0"

# initialise UART
uart = mraa.Uart(port)

class GlibNcsWorker:
  """ Ncs thread model implementation, for this sample we are just going to assume breathing is 1
  """
  def __init__(self, fx, graph, appsink, callback):
      self.running = True
      self.graph = graph
      self.updateq = Queue()
      self.callback = callback
      self.appsink = appsink
      self.fx = fx
      self.wlbt = WalabotAPI
      self.wlbt.Init()
      self.wlbt.SetSettingsFolder()
      self.isConnected = False
      self.isTargets = False
      self.distance=0
      self.faceid=0
      self.breathing=1
      self.unlock = 0
  def connect(self):
    try:
      self.wlbt.ConnectAny()
      self.isConnected = True
      self.wlbt.SetProfile(self.wlbt.PROF_SENSOR)
      self.wlbt.SetDynamicImageFilter(self.wlbt.FILTER_TYPE_MTI)
      self.wlbt.SetArenaTheta(-0.1, 0.1, 10)
      self.wlbt.SetArenaPhi(-0.1, 0.1, 10)
      self.wlbt.SetArenaR(100, 1000, 5)
      self.wlbt.SetThreshold(100)
    except self.wlbt.WalabotError as err:
      if err.code != 19:  # 'WALABOT_INSTRUMENT_NOT_FOUND'
         raise err
  def get_targets(self):
    self.wlbt.Trigger()
    return self.wlbt.GetSensorTargets()
  def input_thread(self):
    """ input thread function
    for getting frames from the video
    and loading them into Ncs
    """
    frame_number = 0
    while self.running:
      nb = self.appsink.get_sample()
      if nb is not None:                                    # TODO: eliminate busy looping before samples are available
        try:
          self.wlbt.Trigger()
          targets = self.wlbt.GetSensorTargets()
          if not targets:
            self.graph.LoadTensor(nb,"No Targets")
            self.distance=0
          else:
            d_min = min(targets, key=lambda t: t[2])[2] # closest target
            d_amp = max(targets, key=lambda t: t[3])[2] # "strongest" target
            if d_min == d_amp:
              self.graph.LoadTensor(nb,"THE DISTANCE IS {:3.0f}".format(d_min))
              if d_min >= 90 and d_min <= 110:
                self.distance=1
              else:
                self.distance=0
            else:
              self.graph.LoadTensor(nb,"CALCULATING...")
          data = urllib.request.urlopen("http://murmuring-bayou-68628.herokuapp.com/input?faceid=%s&distance=%s&breathing=%s" % (self.faceid, self.distance, self.breathing)).read()
          jsondata = json.loads(str(data, "utf-8"))
          #unlocking deadbolt here
          print(jsondata['alexa'])
          if jsondata['alexa'] == 1:
            if self.unlock == 0:
              print("unlocking deadbolt")
              uart.write(bytearray(data_on, 'utf-8'))
              self.unlock = 1
          else:
            if self.unlock == 1:
              print("locking deadbolt")
              uart.write(bytearray(data_off, 'utf-8'))
              self.unlock = 0
          frame_number=frame_number + 1
        except Exception as e:
          print("LoadTensor",e)
          pass
    # print("input done")

  def output_thread(self):
    """ output thread function
    for getting inference results from Ncs
    running graph specific post processing of inference result
    queuing the results for main thread callbacks
    """
    while self.running:
      try:
        out, cookie = self.graph.GetResult()
        self.updateq.put((self.appsink.postprocess(out), cookie))
        if float(out[0]) > 0.97:
          self.faceid=1
        else:
          self.faceid=0
        GLib.idle_add(self.update_ui)
      except Exception as e:
        print("GetResult",e)
        pass
    # print("output done")

  def update_ui(self):
    """ Dispatch callbacks with post processed inference results
    in the main thread context
    """
    while not self.updateq.empty():
      (out, cookie) = self.updateq.get()
      self.callback(cookie, out)
    return False

  def start(self):
    """ start threads and idle handler for callback dispatching
    """
    self.it = Thread(target = self.input_thread)
    self.it.start()
    self.ot = Thread(target = self.output_thread)
    self.ot.start()

    self.connect()
    if not self.isConnected:
       print("Not Connected")
    else:
       print("Connected")
    self.wlbt.Start()
  def stop(self):
    """ stop threads
    """
    self.wlbt.Stop()
    self.wlbt.Disconnect()
    self.running = False;
    self.it.join()
    self.ot.join()
