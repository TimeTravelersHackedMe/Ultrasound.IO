PharmaSonic
===========
This project is a website bridges the gap between the Arduino and a Tektronix oscilloscope. It was (and still is) a senior design project that entails building a device that can test pharmaceutical tablets with ultrasound - hence the name PharmaSonic. The project utilizes technology from:

+ [BreakoutJS](http://breakoutjs.com/) (Arduino USB-to-websocket client and Javascript library)
+ [HighchartJS](http://www.highcharts.com/) (data-visualization) 
+ [Tektronix API](http://www.tek.com/) (for oscilloscope connectivity - this is *the first open-source project* to do this via AJAX) 
+ [jQuery](http://jquery.com/) (for user experience)
+ [Bootstrap](http://getbootstrap.com/) (for style)
+ [fft.js](https://github.com/jensnockert/fft.js) (a Fourier Transform library for frequency analysis).

Right now all the **Arduino connectivity features are complete**. Users can control stepper motors from a web GUI that allows them to define the angular velocity and acceleration of a stepper motor. It also allows the user to control two pins on the Arduino using PWM (Pulse Width Modulation). On top of that, the web interface allows real-time monitoring of two different pin voltages.

For now, the **Tektronix API interface is currently hardcoded to take a 100,000 point spectral envelopes** through concatenation. This encompasses over **5 million data points** since the envelopes represent the minimum and maximum value over 512 sample pulses. This is done in less than a minute.
## Background
The pharmaceutical sector is expressing an increasing interest in modern non-destructive testing techniques. They are using new technologies and materials that require strict quality control. One such method that is quick, safe, and reliable involves using ultrasound transducers to find the speed of sound in a pharmaceutical tablet. The speed of sound can be related to important material properties called elastic constants. Using the relationships that these elastic constants represent, important material properties such as weight, thickness, and hardness can be calculated.
## Problem
Create an off-the-line pill tester that can test pharmaceutical tablets for weight, thickness, and hardness. Using two sets of ultrasound transducers (one that emits shear wave sound and one that emits longitudinal wave sound), we can get two different elastic modulus. With two different elastic modulus, we can calculate all five of them. From there, the rest should be cake... (assuming an isotropic homogeneous medium bla bla)
## Arduino
Okay, on to the project details. One thing this website does is control an Arduino prototype (pictures and video to come). The Arduino interfaces with a stepper motor, two solenoid, and two pressure sensors. The user downloads and runs the BreakoutJS program and that connects the Arduino to a websocket. The websocket is then controlled through simple jQuery (seen in this project). The data and controls are then presented to the user using Bootstrap, some more jQuery, and Highcharts (a data visualization Javascript library).
## Tektronix
The piezoelectric ultrasound transducers are driven using a square wave pulser (possibly tuned to a resonant state by someone before me). The analog signal is then converted into a digital signal by a Tektronix oscilloscope (TDS3000). Using the Tektronix API and networking the computer that is running BreakoutJS (and the web server) into a local private network, data is extracted. The website can interpret both pulses and spectral envelopes. It also includes an algorithm that generates the highest possible resolution signal by zooming in, collecting the data, and then zooming into the next appropriate data collection region.
## More About the Prototype
+ Stepper motor uses an acceleration ramping profile to maintain adaquete torque and decrease the time it takes the prototype to successfully maneuver the tablets
+ Stepper motor provides high resolution turning accuracy along with high torque using a 200-step 2A/coil step motor that is driven with a Pololu DRV8825 which provides 32 microsteps per step
+ The force that the solenoid exerts is controlled by pulse-width modulation (e.g. 50% on, 50% off at a high frequency)
+ Force sensors (strain gauges) are connected using integrated circuits that eliminate the need for complex op-amps (TI INA125P)

## Instructions
#### Windows

1. Install WAMP
2. Download this repo
3. Copy/paste all files to the WAMP www directory (C:/wamp/www by default)
4. Open the browser and go to http://localhost
5. Download and open BreakoutJS for Windows
6. Connect your Arduino over USB with the BreakoutJS application
7. Set up a local network with the oscilloscope

#### Linux
Debian-based distributions:

1. Enter sudo apt-get install -y git apache2 php5 && cd /var/www && git clone THISREPOURL . in the terminal
2. Open the browser and go to http://localhost

Red Hat Enterprise Linux based distributions:

1. Enter sudo yum install -y apache2 git php5 && cd /var/www && git clone THISREPO . in the terminal
2. Open the browser and go to http://localhost

#### Mac

1. Anyone know how to download and launch a PHP web server on a Mac?
2. Let me know.

## Issues
+ Connectivity to the oscilloscope is established using AJAX calls in Javascript - older versions of the TDS3000 that do not add "Allow Cross Origin: *" into their HTTP header will not be able to connect to the website unless the web browser is run with security features off
+ Tektronix options are not complete (right now it is hard coded to take a 100,000 point spectral envelope)

## Future Features
These are features I plan on implementing before I finish my stay at Rutgers:
+ Ability to download data as a CSV (this will require hosting the website on a host that requires PHP)
+ Upload oscilloscope settings file/download oscilloscope settings file
+ Magic button that combines all the features into a 5-10 second demonstration
+ Configure discrete fourier transform properly

Features that I would want to implement if this was my job:
+ Recompile BreakoutJS executable to include connectivity with the Tektronix API
+ Integrate with Digital Ocean API to spin up 32-server instance and run data through R for computing (Seewave in particular)
+ Add encrypted tunnel for secure internet control
