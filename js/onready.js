$(document).ready(function() {
    var AJAXCommands = "Command=FACTORY\nCommand=BEL\nCommand=ALIAS ON\nCommand=HEADER OFF\nCommand=SELECT:CH2 ON\nCommand=CH2:SCALE 1.0E0\nCommand=CH2:INVERT ON\nCommand=CH2:BANDWIDTH FULL\nCommand=CH2:IMPEDANCE FIFTY\nCommand=HORIZONTAL:MAIN:SCALE 5E-6\nCommand=HORIZONTAL:DELAY:TIME 1.9E-5\nCommand=TRIGGER:A:MODE NORMAL\nCommand=TRIGGER:A:TYPE PULSE\nCommand=TRIGGER:A:PULSE:SOURCE CH2\nCommand=TRIGger:A:PULSE:CLASS WIDTH\nCommand=TRIGGER:A:PULSE:WIDTH:POLARITY POSITIVE\nCommand=TRIGGER:A:PULSE:WIDTH:WHEN MORETHAN\nCommand=TRIGGER:A:PULSE:WIDTH:WIDTH 13.2E-7\nCommand=TRIGGER:A:SETLEVEL\nCommand=DATA:WIDTH 2\nCommand=DATA:ENCDG ASCII\nCommand=ACQUIRE:MODE AVERAGE\nCommand=ACQUIRE:NUMAVG 4\nCommand=ACQuire:STOPAfter RUNSTOP\nCommand=SELECT:CH1 ON\nCommand=DISPLAY:INTENSITY:WAVEFORM 50\nCommand=CH1:COUPLING DC\nCommand=CH1:IMPEDANCE FIFTY\nCommand=CLEARMenu\nCommand=SAVE:SETUP 9\n";
    $.ajax({
        url: 'http://192.168.1.1/?',
        type: 'post',
        dataType: 'text',
        processData: false,
        data: AJAXCommands
    });
    var AcquiredSeriesOptions = [];
    var seriesOptions = [];
    var freqOptions = [];
    var colors = Highcharts.getOptions().colors;
    var selectedXpoint = 0;
    var selectedYpoint = 0;
    var importChartDataCount = 0;
    var selectedChart;
    var AcquiredSeriesCounter = 0;
    var mods;

    function importChartData() {
        var seriesCounter = 0;
        $.get("scan.php", function(data) {
            var names = (data.substring(0, data.length - 1)).split(',');
            $.each(names, function(i, name) {
                $.get(name, function(data) {
                    name = name.substring(10, name.length - 4);
                    data = data.split('\r\n');
                    var numbPoints = parseInt(data.splice(0, 1));
                    var pointInterval = parseFloat(data.splice(0, 1) * Math.pow(10, 10));
                    data.splice(0, 1);
                    data.splice(0, 1);
                    data.splice(numbPoints, 1);
                    data.splice(numbPoints, 1);
                    //alert(typeof eval("FloatedArray" + i));
                    //var FloatedArray = new Float64Array(numbPoints);
                    data = $.map(data, function(value) {
                        return parseFloat(value);
                    });
                    var fft = new FFT.complex(100, true);
                    var output = [];
                    var input = data;
                    fft.simple(output, input, 'complex');
                    freqOptions[i] = {
                        name: name,
                        type: 'areaspline',
                        data: output,
                        pointInterval: 1
                    };
                    seriesOptions[i] = {
                        name: name,
                        type: 'spline',
                        data: data,
                        pointInterval: pointInterval
                    };
                    seriesCounter++;
                    if (seriesCounter == names.length) {
                        // add acquired waveforms 
                        $.each(AcquiredSeriesOptions, function(j) {
                            seriesOptions[j + seriesCounter] = AcquiredSeriesOptions[j];
                        })
                        createChart();
                    };
                });
            });
        });
    };

    var hasPlotLine = 0;
    // create the chart when all data is loaded
    function createChart() {
        function createAxisLine(value) {
            AnalyzeChart = ($('#ushighchart').highcharts());
            var grabber = AnalyzeChart.xAxis[0];
            if (hasPlotLine != 0) {
                grabber.removePlotLine('plot-line-1');
            }
            grabber.addPlotLine({
                value: value,
                color: '#C0C0C0',
                width: 1,
                id: 'plot-line-1'
            });
            hasPlotLine++;
        };

        $('#ushighchart').highcharts('StockChart', {
            chart: {
                zoomType: 'x',
                height: 500,
                renderTo: '#ushighchart'
            },
            legend: {
                enabled: true
            },
            rangeSelector: {
                enabled: false
            },
            title: {
                text: 'Time Domain',
                style: {
                    color: '#333333',
                    fontSize: '14px',
                    fontFamily: 'Helvetica',
                    fontWeight: 'bold'
                }
            },
            xAxis: {
                type: 'datetime',
                title: {
                    enabled: true,
                    text: 'Time (microseconds)'
                },
                labels: {
                    formatter: function() {
                        var d = new Date(this.value);
                        return d.getSeconds() + '.' + d.getMilliseconds();
                    }
                },
                /*formatter: function () {
                    return Highcharts.dateFormat('%S.%L', this.value);*/
            },
            yAxis: [{ // Primary yAxis
                labels: {
                    format: '{value}mV',
                    style: {
                        color: '#444444'
                    }
                },
                title: {
                    text: 'Voltage (millivolts)',
                    style: {
                        color: '#444444'
                    }
                }
            }],
            tooltip: {
                shared: true,
                crosshairs: true,
                useHTML: true,
                formatter: function() {
                    var s = '<table style="font-family: Courier New"><tr style="text-align: center;"><th></th><th><strong>Current</strong></th>';
                    if (selectedXpoint != 0) {
                        s += '<th style="min-width: 100px;"><strong>&#916;<sub>Ref. Point</sub></strong></th></tr><tr><th>Time:</th><th style="text-align: right; min-width: 100px;">' + this.x.toFixed(3) + '&micro;s</b></th>';
                    } else {
                        s += '<th></th></tr><tr><th>Time:</th><th style="text-align: right; min-width: 100px;">' + this.x.toFixed(3) + '&micro;s</b></th>';
                    }
                    if (selectedXpoint != 0) {
                        s += '<th style="text-align: right;">' + (this.x - selectedXpoint).toFixed(3) + '&micro;s</th></tr>';
                    } else {
                        s += '<th></th></tr>';
                    }
                    $.each(this.points, function(i, point) {
                        s += '<tr><td style="color: ' + point.series.color + '">' + point.series.name + ':</td><td style="text-align: right;">' +
                            point.y.toExponential(6) + 'mV</td>';
                        if (selectedYpoint != 0) {
                            var data = parseFloat(this.y / selectedYpoint) * 100;
                            if ((data > 10000) || (data < (-10000))) {
                                data = (data).toExponential(2);
                            } else {
                                data = (data).toFixed(2);
                            }
                            s += '<td style="text-align: right;">' + data + '%</td></tr>';
                        } else {
                            s += '<td></td></tr>';
                        }
                    });
                    s += '</table>';
                    return s;
                },
            },
            credits: {
                enabled: false
            },



            series: seriesOptions,
            plotOptions: {
                series: {
                    allowPointSelect: true,
                    lineWidth: 2,
                    marker: {
                        enabled: true,
                        radius: 3,
                        states: {
                            select: {
                                radius: 8,
                                lineWidth: 1,
                                lineColor: '#C0C0C0',
                                fillColor: null,
                            },
                            hover: {
                                radius: 6
                            }
                        }
                    },
                    point: {
                        events: {
                            select: function() {
                                selectedXaxis = this.x;
                                selectedChart = this.Chart;
                                selectedXpoint = parseFloat(this.x);
                                selectedYpoint = parseFloat(this.y);
                                createAxisLine(selectedXaxis);
                            }
                        }
                    },
                },

            },
        });
    };

    function createFreqChart() {

        $('#freqchart').highcharts({
            chart: {
                zoomType: 'x',
                height: 500,
                renderTo: '#freqchart'
            },
            legend: {
                enabled: true
            },
            rangeSelector: {
                enabled: false
            },
            title: {
                text: 'Frequency Domain',
                style: {
                    color: '#333333',
                    fontSize: '14px',
                    fontFamily: 'Helvetica',
                    fontWeight: 'bold'
                }
            },
            xAxis: {
                type: 'datetime',
                title: {
                    enabled: true,
                    text: 'Frequency (Hertz)'
                },
                labels: {
                    formatter: function() {
                        var d = new Date(this.value);
                        return d.getSeconds() + '.' + d.getMilliseconds();
                    }
                },
                /*formatter: function () {
                    return Highcharts.dateFormat('%S.%L', this.value);*/
            },
            yAxis: { // Primary yAxis
                labels: {
                    format: '{value}dB',
                    style: {
                        color: '#444444'
                    }
                },
                title: {
                    text: 'Decibals (dB)',
                    style: {
                        color: '#444444'
                    }
                }
            },
            credits: {
                enabled: false
            },



            series: freqOptions,
        })
    }

    var IOBoard = BO.IOBoard;
    var IOBoardEvent = BO.IOBoardEvent;
    var PinEvent = BO.PinEvent;
    var Pin = BO.Pin;
    var Event = JSUTILS.Event;
    var Stepper = BO.io.Stepper;
    var Oscillator = BO.generators.Oscillator;
    var SignalScope = JSUTILS.SignalScope;

    var host = window.location.hostname;
    if (window.location.protocol.indexOf("file:") === 0) {
        host = "localhost";
    }
    var arduino = new IOBoard(host, 8887);
    arduino.addEventListener(IOBoardEvent.READY, onReady);

    var numMicroSteps = 32;
    var numSteps = 200 * numMicroSteps;
    var speed = 10.0; // rad/sec
    var acceleration = 20.0; // rad/sec^2
    var deceleration = 20.0; // rad/sec^2
    var rpmPerRadSec = 9.55; // 1 rad/sec = 9.55 rpm
    var stepper;
    var StepperToggle;
    var ThirtyTwoStepToggle;
    var StepperRESET;
    var StartTime;
    var EndTime;
    var aPWM;
    var bPWM;
    var aPWMPin;
    var bPWMPin;
    var FFsensor;
    var CurrentA;
    var CurrentB;
    var rotateAdjust;
    var FFvalue = 0;
    var currentOSC;
    //var currentWave = Oscillator.SQUARE;
    var freq = 1.0;
    var OscilloscopeScreen;
    var ScreenFix = 0;
    //var scope = new SignalScope("scope1", 200, 100, 0, 1);  

    function onReady(event) {
        arduino.removeEventListener(IOBoardEvent.READY, onReady);

        arduino.setDigitalPinMode(7, Pin.DOUT); // SLEEP
        StepperToggle = arduino.getDigitalPin(7);
        StepperToggle.value = Pin.HIGH;
        arduino.setDigitalPinMode(10, Pin.DOUT);
        ThirtyTwoStepToggle = arduino.getDigitalPin(10);
        ThirtyTwoStepToggle.value = Pin.HIGH;
        arduino.setDigitalPinMode(4, Pin.DOUT); // RESET
        StepperRESET = arduino.getDigitalPin(4);
        StepperRESET.value = Pin.HIGH;
        arduino.setDigitalPinMode(6, Pin.DOUT); // ENABLE
        StepperEnable = arduino.getDigitalPin(6);
        StepperEnable.value = Pin.HIGH;
        arduino.setDigitalPinMode(11, Pin.PWM);
        arduino.setDigitalPinMode(3, Pin.PWM);
        bPWMPin = arduino.getDigitalPin(11);
        aPWMPin = arduino.getDigitalPin(3);
        aPWMPin.value = 0;
        bPWMPin.value = 0;
        arduino.enableAnalogPin(2);
        FFsensor = arduino.getAnalogPin(2);
        //arduino.enableAnalogPin(0);
        //CurrentA = arduino.getAnalogPin(0);
        //CurrentA.addEventListener(PinEvent.CHANGE, CurrentAonChange);
        //arduino.enableAnalogPin(1);
        //CurrentB = arduino.getAnalogPin(1);
        //CurrentB.addEventListener(PinEvent.CHANGE, CurrentBonChange);
        FFsensor.addEventListener(PinEvent.CHANGE, FFonChange);
        stepper = new Stepper(arduino,
            Stepper.DRIVER,
            1600,
            arduino.getDigitalPin(8),
            arduino.getDigitalPin(9));
        stepper.addEventListener(Event.COMPLETE, onStepperComplete);
        animate();

    }

    function CurrentAonChange(evt) {
        $('th#ChannelACurrent').html('<strong>' + (CurrentA.value / 1.65).toFixed(2) + 'A</strong>');
    }

    function CurrentBonChange(evt) {
        $('th#ChannelBCurrent').html('<strong>' + (CurrentB.value / 1.65).toFixed(2) + 'A</strong>');
    }

    function FFonChange(evt) {
        // The potentiometer gives back a value between 0 and 1.0
        //FFValue = (evt.target.value * 100);
        //$('th#ffvalue').html('<strong>' + (FFValue / 20).toFixed(1) + 'V</strong>');
    }
    /*		function addGenerator() {
    			// create a new generator
    			currentOSC = new Oscillator(currentWave, freq);
    			// add the oscillator to the pin
    			aPWMPin.addGenerator(currentOSC);
    			// start the generator
    			currentOSC.start();
    			}*/
    function animate() {

        //scope.update(aPWMPin.value);

        //requestAnimFrame(animate);
    }

    function FFGetData() {
        //return FFValue;
    }
    var SpeedChange = function() {
        speed = StepperSpeed.getValue();
        $('div#stepSpeed').html('Speed (rad/sec): <strong>' + (StepperSpeed.getValue()).toFixed(1) + ' (' + (speed * rpmPerRadSec).toFixed(2) + 'RPM)</strong>');
    };
    var AccelChange = function() {
        acceleration = StepperAccel.getValue();
        $('div#accel').html('Acceleration (rad/sec<sup>2</sup>): <strong>' + acceleration.toFixed(1) + '</strong>');
    };
    var DecelChange = function() {
        deceleration = StepperDecel.getValue();
        $('div#decel').html('Deceleration (rad/sec<sup>2</sup>): <strong>' + deceleration.toFixed(1) + '</strong>');
    };
    var ChannelAChange = function() {
        aPWM = ChannelAPWM.getValue();
        ChannelAPWM.setValue(aPWM);
        aPWMPin.value = (aPWM - 255) / -255;
        if (aPWM.toFixed(0) == 255) {
            $('th#solenoidavalue').html('<strong>N/A</strong>');
        } else {
            $('th#solenoidavalue').html('<strong>' + ((aPWM - 255) * -100 / 255).toFixed(0) + '%</strong>');
        }

    };
    var ChannelBChange = function() {
        bPWM = ChannelBPWM.getValue();
        ChannelBPWM.setValue(bPWM);
        bPWMPin.value = (bPWM - 255) / -255;
        if (bPWM.toFixed(0) == 255) {
            $('th#solenoidbvalue').html('<strong>N/A</strong>');
        } else {
            $('th#solenoidbvalue').html('<strong>' + ((bPWM - 255) * -100 / 255).toFixed(0) + '%</strong>');
        }
    };

    var StepperSpeed = $('#sl1').slider({
            min: 0.1,
            max: 50,
            step: 0.1,
            value: 10.0,
            tooltip: 'hide'
        })
        .on('slide', SpeedChange)
        .data('slider');
    var StepperAccel = $('#sl2').slider({
            min: 0,
            max: 100,
            step: 0.1,
            value: 20.0,
            tooltip: 'hide'
        })
        .on('slide', AccelChange)
        .data('slider');
    var StepperDecel = $('#sl3').slider({
            min: 0,
            max: 100,
            step: 0.1,
            value: 20.0,
            tooltip: 'hide'
        })
        .on('slide', DecelChange)
        .data('slider');
    var ChannelAPWM = $('#sl4').slider({
            min: 0,
            max: 255,
            step: 1,
            value: 255,
            tooltip: 'show',
            handle: 'square',
            orientation: 'vertical',
            selection: 'after',
            formater: function(value) {
                return ((value - 255) * -100 / 255).toFixed(0) + '% Duty Cycle';
            }
        })
        .on('slide', ChannelAChange)
        .data('slider');
    var ChannelBPWM = $('#sl5').slider({
            min: 0,
            max: 255,
            step: 1,
            value: 255,
            tooltip: 'show',
            handle: 'square',
            orientation: 'vertical',
            selection: 'after',
            formater: function(value) {
                return ((value - 255) * -100 / 255).toFixed(0) + '% Duty Cycle';
            }
        })
        .on('slide', ChannelBChange)
        .data('slider');
    $('#stepperstart').click(function() {
        // acceleration and deceleration are optional parameters
        if (numSteps == 0) {
            $('#stepperstart').popover('show')
        } else {
            $('#stepperstart').popover('destroy');
            $('#stepperstart').button('loading');
            $('#buttondropdown').html('<button id="stepperstartdropdown" class="btn dropdown-toggle" disabled>');
            if (acceleration > 0 && deceleration > 0) {
                // set the number of steps, speed and accel and decel parameters
                StepperEnable.value = Pin.LOW;
                setTimeout(function() {
                    StartTime = new Date().getTime();
                    stepper.step(numSteps, speed, acceleration, deceleration);
                }, 100);
            } else {
                // set the number of steps and speed (accel and decel are optional)
                StepperEnable.value = Pin.LOW;
                setTimeout(function() {
                    stepper.step(numSteps, speed);
                    StartTime = new Date().getTime();
                }, 20); //main loop runs every 19ms
            }
        }
    });
    var CurrentWaveform;
    $('#takereadingbtn').click(function() {
        $.ajax({
            url: "http://192.168.1.1/?command=WAVFRM?&gpibsend=Send",
            type: "post",
            dataType: "html",
            data: {
                command: "WAVFRM?",
                gpibsend: "Send"
            },
            dataFilter: function(response) {
                response = response.split(';');
                response.splice(0, 8);
                response.splice(1, 1);
                return response;
            },
            success: function(data) {
                CurrentWaveform = data;
            }

        });

    });
    var RecordLength;
    var HorizontalDelay;
    // This is where I'm processing the data..
    function AJAXthePoints(StartPoint, FinishPoint) {
        var StartWave = Math.floor(StartPoint / 10000);
        var FinishWave = Math.ceil(FinishPoint / 10000);
        var WaveToStart = "WAVE" + StartWave.toString();
        var NewDelay = HorizontalDelay + RecordLength * StartWave;
        if ((FinishWave - StartWave) == 0) {
            return;
        }
        var AJAXCommands = "Command=BEL\nCommand=HORIZONTAL:DELAY:TIME " + NewDelay + "\nCommand=ACQUIRE:STATE ON\nCommand=*WAI\nCommand=CURVE?\n";
        $.ajax({
            url: "http://192.168.1.1/?",
            type: "post",
            dataType: "text",
            processData: false,
            data: AJAXCommands,
            dataFilter: function(response) {
                response = response.slice(0, response.lastIndexOf("HTTP/1.1"));
                return response;
            },
            success: function(data) {
                CurrentWaveform[9] = CurrentWaveform[9] + "," + data;
                AJAXthePoints((StartPoint + parseFloat(CurrentWaveform[0])), FinishPoint);
            }
        });
    }
    $('#takereadingbtn2').click(function() {
        var TakeReadingCommands = "Command=BEL\nCommand=SAVE:SETUP 10\nCommand=HORIZONTAL:MAIN:SCALE 2E-7\nCommand=HORIZONTAL:DELAY:TIME 8.0E-7\nCommand=ACQuire:STOPAfter SEQUENCE\nCommand=ACQUIRE:MODE ENVELOPE\nCommand=ACQuire:NUMEnv 64\nCommand=DATa:SOUrce CH1\nCommand=ACQUIRE:STATE ON\nCommand=*WAI\nCommand=WAVFRM?\n";
        $.ajax({
            url: "http://192.168.1.1/?",
            type: "post",
            dataType: "text",
            data: TakeReadingCommands,
            dataFilter: function(response) {
                response = response.slice(0, response.lastIndexOf("HTTP/1.1"));
                response = response.split(';');
                response.splice(0, 5);
                response.splice(1, 1);
                response.splice(3, 1);
                return response;
            },
            success: function(data) {
                CurrentWaveform = data;
                RecordLength = parseFloat(CurrentWaveform[0]) * parseFloat(CurrentWaveform[2]);
                HorizontalDelay = parseFloat(CurrentWaveform[3]) + RecordLength / 2;
                AJAXthePoints(10001, 80000);
            }

        });
    });

    $('#rotate90').click(function() {
        $('#stepperstart').button('loading');
        rotateAdjust = 1;
        StepperEnable.value = Pin.LOW;
        setTimeout(function() {
            stepper.step(1760, speed, acceleration, deceleration);
            StartTime = new Date().getTime();
        }, 20);
    });
    $('#rotate180').click(function() {
        $('#stepperstart').button('loading');
        rotateAdjust = 1;
        setTimeout(function() {
            stepper.step(3360, speed, acceleration, deceleration);
            StartTime = new Date().getTime();
        }, 20);
    });
    $('#rotateneg90').click(function() {
        $('#stepperstart').button('loading');
        rotateAdjust = 4;
        setTimeout(function() {
            stepper.step(-1760, speed, acceleration, deceleration);
            StartTime = new Date().getTime();
        }, 20);
    });
    $('#move1cw').click(function() {
        $('#stepperstart').button('loading');
        rotateAdjust = 3;
        setTimeout(function() {
            stepper.step(176, 4.0);
            StartTime = new Date().getTime();
        }, 20);
    });
    $('#move1ccw').click(function() {
        $('#stepperstart').button('loading');
        rotateAdjust = 2;
        setTimeout(function() {
            stepper.step(-176, 4.0);
            StartTime = new Date().getTime();
        }, 20);
    });
    $('#disablestepperbtn').click(function() {
        StepperEnable.value = Pin.HIGH;
    });
    var AnalyzeCount = 0;
    $('#analyzeid').click(function() {
        $('#controlpanel').css('display', 'none');
        $('#controlid').removeClass("active");
        $('#analyzeid').addClass("active");
        $('#analyzepanel').css('display', 'block');
        if (AnalyzeCount == 0) {
            importChartData();
        } else {
            AnalyzeChart = $('#ushighchart').highcharts();
            AnalyzeChart.redraw();
        };
        AnalyzeCount++;
    });
    $('#controlid').click(function() {
        $('#controlpanel').css('display', 'block');
        $('#controlid').addClass("active");
        $('#automatepanel').css('display', 'none');
        $('#automateid').removeClass('active');
        $('#analyzeid').removeClass("active");
        $('#analyzepanel').css('display', 'none');

    });
    $('#screenshotrefresh').click(function() {
        $('#screenshotiframe').attr('src', $('#screenshotiframe').attr('src'));
        /*var OscilloscopeScreen = setInterval(function(){*/
        $('div#screenshotiframediv').html('<iframe id="screenshotiframe" src="http://192.168.1.1/image.png?N="' + ScreenFix + 'scrolling="no" style="width: 640px; height: 480px;border: 0px;padding: 0px;"></iframe>');
        ScreenFix++;
    } /*, 2000);*/ );
    var LiveViewClick = 0;
    $('#liveviewid').click(function() {
        $('#LiveViewPane').addClass("active");
        createFreqChart();

    });

    $('#screenshotid').click(function() {
        $('div#screenshotiframediv').html('<iframe id="screenshotiframe" src="http://192.168.1.1/image.png" scrolling="no" style="width: 640px; height: 480px;border: 0px;padding: 0px;"></iframe>');
        //		setInterval($('#screenshotiframe').attr('src', $('#screenshotiframe').attr('src')), 2000);
    });

    function AnalyzeChartAddSeries(name, FinalWaveForm, waveStart, waveInterval, xAxis, yAxis, chartType) {
        AnalyzeChart = $('#ushighchart').highcharts();
        waveStart = waveStart * Math.pow(10, 10);
        waveInterval = waveInterval * Math.pow(10, 10);
        setTimeout(function() {
            AnalyzeChart.addSeries({
                name: name,
                type: chartType,
                data: FinalWaveForm,
                pointStart: waveStart,
                pointInterval: waveInterval,
                xAxis: xAxis,
                yAxis: yAxis
            }, false);
            AnalyzeChart.redraw();
        }, 300);
        AcquiredSeriesCounter++;
    };
    $('#savewaveform').click(function() {
        name = $("#waveformnameinput").val();
        var AcquiredWaveForm = CurrentWaveform[9].split(',');
        var waveInterval = parseFloat(CurrentWaveform[2]);
        var waveStart = parseFloat(CurrentWaveform[3]);
        if (CurrentWaveform[4] = '"s"') {
            var xAxis = 0;
        } else if (CurrentWaveform[4] = '"f"') {
            alert("PharmaSonic only supports voltage traces.");
        }
        var AltCounter = 0;
        var yMultiplier = parseFloat(CurrentWaveform[5]);
        var FinalWaveForm = [];
        var WaveFormEntries = AcquiredWaveForm.length;
        if (CurrentWaveform[1] == "Y") {
            var chartType = 'spline';
            for (var i = 0; i < WaveFormEntries; i++) {
                FinalWaveForm[i] = parseFloat(AcquiredWaveForm[i]) * yMultiplier;
            }
        }
        //AcquiredWaveForm = $.map(AcquiredWaveForm, function(value){return (parseFloat(value) * yMultiplier);});
        else if (CurrentWaveform[1] == "ENVELOPE") {
            var chartType = 'arearange';
            for (var i = 0; i < WaveFormEntries; i++) {
                if (i % 2 == 0) {
                    FinalWaveForm.push([parseFloat(waveInterval * i * Math.pow(10, 10)), parseFloat(AcquiredWaveForm[i]) * yMultiplier, parseFloat(AcquiredWaveForm[i + 1]) * yMultiplier]);
                }
            }
            //FinalWaveForm[i / 2] = [[parseFloat(waveInterval*i*Math.pow(10,10)), parseFloat(AcquiredWaveForm[i]) * yMultiplier, parseFloat(AcquiredWaveForm[i+1]) * yMultiplier]];}}
            //AcquiredWaveForm = $.map(AcquiredWaveForm, function(val, i) { if(i % 2 == 0) {return [[parseFloat(waveInterval*i*Math.pow(10,10)), parseFloat(val) * yMultiplier, parseFloat(AcquiredWaveForm[i+1]) * yMultiplier]];} });
        }
        if (CurrentWaveform[8] == '"V"') {
            var yAxis = 0;
        } else if (CurrentWaveform[8] == '"dB"') {
            alert("PharmaSonic only supports voltage traces.");
        }
        AnalyzeChartAddSeries(name, FinalWaveForm, waveStart, waveInterval, xAxis, yAxis, chartType);

    });
    $('#setsettingsid').click(function() {
        alert("YO");
        $('#setsettingsid').button('loading');
    });
    $('#savewaveformhome').click(function() {
        name = $("#waveformnameinputhome").val();
        var AcquiredWaveForm = CurrentWaveform[7].split(',');
        var waveInterval = parseFloat(CurrentWaveform.splice(0, 1));
        var waveStart = parseFloat(CurrentWaveform.splice(0, 1));
        if (CurrentWaveform[0] = '"s"') {
            var xAxis = 0;
        } else if (CurrentWaveform[0] = '"f"') {
            alert("need to program frequency domain");
        }
        CurrentWaveform.splice(0, 1);
        var yMultiplier = parseFloat(CurrentWaveform.splice(0, 1));
        AcquiredWaveForm = $.map(AcquiredWaveForm, function(value) {
            return (parseFloat(value) * yMultiplier);
        });
        CurrentWaveform.splice(0, 2);
        if (CurrentWaveform[0] = '"V"') {
            var yAxis = 0;
        } else if (CurrentWaveform[0] = '"dB"') {
            alert("need to program dB");
        }
        alert("This is SaveWaveFormHome#");
        CurrentWaveform.splice(0, 1);
        if (AnalyzeCount == 0) {
            AcquiredSeriesOptions[AcquiredSeriesCounter] = {
                name: name,
                data: AcquiredWaveForm,
                //pointStart: waveStart,
                pointInterval: waveInterval,
                xAxis: xAxis,
                yAxis: yAxis
            };
            AcquiredSeriesCounter++;
            return;
        };
        AnalyzeChartAddSeries(name, AcquiredWaveForm, waveStart, waveInterval, xAxis, yAxis);
    });

    function onStepperComplete(evt) {
        if (rotateAdjust == 1) {
            rotateAdjust = 0;
            setTimeout(function() {
                stepper.step(-160, 1.8);
            }, 100);
        } else if (rotateAdjust == 2) {
            rotateAdjust = 0;
            setTimeout(function() {
                stepper.step(160, 1.8);
            }, 100);
        } else if (rotateAdjust == 3) {
            rotateAdjust = 0;
            setTimeout(function() {
                stepper.step(-160, 1.8);
            }, 100);
        } else if (rotateAdjust == 4) {
            rotateAdjust = 0;
            setTimeout(function() {
                stepper.step(160, 1.8);
            }, 100);
        } else {
            $('#stepperstart').button('reset');
            EndTime = new Date().getTime();
            //StepperEnable.value = Pin.HIGH;

            var TotalTime;
            TotalTime = EndTime - StartTime;
            $('div#elapsedtime').html('Elapsed Time (ms): <strong>' + TotalTime + '</strong>');
        }
    }
    $('#numSteps').change(function(evt) {
        if (this.value <= 2097151 && this.value >= -2097151) {
            numSteps = this.value * numMicroSteps;
        }
    });
    // Create the chart
    $('#highchart').highcharts('StockChart', {
        chart: {
            events: {
                load: function() {

                    // set up the updating of the chart each second
                    var series = this.series[0];
                    setInterval(function() {
                        var x = (new Date()).getTime(), // current time
                            y = FFGetData();
                        series.addPoint([x, y], true, true);
                    }, 500);
                }
            }
        },
        scrollbar: {
            enabled: false
        },
        rangeSelector: {
            selected: 1,
            enabled: false,
        },


        title: {
            text: 'Pressure Readings',
            style: {
                color: '#333333',
                fontSize: '14px',
                fontFamily: 'Helvetica',
                fontWeight: 'bold'
            }
        },
        credits: {
            enabled: false
        },
        exporting: {
            enabled: true
        },
        yAxis: [{ // Primary yAxis
            labels: {
                format: '{value}',
                style: {
                    color: '#000000'
                }
            },
            title: {
                text: 'Voltage (5V Scaled to 100)',
                style: {
                    color: '#444444'
                }
            }
        }, { // Secondary yAxis
            title: {
                text: 'Kilograms Force (kgf)',
                style: {
                    color: '#0480be'
                }
            },
            labels: {
                format: '{value} kg',
                style: {
                    color: '#000000'
                }
            },
            opposite: true
        }],

        series: [{
            name: 'Channel B Pressure',
            type: 'areaspline',
            data: (function() {
                // generate an array of random data
                var data = [],
                    time = ((new Date()).getTime() - 1000 * 60 * 60 * 4),
                    i;

                for (i = -999; i <= 0; i++) {
                    data.push([
                        time + i * 1000,
                        Math.round(Math.random() * 0)
                    ]);
                }
                return data;
            })()

        }]
    });
});
