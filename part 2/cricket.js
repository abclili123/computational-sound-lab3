let audioCtx;
let field;
let volume;
let cric = false;

function initAudio(){
    audioCtx = new (window.AudioContext || window.webkitAudioContext);
    var bufferSize = 10 * audioCtx.sampleRate,
        noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate),
        output = noiseBuffer.getChannelData(0);

    let lastOut = 0;
    let brown;
    for (let i = 0; i < bufferSize; i++) {
        brown = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * brown)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
    }

    field = audioCtx.createBufferSource();
    field.buffer = noiseBuffer;
    field.loop = true;
    field.start(0)

    // global gain
    volume = audioCtx.createGain()
    volume.gain.value = 0
    volume.connect(audioCtx.destination)
    cricket();
    volume.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime+1)
}

// cricket p. 34
function cricket(){
    // gain Node
    const gainNode = audioCtx.createGain()
    gainNode.gain.value = 0.4

    let x = 4000
    // fund
    const fund = audioCtx.createOscillator();
    fund.type = 'sawtooth'
    fund.frequency.value = x;
    fund.start()

    // creates thumping sound friction from scraping
    const low = audioCtx.createOscillator();
    low.frequency.value = 8;
    const lGain = audioCtx.createGain()
    lGain.gain.value = 1
    low.connect(lGain)
    low.start()

    // part
    const part = audioCtx.createOscillator();
    part.type = 'sawtooth'
    part.frequency.value = x*2;
    const pGain = audioCtx.createGain()
    pGain.gain.value = 0.3
    part.connect(pGain)
    part.start()

    // phasor
    const phasor = audioCtx.createOscillator();
    phasor.type = 'triangle';
    phasor.frequency.value = 1.73;
    phasor.connect(gainNode.gain)
    phasor.start()

    // am on cricket
    var modulatorFreq = audioCtx.createOscillator();
    modulatorFreq.frequency.value = 58;
    const modulated = audioCtx.createGain();
    const depth = audioCtx.createGain();
    depth.gain.value = 0.5 //scale modulator output to [-0.5, 0.5]
    modulated.gain.value = 1.0 - depth.gain.value; //a fixed value of 0.5
    modulatorFreq.connect(depth).connect(modulated.gain); //.connect is additive, so with [-0.5,0.5] and 0.5, the modulated signal now has output gain at [0,1]
    fund.connect(modulated)
    pGain.connect(modulated)
    lGain.connect(modulated)
    modulated.connect(gainNode);
    modulatorFreq.start()

    field.connect(volume)

    gainNode.connect(volume)
}

const but = document.getElementById('cric');
but.addEventListener('click', function () {

    if (!audioCtx) {
        initAudio();
    }

    if (!cric) {
        volume.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime+1)
        cric = true
    }
    else{
        volume.gain.linearRampToValueAtTime(0, audioCtx.currentTime+0.5)
        cric = false
    }

}, false);