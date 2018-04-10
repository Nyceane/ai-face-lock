#!/usr/bin/env python3 
from __future__ import print_function # WalabotAPI works on both Python 2 an 3. 
from sys import platform 
from os import system 
from imp import load_source 
from os.path import join 
import time, random 
import math 
from collections import deque 
import urllib.request 
modulePath = join('/usr', 'share', 'walabot', 'python', 'WalabotAPI.py')      
wlbt = load_source('WalabotAPI', modulePath) 
wlbt.Init() 
start = time.time() 
class RealtimePlot: 
  def __init__(self, axes, max_entries =100): 
      self.axis_x = deque(maxlen=max_entries) 
      self.axis_y = deque(maxlen=max_entries) 
      self.axes = axes 
      self.max_entries = max_entries 
      self.lineplot, = axes.plot([], [], "ro-") 
      self.axes.set_autoscaley_on(True) 
  def add(self, x, y): 
      self.axis_x.append(x) 
      self.axis_y.append(y) 
      self.lineplot.set_data(self.axis_x, self.axis_y) 
      self.axes.set_xlim(self.axis_x[0], self.axis_x[-1] + 1e-15) 
      self.axes.set_ylim(0, 0.2) 
      self.axes.relim(); self.axes.autoscale_view() # rescale the y-axis 
  def animate(self, figure, callback, interval = 50): 
      import matplotlib.animation as animation 
      def wrapper(frame_index): 
          self.add(*callback(frame_index)) 
          self.axes.relim(); self.axes.autoscale_view() # rescale the y-axis 
          return self.lineplot 
      animation.FuncAnimation(figure, wrapper, interval=interval) 
def main(): 
  from matplotlib import pyplot as plt 
  # Walabot_SetArenaR - input parameters 
  minInCm, maxInCm, resInCm = 30, 150, 1 
  # Walabot_SetArenaTheta - input parameters 
  minIndegrees, maxIndegrees, resIndegrees = -4, 4, 2 
  # Walabot_SetArenaPhi - input parameters 
  minPhiInDegrees, maxPhiInDegrees, resPhiInDegrees = -4, 4, 2 
  # Configure Walabot database install location (for windows) 
  wlbt.SetSettingsFolder() 
  # 1) Connect : Establish communication with walabot. 
  wlbt.ConnectAny() 
  # 2) Configure: Set scan profile and arena 
  # Set Profile - to Sensor-Narrow. 
  wlbt.SetProfile(wlbt.PROF_SENSOR_NARROW) 
  # Setup arena - specify it by Cartesian coordinates. 
  wlbt.SetArenaR(minInCm, maxInCm, resInCm) 
  # Sets polar range and resolution of arena (parameters in degrees). 
  wlbt.SetArenaTheta(minIndegrees, maxIndegrees, resIndegrees) 
  # Sets azimuth range and resolution of arena.(parameters in degrees). 
  wlbt.SetArenaPhi(minPhiInDegrees, maxPhiInDegrees, resPhiInDegrees) 
  # Dynamic-imaging filter for the specific frequencies typical of breathing 
  wlbt.SetDynamicImageFilter(wlbt.FILTER_TYPE_DERIVATIVE) 
  # 3) Start: Start the system in preparation for scanning. 
  wlbt.Start() 
  fig, axes = plt.subplots() 
  display = RealtimePlot(axes) 
  display.animate(fig, lambda frame_index: (time.time() - start, random.random() * 100)) 
  #plt.show() 
  #fig, axes = plt.subplots() 
  #display = RealtimePlot(axes) 
  while True: 
      appStatus, calibrationProcess = wlbt.GetStatus() 
      # 5) Trigger: Scan(sense) according to profile and record signals 
      # to be available for processing and retrieval. 
      wlbt.Trigger() 
      # 6) Get action: retrieve the last completed triggered recording 
      energy = wlbt.GetImageEnergy() 
      display.add(time.time() - start, energy * 100) 
      #This is just for prototype purposes, we will gather the data in bulk and send them to the server in the future 
      plt.pause(0.001) 
if __name__ == "__main__": main() 
