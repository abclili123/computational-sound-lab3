let audioCtx;
let brownNoise;
let volume;

function initAudio(){
    audioCtx = new (window.AudioContext || window.webkitAudioContext);
    var bufferSize = 10 * audioCtx.sampleRate,
        noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate),
        output = noiseBuffer.getChannelData(0);

    var lastOut = 0;
    var brown;
    for (let i = 0; i < bufferSize; i++) {
        brown = Math.random() * 2 - 1;

        output[i] = (lastOut + (0.02 * brown)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
    }

    brownNoise = audioCtx.createBufferSource();
    brownNoise.buffer = noiseBuffer;
    brownNoise.loop = true;

    volume = audioCtx.createGain()
    volume.gain.value = 0
    volume.connect(audioCtx.destination)
    playBabble();
    volume.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime+1)
}

function playBabble(){
    //await audioCtx.audioWorklet.addModule("worklet.js");

    // put filters on brown noise
    // {RHPF.ar(LPF.ar(BrownNoise.ar(), 400), LPF.ar(BrownNoise.ar(), 14) * 400 + 500, 0.03, 0.1)}.play

    // LPF.ar(BrownNoise.ar(), 400
    /*let myOnePole = new AudioWorkletNode(audioCtx, "onePole-processor");
    myOnePole.parameters.get('coef').value = 0.99
    brownNoise.connect(myOnePole)*/

    const lpfA = audioCtx.createBiquadFilter();
    lpfA.type = "lowpass";
    lpfA.frequency.setValueAtTime(400, audioCtx.currentTime);
    brownNoise.connect(lpfA)

    // LPF.ar(BrownNoise.ar(), 14) * 400 + 500
    const lpfB = audioCtx.createBiquadFilter();
    lpfB.type = "lowpass";
    lpfB.frequency.setValueAtTime(14, audioCtx.currentTime);
    lpfB.gain.value = 400;
    const constantSource = audioCtx.createConstantSource();
    constantSource.offset.value = 500
    constantSource.connect(lpfB)
    constantSource.start();
    brownNoise.connect(lpfB)

    // RHPF
    const rhpf = audioCtx.createBiquadFilter();
    rhpf.type = "highpass";
    //lpfB.connect(rhpf.frequency); // connect LPF.ar(BrownNoise.ar(), 14) * 400 + 500) as cutoff of RHPF
    rhpf.Q.value = 30; // 0.03
    const gainNode = audioCtx.createGain(); // 0.1 is gain
    rhpf.connect(gainNode);
    lpfA.connect(rhpf) // connect LPF.ar(BrownNoise.ar(), 400) as source for RHPF

    // {RHPF.ar(OnePole.ar(BrownNoise.ar, 0.99), LPF.ar(BrownNoise.ar, 20) * 800 + 1000, 0.03, 0.005)}
    /*const lpfC = audioCtx.createBiquadFilter();
     lpfC.type = "lowpass";
     lpfC.frequency.setValueAtTime(20, audioCtx.currentTime);
     lpfC.gain.value = 800;
     const constantSource2 = audioCtx.createConstantSource();
     constantSource2.offset.value = 650
     constantSource2.connect(lpfC)
     constantSource2.start();
     brownNoise.connect(lpfC)

     const rhpf2 = audioCtx.createBiquadFilter();
     rhpf2.type = "highpass";
     lpfC.connect(rhpf2.frequency);
     rhpf2.Q.value = 33;
     rhpf2.connect(gainNode);
     lpfA.connect(rhpf2)*/

    // am on lpfb
    var modulatorFreq = audioCtx.createOscillator();
    modulatorFreq.frequency.value = 6;
    const modulated = audioCtx.createGain();
    const depth = audioCtx.createGain();
    depth.gain.value = 0.5 //scale modulator output to [-0.5, 0.5]
    modulated.gain.value = 0.9 - depth.gain.value; //a fixed value of 0.5
    modulatorFreq.connect(depth).connect(modulated.gain); //.connect is additive, so with [-0.5,0.5] and 0.5, the modulated signal now has output gain at [0,1]
    lpfB.connect(modulated)
    modulated.connect(rhpf.frequency);
    //modulated.connect(rhpf2.frequency)
    modulatorFreq.start();

    // delay adds bubbling effect i think by some type of phase cancellation
    const delay = audioCtx.createDelay(5);
    delay.delayTime.setValueAtTime(612/1000 , audioCtx.currentTime);

    gainNode.connect(delay).connect(volume)
    gainNode.connect(volume)
}

const playButton = document.getElementById('play');
playButton.addEventListener('click', function () {

    if (!audioCtx) {
        initAudio();
    }

    brownNoise.start()
    volume.gain.linearRampToValueAtTime(0, audioCtx.currentTime+15);
    brownNoise.stop(audioCtx.currentTime+16)

}, false);