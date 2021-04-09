/* eslint-disable max-len */
/* eslint-disable no-undef */
/** @typedef {import('../sdk/src/api/types').AudioWorkletProcessor} AudioWorkletProcessor */
/** @typedef {import('../sdk/src/api/types').AudioWorkletGlobalScope} AudioWorkletGlobalScope */
/** @template T @typedef {import('../sdk/src/ParamMgr/TypedAudioWorklet').TypedAudioParamDescriptor} TypedAudioParamDescriptor */

/** @typedef {'pause' | 'length' | 'pitchMin' | 'pitchMax' | 'velocityMin' | 'velocityMax' | 'destroyed'} P */

//@ts-check

/** @type {AudioWorkletGlobalScope} */
// @ts-ignore
const audioWorkletGlobalScope = globalThis;
const { AudioWorkletProcessor, registerProcessor } = audioWorkletGlobalScope;

class MetronomeProcessor extends AudioWorkletProcessor {
	// @ts-ignore
	static get parameterDescriptors() {
		return [
            {
                name: 'destroyed',
                defaultValue: 0,
                minValue: 0,
                maxValue: 1,
            }
        ];
	}

	constructor(options) {
		super(options);
		this.proxyId = options.processorOptions.proxyId;
		this.lastBeat = -1;
	}

	get proxy() {
        // @ts-ignore
		const { webAudioModules } = audioWorkletGlobalScope;
		return webAudioModules?.processors[this.proxyId];
	}

	/**
	 * Main process
	 *
	 * @param {Float32Array[][]} inputs
	 * @param {Float32Array[][]} outputs
	 * @param {Record<P, Float32Array>} parameters
	 */
     process (inputs, outputs, parameters) {
		const destroyed = parameters.destroyed[0];
		if (destroyed) return false;
		if (!this.proxy) return true;

        const { webAudioModules, currentTime } = audioWorkletGlobalScope;

        var transportEvents = webAudioModules.getTransportEvents(currentTime, currentTime)
		if (transportEvents.length == 0) {
			return true
		}

		// @ts-ignore
		var transport = transportEvents[0]
		
		if (transport.playing) {
			var barPosition = webAudioModules.getBarPosition(currentTime)
			var beatPosition = barPosition * transport.beatsPerBar

			if (Math.floor(beatPosition) > this.lastBeat) {
				this.proxy.emitEvents({ type: 'midi', time: currentTime, data: { bytes: [0b10010000, 64, 100] } });
				this.proxy.emitEvents({ type: 'midi', time: currentTime + 0.01, data: { bytes: [0b10010000, 64, 0] } });
				this.lastBeat = beatPosition
			}
		}
		
		return true;
	}
}

try {
	registerProcessor('pianoroll-processor', MetronomeProcessor);
} catch (error) {
	// eslint-disable-next-line no-console
	console.warn(error);
}