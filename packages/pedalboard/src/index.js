// eslint-disable-next-line no-use-before-define
import React from 'react';
import ReactDOM from 'react-dom';
import { WebAudioModule } from 'sdk';
import wamEnvProcessor from 'sdk/src/WamEnv.js';

import Pedalboard from './components/Pedalboard.js';
import PedalboardAudioNode from './audio/PedalboardAudioNode.js';
import processor from './audio/WamProcessor.js';
import descriptor from './descriptor.json';

export default class PedalboardPlugin extends WebAudioModule {
	initialize(state) {
		Object.assign(this.descriptor, descriptor);
		return super.initialize(state);
	}

	async createAudioNode(initialState) {
		const wamEnv = window.URL.createObjectURL(new Blob([`(${wamEnvProcessor.toString()})();`], { type: 'text/javascript' }));
		const url = window.URL.createObjectURL(new Blob([`(${processor.toString()})(${JSON.stringify(this.moduleId)});`], { type: 'text/javascript' }));
		await this.audioContext.audioWorklet.addModule(wamEnv);
		await this.audioContext.audioWorklet.addModule(url);
		const pedalboardAudioNode = new PedalboardAudioNode(this);

		if (initialState) pedalboardAudioNode.setState(initialState);
		return pedalboardAudioNode;
	}

	createGui() {
		const root = document.createElement('div');
		ReactDOM.render(<Pedalboard audioNode={this.audioNode} />, root);
		return root;
	}
}
