registerProcessor('onePole-processor', class extends AudioWorkletProcessor {
    static get parameterDescriptors() { return [{ name: 'coef', defaultValue: 0.99 }] }

    // read the spec! https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process
    process(inputs, outputs, parameters) {
        // inputs[n][m][i] will access n-th input, m-th channel of that input, and i-th sample of that channel.
        // loop through every channel, and every sample for every channel
        let monoInput = inputs[0][0];
        for (let sampleIdx = 0; sampleIdx < monoInput.length; ++sampleIdx) {
            if(sampleIdx === 0){
                outputs[0][0][sampleIdx] = monoInput[sampleIdx]
            }
            else{
                outputs[0][0][sampleIdx] = ((1 - parameters.coef) * monoInput[sampleIdx] + (parameters.coef * outputs[0][0][sampleIdx-1]))
            }
        }
        // out(i) = ((1 - abs(coef)) * in(i)) + (coef * out(i-1)). - https://doc.sccode.org/Classes/OnePole.html

        //Returns "a Boolean value indicating whether or not to force the AudioWorkletNode to remain active even if the user agent's internal logic would otherwise decide that it's safe to shut down the node."
        return true; //this should be false, but isnt working for me at the moment
    }
})